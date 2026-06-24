import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAchievementUnlocks } from "@retroachievements/api";
import { getAuth } from "../auth.js";
import { safeCall } from "../util.js";

export function registerAchievementTools(server: McpServer): void {
  server.registerTool(
    "ra_achievement_unlocks",
    {
      title: "List users who unlocked an achievement",
      description:
        "Who has earned a specific achievement, with timestamps and totals (hardcore + softcore). Great for 'how rare is this' and 'who got it first' queries.",
      inputSchema: {
        achievementId: z
          .number()
          .int()
          .positive()
          .describe(
            "Achievement ID (find via ra_game_extended -> achievements[].id)"
          ),
        count: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ achievementId, count, offset }) =>
      safeCall(async () =>
        getAchievementUnlocks(await getAuth(), { achievementId, count, offset })
      )
  );
}
