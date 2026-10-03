const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLoopbackUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return LOOPBACK_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function isLocalAdminRequest(
  request: Request,
  environment = process.env.NODE_ENV,
): boolean {
  return environment !== "production" && isLoopbackUrl(request.url);
}

export function isLocalAdminRuntime(): boolean {
  return process.env.NODE_ENV !== "production";
}
