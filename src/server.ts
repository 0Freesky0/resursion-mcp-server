import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { resolveHandle } from "./handleResolver.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "recursion-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "resolve_handle",
    {
      title: "Resolve Handle",
      description:
        "Resolve a dynamic ID Factory handle path using http://bj.resolve.idfactory.cn:8081/{handle}.",
      inputSchema: z.object({
        handle: z
          .string()
          .min(1)
          .describe("Dynamic handle path after port 8081, for example 88.111.1 or 88.111.1/111.")
      }),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ handle }) => {
      try {
        const result = await resolveHandle(handle);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          structuredContent: result
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error)
            }
          ],
          isError: true
        };
      }
    }
  );

  return server;
}
