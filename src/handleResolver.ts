export const DEFAULT_RESOLVER_BASE_URL = "http://bj.resolve.idfactory.cn:8081";

export interface ResolveHandleOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface HandleRecord {
  index: number;
  type: string;
  data?: unknown;
  ttl?: number;
  timestamp?: string;
  references?: unknown[];
  adminRead?: number;
  adminWrite?: number;
  publicRead?: number;
  publicWrite?: number;
}

export interface HandleResolveResponse {
  responseCode: number;
  handle: string;
  value?: HandleRecord[];
  [key: string]: unknown;
}

export function buildResolveUrl(
  handle: string,
  baseUrl = DEFAULT_RESOLVER_BASE_URL
): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedHandle = handle.trim().replace(/^\/+/, "");

  if (!trimmedHandle) {
    throw new Error("Handle must not be empty");
  }

  const encodedPath = trimmedHandle
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${trimmedBase}/${encodedPath}`;
}

export async function resolveHandle(
  handle: string,
  options: ResolveHandleOptions = {}
): Promise<HandleResolveResponse> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(buildResolveUrl(handle, options.baseUrl), {
    method: "GET",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Resolver request failed with HTTP ${response.status} ${response.statusText}`.trim()
    );
  }

  const parsed = (await response.json()) as unknown;
  if (!isHandleResolveResponse(parsed)) {
    throw new Error("Resolver returned an unexpected JSON payload");
  }

  return parsed;
}

function isHandleResolveResponse(value: unknown): value is HandleResolveResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.responseCode === "number" &&
    typeof payload.handle === "string" &&
    (payload.value === undefined || Array.isArray(payload.value))
  );
}
