#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { writeFile, readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { buildAuthorization, getUserProfile } from "@retroachievements/api";
import { API_KEY_URL, SIGNUP_URL } from "./auth.js";

const ENV_PATH = resolve(process.cwd(), ".env");

async function main(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    print("");
    print("=== retroachievements-mcp setup ===");
    print("");
    print("This will configure your RetroAchievements credentials so the MCP");
    print("server can talk to the RetroAchievements API on your behalf.");
    print("");

    if (await envFileExists()) {
      const overwrite = await ask(
        rl,
        `A .env file already exists at ${ENV_PATH}. Overwrite? (y/N): `
      );
      if (!isYes(overwrite)) {
        print("Aborted. Existing .env is unchanged.");
        return;
      }
    }

    const hasAccount = await ask(
      rl,
      "Do you already have a RetroAchievements account? (y/N): "
    );
    if (!isYes(hasAccount)) {
      print("");
      print(`No problem. Create one at:  ${SIGNUP_URL}`);
      print("Then re-run `npm run setup` and pick up here.");
      return;
    }

    print("");
    const username = (await ask(rl, "RetroAchievements username: ")).trim();
    if (!username) {
      print("Username cannot be empty. Aborted.");
      process.exitCode = 1;
      return;
    }

    print("");
    print("Now we need your Web API key.");
    print(`  1. Open ${API_KEY_URL} in a browser`);
    print("  2. Sign in if needed");
    print("  3. Look for the 'Keys' section and copy your Web API Key");
    print("");
    const webApiKey = (await ask(rl, "Web API Key: ")).trim();
    if (!webApiKey) {
      print("API key cannot be empty. Aborted.");
      process.exitCode = 1;
      return;
    }

    print("");
    print("Verifying credentials against the RetroAchievements API...");
    const verified = await verify(username, webApiKey);
    if (!verified.ok) {
      print(`X Verification failed: ${verified.reason}`);
      print("  Double-check the username and API key, then try again.");
      process.exitCode = 1;
      return;
    }
    print(`OK Verified as ${verified.displayName} (${verified.points} points).`);

    await writeEnvFile(username, webApiKey);
    print("");
    print(`Wrote credentials to ${ENV_PATH}`);
    print("");
    print("Next steps:");
    print("  - Run `npm run build` if you haven't already");
    print("  - Add this server to your MCP client config (see README)");
    print("  - When configuring the client, pass RA_USERNAME and RA_API_KEY");
    print("    as `env` entries (the server reads them at startup).");
    print("");
  } finally {
    rl.close();
  }
}

function print(s: string): void {
  stdout.write(s + "\n");
}

function isYes(s: string): boolean {
  return /^y(es)?$/i.test(s.trim());
}

async function ask(
  rl: ReturnType<typeof createInterface>,
  prompt: string
): Promise<string> {
  return rl.question(prompt);
}

async function envFileExists(): Promise<boolean> {
  try {
    await access(ENV_PATH, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeEnvFile(username: string, webApiKey: string): Promise<void> {
  const existing = (await envFileExists())
    ? await readFile(ENV_PATH, "utf8")
    : "";

  const lines = existing.split(/\r?\n/);
  const updated = applyEnvAssignments(lines, {
    RA_USERNAME: username,
    RA_API_KEY: webApiKey,
  });

  await writeFile(ENV_PATH, updated.join("\n"), { encoding: "utf8", mode: 0o600 });
}

function applyEnvAssignments(
  lines: string[],
  assignments: Record<string, string>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/);
    if (match && assignments[match[1]] !== undefined) {
      out.push(`${match[1]}=${assignments[match[1]]}`);
      seen.add(match[1]);
    } else {
      out.push(line);
    }
  }

  for (const [key, value] of Object.entries(assignments)) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  while (out.length > 0 && out[out.length - 1] === "") {
    out.pop();
  }
  out.push("");
  return out;
}

type VerifyResult =
  | { ok: true; displayName: string; points: number }
  | { ok: false; reason: string };

async function verify(username: string, webApiKey: string): Promise<VerifyResult> {
  try {
    const auth = buildAuthorization({ username, webApiKey });
    const profile = await getUserProfile(auth, { username });
    if (!profile || !profile.user) {
      return { ok: false, reason: "API returned an empty profile." };
    }
    return {
      ok: true,
      displayName: profile.user,
      points: profile.totalPoints ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
