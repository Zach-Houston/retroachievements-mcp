import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildAuthorization, getUserProfile } from "@retroachievements/api";
import {
  API_KEY_URL,
  SIGNUP_URL,
  configuredUsername,
  credentialsSource,
  hasCredentials,
} from "../auth.js";
import { credentialsPath, saveStoredCredentials } from "../storage.js";
import { errorResult, jsonResult } from "../util.js";

export function registerCredentialsTools(server: McpServer): void {
  server.registerTool(
    "ra_status",
    {
      title: "Check RetroAchievements MCP setup status",
      description:
        "Reports whether RetroAchievements credentials are configured and where they came from (env vars or saved file). Call this first if you're unsure whether the server is ready to use.",
      inputSchema: {},
    },
    async () => {
      const configured = await hasCredentials();
      const source = credentialsSource();
      const username = await configuredUsername();

      const effectiveSource: "env" | "file" | "none" =
        source === "env" ? "env" : configured ? "file" : "none";

      return jsonResult({
        configured,
        source: effectiveSource,
        username,
        credentialsFile: credentialsPath(),
        helpUrls: configured
          ? undefined
          : { apiKey: API_KEY_URL, signup: SIGNUP_URL },
        nextStep: configured
          ? "Ready to use. Try any ra_* tool."
          : "Ask the user for their RetroAchievements username and Web API key (link them to " +
            API_KEY_URL +
            "), then call ra_save_credentials to validate and persist them.",
      });
    }
  );

  server.registerTool(
    "ra_save_credentials",
    {
      title: "Save RetroAchievements credentials",
      description:
        "Validate a RetroAchievements username + Web API key against the live API, then persist them to a local config file so future tool calls work without env vars. " +
        "USE ONLY with values the user typed in chat themselves — never guess or fabricate an API key. " +
        "If the user does not have a key, point them at https://retroachievements.org/controlpanel.php first.",
      inputSchema: {
        username: z
          .string()
          .min(1)
          .describe("The user's RetroAchievements username, as typed by them."),
        webApiKey: z
          .string()
          .min(1)
          .describe(
            "The user's Web API Key from https://retroachievements.org/controlpanel.php, as typed by them. Do not invent this value."
          ),
      },
    },
    async ({ username, webApiKey }) => {
      try {
        const profile = await getUserProfile(
          buildAuthorization({ username, webApiKey }),
          { username }
        );
        if (!profile || !profile.user) {
          return errorResult(
            new Error(
              "The RetroAchievements API accepted the request but returned no profile. Double-check the username spelling."
            )
          );
        }

        const path = await saveStoredCredentials({ username, webApiKey });

        return jsonResult({
          saved: true,
          path,
          verifiedUser: profile.user,
          totalPoints: profile.totalPoints,
          message: `Credentials verified and saved for ${profile.user}. You can now call any ra_* tool.`,
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
