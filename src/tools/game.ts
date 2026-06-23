import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGame, getGameExtended } from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

export function registerGameTools(server: McpServer): void {
  server.registerTool(
    "ra_game",
    {
      title: "Get game metadata",
      description:
        "Basic metadata for a game by ID: title, console, developer, publisher, genre, release date, box art.",
      inputSchema: {
        gameId: z.number().int().positive().describe("RetroAchievements game ID"),
      },
    },
    async ({ gameId }) =>
      safeCall(async () => getGame(await getAuth(), { gameId }))
  );

  server.registerTool(
    "ra_game_extended",
    {
      title: "Get extended game info",
      description:
        "Full game info including the achievement list (id, title, description, points, badge, unlock counts).",
      inputSchema: {
        gameId: z.number().int().positive().describe("RetroAchievements game ID"),
        isRequestingUnofficialAchievements: z
          .boolean()
          .optional()
          .describe("Include unofficial / dev-only achievements (default false)"),
      },
    },
    async ({ gameId, isRequestingUnofficialAchievements }) =>
      safeCall(async () =>
        getGameExtended(await getAuth(), {
          gameId,
          isRequestingUnofficialAchievements,
        })
      )
  );
}
