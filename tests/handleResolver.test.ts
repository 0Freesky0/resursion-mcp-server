import { describe, expect, it, vi } from "vitest";
import { buildResolveUrl, resolveHandle } from "../src/handleResolver.js";

describe("buildResolveUrl", () => {
  it("appends a dynamic handle path to the resolver base URL", () => {
    expect(buildResolveUrl("88.111.1/111")).toBe(
      "http://bj.resolve.idfactory.cn:8081/88.111.1/111"
    );
  });

  it("encodes spaces while preserving handle path separators", () => {
    expect(buildResolveUrl("88.111.1/hello world")).toBe(
      "http://bj.resolve.idfactory.cn:8081/88.111.1/hello%20world"
    );
  });
});

describe("resolveHandle", () => {
  it("returns parsed JSON from the resolver API", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          responseCode: 1,
          handle: "88.111.1/111",
          value: [{ index: 2000, type: "shuxing1" }]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const result = await resolveHandle("88.111.1/111", { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://bj.resolve.idfactory.cn:8081/88.111.1/111",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.handle).toBe("88.111.1/111");
    expect(result.value).toHaveLength(1);
  });

  it("throws a useful error for non-2xx responses", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("not found", { status: 404, statusText: "Not Found" });
    });

    await expect(resolveHandle("missing", { fetchImpl })).rejects.toThrow(
      "Resolver request failed with HTTP 404 Not Found"
    );
  });
});
