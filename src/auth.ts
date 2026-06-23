import { buildAuthorization, type AuthObject } from "@retroachievements/api";
import { credentialsPath, loadStoredCredentials } from "./storage.js";

export const API_KEY_URL = "https://retroachievements.org/controlpanel.php";
export const SIGNUP_URL = "https://retroachievements.org/createaccount.php";

export class MissingCredentialsError extends Error {
  constructor() {
    super("Missing RetroAchievements credentials.");
    this.name = "MissingCredentialsError";
  }

  static helpText(): string {
    return [
      "RetroAchievements credentials are not configured.",
      "",
      "Easiest fix from inside an MCP-aware chat: ask the user for their",
      "RetroAchievements username and Web API key, then call the",
      "`ra_save_credentials` tool to validate and persist them.",
      "",
      `The Web API Key lives at: ${API_KEY_URL}`,
      `(Need an account first? ${SIGNUP_URL})`,
      "",
      "Alternative setup options:",
      "  - Set RA_USERNAME and RA_API_KEY env vars in your MCP client config",
      "  - Run `npm run setup` in the project to do it interactively",
      "",
      `Stored credentials live at: ${credentialsPath()}`,
    ].join("\n");
  }
}

export async function getAuth(): Promise<AuthObject> {
  const envUsername = process.env.RA_USERNAME;
  const envApiKey = process.env.RA_API_KEY;
  if (envUsername && envApiKey) {
    return buildAuthorization({ username: envUsername, webApiKey: envApiKey });
  }

  const stored = await loadStoredCredentials();
  if (stored) {
    return buildAuthorization(stored);
  }

  throw new MissingCredentialsError();
}

export async function hasCredentials(): Promise<boolean> {
  if (process.env.RA_USERNAME && process.env.RA_API_KEY) return true;
  const stored = await loadStoredCredentials();
  return stored !== null;
}

export async function configuredUsername(): Promise<string | null> {
  if (process.env.RA_USERNAME) return process.env.RA_USERNAME;
  const stored = await loadStoredCredentials();
  return stored?.username ?? null;
}

export function credentialsSource(): "env" | "file" | "none" {
  if (process.env.RA_USERNAME && process.env.RA_API_KEY) return "env";
  return "none";
}
