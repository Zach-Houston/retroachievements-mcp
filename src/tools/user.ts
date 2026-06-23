import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthObject } from "@retroachievements/api";
import {
  getUserProfile,
  getUserSummary,
  getUserRecentAchievements,
  getUserRecentlyPlayedGames,
  getUserCompletionProgress,
  getUserAwards,
  getAchievementsEarnedBetween,
} from "@retroachievements/api";
import { safeCall } from "../util.js";

export function registerUserTools(server: McpServer, auth: AuthObject): void {
  server.registerTool(
    "ra_user_profile",
    {
      title: "Get user profile",
      description:
        "Retrieve summary profile data for a RetroAchievements user (points, rank, motto, member-since, avatar).",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
      },
    },
    async ({ username }) => safeCall(() => getUserProfile(auth, { username }))
  );

  server.registerTool(
    "ra_user_summary",
    {
      title: "Get user summary",
      description:
        "Fuller summary for a user: recent games, recent achievements, last activity, rank, awards count.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
        recentGamesCount: z
          .number()
          .int()
          .min(0)
          .max(50)
          .optional()
          .describe("How many recent games to include (default 5)"),
        recentAchievementsCount: z
          .number()
          .int()
          .min(0)
          .max(50)
          .optional()
          .describe("How many recent achievements to include (default 10)"),
      },
    },
    async ({ username, recentGamesCount, recentAchievementsCount }) =>
      safeCall(() =>
        getUserSummary(auth, {
          username,
          recentGamesCount,
          recentAchievementsCount,
        })
      )
  );

  server.registerTool(
    "ra_user_recent_achievements",
    {
      title: "Get user's recent achievements",
      description:
        "Achievements a user has unlocked in the last N minutes (default 60). Useful for 'what did they just play?' queries.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
        recentMinutes: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Look back this many minutes (default 60)"),
      },
    },
    async ({ username, recentMinutes }) =>
      safeCall(() => getUserRecentAchievements(auth, { username, recentMinutes }))
  );

  server.registerTool(
    "ra_user_recently_played_games",
    {
      title: "Get user's recently played games",
      description:
        "List of games the user has touched most recently, with last-played timestamps and per-game progress.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
        count: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("How many games to return (default 10, max 50)"),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ username, count, offset }) =>
      safeCall(() => getUserRecentlyPlayedGames(auth, { username, count, offset }))
  );

  server.registerTool(
    "ra_user_completion_progress",
    {
      title: "Get user completion progress",
      description:
        "All games the user has earned at least one achievement in, with completion %, hardcore status, and award level.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
        count: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ username, count, offset }) =>
      safeCall(() => getUserCompletionProgress(auth, { username, count, offset }))
  );

  server.registerTool(
    "ra_user_awards",
    {
      title: "Get user awards",
      description:
        "Site awards the user has earned (mastery, beaten, event awards) with dates.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
      },
    },
    async ({ username }) => safeCall(() => getUserAwards(auth, { username }))
  );

  server.registerTool(
    "ra_user_achievements_between",
    {
      title: "Get achievements earned in a date range",
      description:
        "All achievements a user unlocked between two ISO dates. Powerful for weekly/monthly recaps.",
      inputSchema: {
        username: z.string().describe("RetroAchievements username"),
        fromDate: z
          .string()
          .describe("Start date, ISO 8601 (e.g. 2026-06-01 or 2026-06-01T00:00:00Z)"),
        toDate: z.string().describe("End date, ISO 8601"),
      },
    },
    async ({ username, fromDate, toDate }) =>
      safeCall(() =>
        getAchievementsEarnedBetween(auth, {
          username,
          fromDate: new Date(fromDate),
          toDate: new Date(toDate),
        })
      )
  );
}
