import { buildAuthorization, type AuthObject } from "@retroachievements/api";

export function loadAuth(): AuthObject {
  const username = process.env.RA_USERNAME;
  const webApiKey = process.env.RA_API_KEY;

  if (!username || !webApiKey) {
    throw new Error(
      "Missing RA_USERNAME or RA_API_KEY environment variables. " +
        "Get your Web API key at https://retroachievements.org/controlpanel.php"
    );
  }

  return buildAuthorization({ username, webApiKey });
}
