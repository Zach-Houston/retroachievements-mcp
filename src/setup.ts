#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { buildAuthorization, getUserProfile } from "@retroachievements/api";
import { API_KEY_URL, SIGNUP_URL } from "./auth.js";
import { credentialsPath, saveStoredCredentials } from "./storage.js";

async function main(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    print("");
    print("=== retroachievements-mcp setup ===");
    print("");
    print("This will configure your RetroAchievements credentials so the MCP");
    print("server can talk to the RetroAchievements API on your behalf.");
    print(`Credentials will be saved to:  ${credentialsPath()}`);
    print("");

    const hasAccount = await rl.question(
      "Do you already have a RetroAchievements account? (y/N): "
    );
    if (!isYes(hasAccount)) {
      print("");
      print(`No problem. Create one at:  ${SIGNUP_URL}`);
      print("Then re-run `npm run setup` and pick up here.");
      return;
    }

    print("");
    const username = (await rl.question("RetroAchievements username: ")).trim();
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
    const webApiKey = (await rl.question("Web API Key: ")).trim();
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

    const path = await saveStoredCredentials({ username, webApiKey });
    print("");
    print(`Wrote credentials to ${path}`);
    print("");
    print("Next steps:");
    print("  - Run `npm run build` if you haven't already");
    print("  - Add this server to your MCP client config (see README)");
    print("  - You're done -- env vars are NOT required; the server will read");
    print("    from the file above. (You can still override with RA_USERNAME");
    print("    and RA_API_KEY env vars if you prefer.)");
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
