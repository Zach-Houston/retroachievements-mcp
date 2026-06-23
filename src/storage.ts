import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

export interface StoredCredentials {
  username: string;
  webApiKey: string;
}

export function credentialsPath(): string {
  return join(configDir(), "credentials.json");
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

export async function loadStoredCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await readFile(credentialsPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.username === "string" &&
      typeof parsed?.webApiKey === "string" &&
      parsed.username &&
      parsed.webApiKey
    ) {
      return { username: parsed.username, webApiKey: parsed.webApiKey };
    }
    return null;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function saveStoredCredentials(creds: StoredCredentials): Promise<string> {
  const path = credentialsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(creds, null, 2), "utf8");
  if (platform() !== "win32") {
    try {
      await chmod(path, 0o600);
    } catch {
      // chmod can fail on some filesystems; non-fatal
    }
  }
  return path;
}
