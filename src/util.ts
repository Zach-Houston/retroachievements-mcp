import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MissingCredentialsError } from "./auth.js";

export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(err: unknown): CallToolResult {
  if (err instanceof MissingCredentialsError) {
    return {
      isError: true,
      content: [{ type: "text", text: MissingCredentialsError.helpText() }],
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text", text: `RetroAchievements API error: ${message}` }],
  };
}

export async function safeCall<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const data = await fn();
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
}
