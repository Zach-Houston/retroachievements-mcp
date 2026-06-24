import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConsoleIds, getGameList } from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

export function registerConsoleTools(server: McpServer): void {
  server.registerTool(
    "ra_console_ids",
    {
      title: "List all consoles",
      description:
        "Every console RetroAchievements tracks, with IDs and names. Use to translate human names like 'SNES' into the consoleId other tools need.",
      inputSchema: {
        shouldOnlyRetrieveActiveSystems: z
          .boolean()
          .optional()
          .describe("Only consoles currently being actively developed for."),
        shouldOnlyRetrieveGameSystems: z
          .boolean()
          .optional()
          .describe("Exclude non-game systems (events, etc.)."),
      },
    },
    async ({ shouldOnlyRetrieveActiveSystems, shouldOnlyRetrieveGameSystems }) =>
      safeCall(async () =>
        getConsoleIds(await getAuth(), {
          shouldOnlyRetrieveActiveSystems:
            shouldOnlyRetrieveActiveSystems ?? false,
          shouldOnlyRetrieveGameSystems: shouldOnlyRetrieveGameSystems ?? false,
        })
      )
  );

  server.registerTool(
    "ra_game_list",
    {
      title: "List games for a console",
      description:
        "All games on a given console. Optionally filter to games that actually have achievements, or include ROM hashes. Useful for 'find a short game on SNES to master' style recommendations.",
      inputSchema: {
        consoleId: z
          .number()
          .int()
          .positive()
          .describe("Console ID (get from ra_console_ids if unknown)"),
        shouldOnlyRetrieveGamesWithAchievements: z
          .boolean()
          .optional()
          .describe("Hide games with no achievement sets (default false)."),
        shouldRetrieveGameHashes: z
          .boolean()
          .optional()
          .describe("Include ROM hashes for each game (heavier response)."),
      },
    },
    async ({
      consoleId,
      shouldOnlyRetrieveGamesWithAchievements,
      shouldRetrieveGameHashes,
    }) =>
      safeCall(async () =>
        getGameList(await getAuth(), {
          consoleId,
          shouldOnlyRetrieveGamesWithAchievements,
          shouldRetrieveGameHashes,
        })
      )
  );
}
