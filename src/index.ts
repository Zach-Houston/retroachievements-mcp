#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { hasCredentials, MissingCredentialsError } from "./auth.js";
import { registerUserTools } from "./tools/user.js";
import { registerGameTools } from "./tools/game.js";
import { registerFeedTools } from "./tools/feed.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "retroachievements-mcp",
    version: "0.1.0",
  });

  registerUserTools(server);
  registerGameTools(server);
  registerFeedTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (!hasCredentials()) {
    console.error("retroachievements-mcp running on stdio (NO CREDENTIALS)");
    console.error("");
    console.error(MissingCredentialsError.helpText());
  } else {
    console.error("retroachievements-mcp running on stdio");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
