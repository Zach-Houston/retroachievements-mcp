import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getGame,
  getGameExtended,
  getGameRankAndScore,
  getGameRating,
  getAchievementDistribution,
  AchievementDistributionFlags,
} from "@retroachievements/api";
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

  server.registerTool(
    "ra_game_rank_and_score",
    {
      title: "Get a game's high-score or latest-masters board",
      description:
        "Returns either the top high-score holders OR the most recent users to master the game, depending on the type parameter.",
      inputSchema: {
        gameId: z.number().int().positive().describe("Game ID"),
        type: z
          .enum(["latest-masters", "high-scores"])
          .describe(
            "'latest-masters' = recent masteries; 'high-scores' = top score earners."
          ),
      },
    },
    async ({ gameId, type }) =>
      safeCall(async () =>
        getGameRankAndScore(await getAuth(), { gameId, type })
      )
  );

  server.registerTool(
    "ra_game_rating",
    {
      title: "Get a game's community rating",
      description:
        "The community star rating for the game (and number of votes).",
      inputSchema: {
        gameId: z.number().int().positive().describe("Game ID"),
      },
    },
    async ({ gameId }) =>
      safeCall(async () => getGameRating(await getAuth(), { gameId }))
  );

  server.registerTool(
    "ra_achievement_distribution",
    {
      title: "Get an achievement-count distribution for a game",
      description:
        "Histogram: how many players have unlocked N achievements in this game. Use to answer 'how rare is full completion' or 'where does the average player drop off'.",
      inputSchema: {
        gameId: z.number().int().positive().describe("Game ID"),
        which: z
          .enum(["core", "unofficial"])
          .optional()
          .describe(
            "'core' = official achievements (default), 'unofficial' = dev-only / unofficial"
          ),
        hardcore: z
          .boolean()
          .optional()
          .describe("Only count hardcore unlocks (default false = either)"),
      },
    },
    async ({ gameId, which, hardcore }) =>
      safeCall(async () =>
        getAchievementDistribution(await getAuth(), {
          gameId,
          flags:
            which === "unofficial"
              ? AchievementDistributionFlags.UnofficialAchievements
              : AchievementDistributionFlags.CoreAchievements,
          hardcore,
        })
      )
  );
}
