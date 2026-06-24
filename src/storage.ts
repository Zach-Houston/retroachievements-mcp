import { mkdir, readFile, writeFile, chmod, access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { homedir, platform } from "node:os";
import { dirname, join, sep } from "node:path";
import { pathToFileURL } from "node:url";

export interface StoredCredentials {
  username: string;
  webApiKey: string;
}

export type StoredCredentialsState =
  | { status: "configured"; credentials: StoredCredentials }
  | { status: "placeholder" }
  | { status: "missing" };

const USERNAME_KEY = "RA_USERNAME";
const API_KEY_KEY = "RA_API_KEY";
const PLACEHOLDER_USERNAME = "<your-retroachievements-username>";
const PLACEHOLDER_API_KEY = "<paste-your-web-api-key-here>";

export function credentialsPath(): string {
  return join(configDir(), "credentials.env");
}

export function credentialsFileUrl(): string {
  return pathToFileURL(credentialsPath()).href;
}

export function credentialsDirUrl(): string {
  return pathToFileURL(configDir() + sep).href;
}

export function configDir(): string {
  const home = homedir();
  if (platform() === "win32") {
    return join(process.env.APPDATA ?? home, "retroachievements-mcp");
  }
  if (platform() === "darwin") {
    return join(home, "Library", "Application Support", "retroachievements-mcp");
  }
  return join(
    process.env.XDG_CONFIG_HOME ?? join(home, ".config"),
    "retroachievements-mcp"
  );
}

export async function inspectStoredCredentials(): Promise<StoredCredentialsState> {
  const parsed = await readEnvFile(credentialsPath());
  if (parsed === null) return { status: "missing" };

  const username = parsed.get(USERNAME_KEY) ?? "";
  const webApiKey = parsed.get(API_KEY_KEY) ?? "";

  if (!username || !webApiKey || isPlaceholder(username) || isPlaceholder(webApiKey)) {
    return { status: "placeholder" };
  }

  return { status: "configured", credentials: { username, webApiKey } };
}

export async function loadStoredCredentials(): Promise<StoredCredentials | null> {
  const state = await inspectStoredCredentials();
  return state.status === "configured" ? state.credentials : null;
}

export async function saveStoredCredentials(
  creds: StoredCredentials
): Promise<string> {
  const path = credentialsPath();
  await mkdir(dirname(path), { recursive: true });

  const body = [
    "# retroachievements-mcp credentials",
    "# This file was written by ra_save_credentials.",
    "# Anyone with read access to this file can call the API as you.",
    "",
    `${USERNAME_KEY}=${creds.username}`,
    `${API_KEY_KEY}=${creds.webApiKey}`,
    "",
  ].join("\n");

  await writeFile(path, body, "utf8");
  await tighten(path);
  return path;
}

export interface PreparedFile {
  path: string;
  fileUrl: string;
  directoryUrl: string;
  created: boolean;
  alreadyConfigured: boolean;
  revealedInFileManager: boolean;
}

export async function prepareCredentialsFile(opts?: {
  username?: string;
  reveal?: boolean;
}): Promise<PreparedFile> {
  const path = credentialsPath();
  const existed = await fileExists(path);

  if (existed) {
    const state = await inspectStoredCredentials();
    if (state.status === "configured") {
      return {
        path,
        fileUrl: credentialsFileUrl(),
        directoryUrl: credentialsDirUrl(),
        created: false,
        alreadyConfigured: true,
        revealedInFileManager: false,
      };
    }
  }

  await mkdir(dirname(path), { recursive: true });

  const username = opts?.username?.trim() || PLACEHOLDER_USERNAME;
  const body = [
    "# retroachievements-mcp credentials",
    "# Paste your Web API Key after RA_API_KEY=",
    "# Get one at https://retroachievements.org/controlpanel.php",
    "# Save the file when done -- the server picks it up on the next call.",
    "#",
    "# IMPORTANT (Windows): if you used Notepad, make sure the saved",
    "# file is credentials.env, not credentials.env.txt. Notepad hides",
    "# extensions by default and may add .txt silently.",
    "",
    `${USERNAME_KEY}=${username}`,
    `${API_KEY_KEY}=${PLACEHOLDER_API_KEY}`,
    "",
  ].join("\n");

  await writeFile(path, body, "utf8");
  await tighten(path);

  const reveal = opts?.reveal ?? true;
  const revealed = reveal ? revealInFileManager(path) : false;

  return {
    path,
    fileUrl: credentialsFileUrl(),
    directoryUrl: credentialsDirUrl(),
    created: !existed,
    alreadyConfigured: false,
    revealedInFileManager: revealed,
  };
}

function revealInFileManager(path: string): boolean {
  try {
    const plat = platform();
    if (plat === "win32") {
      spawn("explorer.exe", [`/select,${path}`], {
        detached: true,
        stdio: "ignore",
      }).unref();
      return true;
    }
    if (plat === "darwin") {
      spawn("open", ["-R", path], { detached: true, stdio: "ignore" }).unref();
      return true;
    }
    spawn("xdg-open", [dirname(path)], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return true;
  } catch {
    return false;
  }
}

async function readEnvFile(path: string): Promise<Map<string, string> | null> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  const out = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.set(match[1], value);
  }
  return out;
}

function isPlaceholder(value: string): boolean {
  return /^<.*>$/.test(value.trim());
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function tighten(path: string): Promise<void> {
  if (platform() === "win32") return;
  try {
    await chmod(path, 0o600);
  } catch {
    // chmod can fail on some filesystems; non-fatal
  }
}
