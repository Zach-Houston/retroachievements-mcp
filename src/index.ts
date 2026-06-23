#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadAuth } from "./auth.js";
import { registerUserTools } from "./tools/user.js";
import { registerGameTools } from "./tools/game.js";
import { registerFeedTools } from "./tools/feed.js";

async function main(): Promise<void> {
  const auth = loadAuth();

  const server = new McpServer({
    name: "retroachievements-mcp",
    version: "0.1.0",
  });

  registerUserTools(server, auth);
  registerGameTools(server, auth);
  registerFeedTools(server, auth);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("retroachievements-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
