import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getLeaderboardEntries,
  getUserGameLeaderboards,
} from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

export function registerLeaderboardTools(server: McpServer): void {
  server.registerTool(
    "ra_leaderboard_entries",
    {
      title: "Get leaderboard entries",
      description:
        "Top entries for a specific leaderboard, paginated. Use for 'show me the speedrun board for X'.",
      inputSchema: {
        leaderboardId: z
          .number()
          .int()
          .positive()
          .describe("Leaderboard ID (find via ra_user_game_leaderboards)"),
        count: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ leaderboardId, count, offset }) =>
      safeCall(async () =>
        getLeaderboardEntries(await getAuth(), { leaderboardId, count, offset })
      )
  );

  server.registerTool(
    "ra_user_game_leaderboards",
    {
      title: "Get a user's leaderboards for a game",
      description:
        "All leaderboards a user has placed on for a specific game, with their rank and score. Combine with ra_game to give context.",
      inputSchema: {
        gameId: z.number().int().positive().describe("Game ID"),
        username: z.string().describe("RetroAchievements username"),
        count: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ gameId, username, count, offset }) =>
      safeCall(async () =>
        getUserGameLeaderboards(await getAuth(), {
          gameId,
          username,
          count,
          offset,
        })
      )
  );
}
