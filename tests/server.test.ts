import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { createServer } from "../src/server.js";

describe("MCP server", () => {
  it("exposes and calls the resolve_handle tool", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          responseCode: 1,
          handle: "88.111.1/111",
          value: [{ index: 1001, type: "TEMPLATE" }]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const server = createServer();
    const client = new Client({ name: "test-client", version: "0.1.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    try {
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("resolve_handle");

      const result = await client.callTool({
        name: "resolve_handle",
        arguments: { handle: "88.111.1/111" }
      });

      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        responseCode: 1,
        handle: "88.111.1/111"
      });
      expect(fetchMock).toHaveBeenCalledWith(
        "http://bj.resolve.idfactory.cn:8081/88.111.1/111",
        expect.objectContaining({ method: "GET" })
      );
    } finally {
      globalThis.fetch = originalFetch;
      await client.close();
      await server.close();
    }
  });
});
