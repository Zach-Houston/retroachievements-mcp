import { buildAuthorization, type AuthObject } from "@retroachievements/api";
import {
  credentialsPath,
  inspectStoredCredentials,
  loadStoredCredentials,
} from "./storage.js";

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
      "Two ways to fix this from chat -- pick whichever the user prefers:",
      "",
      "  Option A (fastest, but key is visible in chat history):",
      "    Ask the user for their RetroAchievements username and Web API Key,",
      "    then call the `ra_save_credentials` tool with the values they typed.",
      "",
      "  Option B (key stays out of chat):",
      "    Call `ra_prepare_credentials_file` -- it writes a placeholder file at",
      "    the path below and returns a clickable file:// URL. Tell the user to",
      "    open the file, replace the placeholder with their key, and save.",
      "    The server picks it up on the next call.",
      "",
      `The Web API Key lives at: ${API_KEY_URL}`,
      `(Need an account first? ${SIGNUP_URL})`,
      "",
      `Credentials file: ${credentialsPath()}`,
      "",
      "You can also set RA_USERNAME and RA_API_KEY env vars in your MCP client",
      "config to skip both flows entirely.",
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

export type CredentialsSource = "env" | "file" | "file-pending" | "none";

export async function describeCredentials(): Promise<{
  source: CredentialsSource;
  username: string | null;
}> {
  if (process.env.RA_USERNAME && process.env.RA_API_KEY) {
    return { source: "env", username: process.env.RA_USERNAME };
  }

  const state = await inspectStoredCredentials();
  if (state.status === "configured") {
    return { source: "file", username: state.credentials.username };
  }
  if (state.status === "placeholder") {
    return { source: "file-pending", username: null };
  }
  return { source: "none", username: null };
}
