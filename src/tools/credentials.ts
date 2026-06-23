import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildAuthorization, getUserProfile } from "@retroachievements/api";
import {
  API_KEY_URL,
  SIGNUP_URL,
  describeCredentials,
} from "../auth.js";
import {
  credentialsDirUrl,
  credentialsFileUrl,
  credentialsPath,
  prepareCredentialsFile,
  saveStoredCredentials,
} from "../storage.js";
import { errorResult, jsonResult } from "../util.js";

export function registerCredentialsTools(server: McpServer): void {
  server.registerTool(
    "ra_status",
    {
      title: "Check RetroAchievements MCP setup status",
      description:
        "Reports whether RetroAchievements credentials are configured and where they came from. Source is one of: env, file (saved and valid), file-pending (placeholder file exists but key not pasted yet), or none. Call this if you're unsure whether the server is ready.",
      inputSchema: {},
    },
    async () => {
      const { source, username } = await describeCredentials();
      const configured = source === "env" || source === "file";

      let nextStep: string;
      if (configured) {
        nextStep = "Ready to use. Try any ra_* tool.";
      } else if (source === "file-pending") {
        nextStep =
          "A placeholder credentials file already exists. Ask the user to open " +
          credentialsFileUrl() +
          " and paste their Web API Key, then save. The server will pick it up on the next call.";
      } else {
        nextStep =
          "Ask the user how they prefer to set up credentials: " +
          "(A) paste their key in chat and you call ra_save_credentials, or " +
          "(B) call ra_prepare_credentials_file to scaffold a file they edit locally.";
      }

      return jsonResult({
        configured,
        source,
        username,
        credentialsFile: credentialsPath(),
        credentialsFileUrl: credentialsFileUrl(),
        helpUrls: configured
          ? undefined
          : { apiKey: API_KEY_URL, signup: SIGNUP_URL },
        nextStep,
      });
    }
  );

  server.registerTool(
    "ra_save_credentials",
    {
      title: "Save RetroAchievements credentials (in-chat flow)",
      description:
        "Validate a RetroAchievements username + Web API key against the live API, then persist them to a local config file. " +
        "USE ONLY with values the user typed in chat themselves -- never guess or fabricate an API key. " +
        "WARNING: the key will be visible in the chat transcript. If the user prefers to keep the key out of chat, call ra_prepare_credentials_file instead.",
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

  server.registerTool(
    "ra_prepare_credentials_file",
    {
      title: "Scaffold a credentials file the user edits (out-of-chat flow)",
      description:
        "Writes a placeholder credentials file to the user's config directory and returns a clickable file:// URL. " +
        "Use this when the user prefers NOT to paste their API key into chat. " +
        "After calling, tell the user: (1) open the linked file, (2) replace the placeholder after RA_API_KEY= with their real Web API Key, (3) save. " +
        "The server will pick up the values on the next ra_* call -- you can confirm by calling ra_status.",
      inputSchema: {
        username: z
          .string()
          .optional()
          .describe(
            "Optional. If the user is willing to share their username in chat, prefill it here so they only need to paste the API key. Otherwise omit and they'll fill it in the file too."
          ),
      },
    },
    async ({ username }) => {
      try {
        const result = await prepareCredentialsFile({ username });

        if (result.alreadyConfigured) {
          return jsonResult({
            status: "already-configured",
            path: result.path,
            fileUrl: result.fileUrl,
            message:
              "A valid credentials file already exists at this path. No changes made. Call ra_status to confirm.",
          });
        }

        return jsonResult({
          status: result.created ? "created" : "rewritten",
          path: result.path,
          fileUrl: result.fileUrl,
          directoryUrl: credentialsDirUrl(),
          instructions: [
            `Open the file: ${result.fileUrl}`,
            `Get your Web API Key from: ${API_KEY_URL}`,
            "In the file, replace the placeholder after RA_API_KEY= with your real key.",
            result.created || !username
              ? "Also confirm the RA_USERNAME line shows your real username."
              : `Your username (${username}) has been prefilled -- just paste the API key.`,
            "Save the file. The next ra_* tool call will use it automatically.",
          ],
          tellTheUser:
            "I created a credentials file on your machine. Open the file:// link, paste your Web API Key where indicated, save it, and we're done. Nothing sensitive goes through chat.",
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
