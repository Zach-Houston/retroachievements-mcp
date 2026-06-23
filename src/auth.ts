import { buildAuthorization, type AuthObject } from "@retroachievements/api";

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
      "To set them up:",
      `  1. Sign in (or create an account) at ${SIGNUP_URL}`,
      `  2. Open ${API_KEY_URL} and copy your Web API Key`,
      "  3. Set two environment variables for this MCP server:",
      "       RA_USERNAME = your RetroAchievements username",
      "       RA_API_KEY  = the Web API Key from step 2",
      "",
      "If you cloned this repo, run `npm run setup` to do this interactively.",
      "Otherwise, add the env vars to your MCP client config (see README).",
    ].join("\n");
  }
}

export function getAuth(): AuthObject {
  const username = process.env.RA_USERNAME;
  const webApiKey = process.env.RA_API_KEY;

  if (!username || !webApiKey) {
    throw new MissingCredentialsError();
  }

  return buildAuthorization({ username, webApiKey });
}

export function hasCredentials(): boolean {
  return Boolean(process.env.RA_USERNAME && process.env.RA_API_KEY);
}
