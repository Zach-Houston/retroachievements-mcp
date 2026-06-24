import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getAchievementOfTheWeek,
  getTopTenUsers,
  getRecentGameAwards,
} from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

const AWARD_KINDS = [
  "beaten-softcore",
  "beaten-hardcore",
  "completed",
  "mastered",
] as const;

export function registerFeedTools(server: McpServer): void {
  server.registerTool(
    "ra_achievement_of_the_week",
    {
      title: "Get achievement of the week",
      description:
        "The currently featured achievement-of-the-week, plus the leaderboard of users who have already unlocked it.",
      inputSchema: {},
    },
    async () => safeCall(async () => getAchievementOfTheWeek(await getAuth()))
  );

  server.registerTool(
    "ra_top_ten_users",
    {
      title: "Get top ten users",
      description: "The site's current top-ten ranked users by hardcore points.",
      inputSchema: {},
    },
    async () => safeCall(async () => getTopTenUsers(await getAuth()))
  );

  server.registerTool(
    "ra_recent_game_awards",
    {
      title: "Get recent site-wide game awards",
      description:
        "Stream of recent masteries / completions / beaten awards across the whole site. Use for 'who just mastered something interesting' or activity-feed style queries.",
      inputSchema: {
        startDate: z
          .string()
          .optional()
          .describe("ISO date floor (e.g. 2026-06-01)"),
        count: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
        desiredAwardKinds: z
          .array(z.enum(AWARD_KINDS))
          .optional()
          .describe(
            "Filter by award kind. Any of: beaten-softcore, beaten-hardcore, completed, mastered."
          ),
      },
    },
    async ({ startDate, count, offset, desiredAwardKinds }) =>
      safeCall(async () =>
        getRecentGameAwards(await getAuth(), {
          startDate,
          count,
          offset,
          desiredAwardKinds,
        })
      )
  );
}
