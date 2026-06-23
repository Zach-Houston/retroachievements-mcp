import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getAchievementOfTheWeek,
  getTopTenUsers,
} from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

export function registerFeedTools(server: McpServer): void {
  server.registerTool(
    "ra_achievement_of_the_week",
    {
      title: "Get achievement of the week",
      description:
        "The currently featured achievement-of-the-week, plus the leaderboard of users who have already unlocked it.",
      inputSchema: {},
    },
    async () => safeCall(() => getAchievementOfTheWeek(getAuth()))
  );

  server.registerTool(
    "ra_top_ten_users",
    {
      title: "Get top ten users",
      description: "The site's current top-ten ranked users by hardcore points.",
      inputSchema: {},
    },
    async () => safeCall(() => getTopTenUsers(getAuth()))
  );
}
