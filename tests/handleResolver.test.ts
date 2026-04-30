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

  it("retries transient resolver transport failures", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            responseCode: 100,
            handle: "88.333.017101/Carbon_2024",
            msg: "Handle not found"
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    const result = await resolveHandle("88.333.017101/Carbon_2024", {
      fetchImpl,
      retryDelayMs: 0
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      responseCode: 100,
      handle: "88.333.017101/Carbon_2024",
      msg: "Handle not found"
    });
  });

  it("includes handle, URL, attempts, and cause after repeated transport failures", async () => {
    const socketError = new TypeError("fetch failed", {
      cause: new Error("other side closed")
    });
    const fetchImpl = vi.fn().mockRejectedValue(socketError);

    await expect(
      resolveHandle("88.333.017101/Carbon_2024", {
        fetchImpl,
        retryDelayMs: 0,
        maxAttempts: 2
      })
    ).rejects.toThrow(
      "Resolver request failed for handle 88.333.017101/Carbon_2024 at http://bj.resolve.idfactory.cn:8081/88.333.017101/Carbon_2024 after 2 attempts: fetch failed: other side closed"
    );
  });

  it("throws a useful error for non-2xx responses", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("not found", { status: 404, statusText: "Not Found" });
    });

    await expect(resolveHandle("missing", { fetchImpl })).rejects.toThrow(
      "Resolver request failed with HTTP 404 Not Found"
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
