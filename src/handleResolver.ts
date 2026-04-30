export const DEFAULT_RESOLVER_BASE_URL = "http://bj.resolve.idfactory.cn:8081";

export interface ResolveHandleOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  retryDelayMs?: number;
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
  const maxAttempts = options.maxAttempts ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const url = buildResolveUrl(handle, options.baseUrl);
  let lastError: unknown;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attemptsMade = attempt;
    try {
      const response = await fetchImpl(url, {
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
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && isRetryableResolverError(error)) {
        await delay(retryDelayMs);
        continue;
      }
      break;
    }
  }

  throw new Error(
    `Resolver request failed for handle ${handle.trim()} at ${url} after ${attemptsMade} attempts: ${formatErrorChain(lastError)}`
  );
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

function isRetryableResolverError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  return !error.message.startsWith("Resolver request failed with HTTP 4");
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

function formatErrorChain(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause;
  if (cause instanceof Error) {
    return `${error.message}: ${formatErrorChain(cause)}`;
  }

  if (cause !== undefined) {
    return `${error.message}: ${String(cause)}`;
  }

  return error.message;
}
