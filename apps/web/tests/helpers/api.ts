import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RequestOptions {
  body?: Record<string, unknown> | string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  searchParams?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// createTestRequest
// ---------------------------------------------------------------------------
/**
 * Build a NextRequest suitable for testing App Router API route handlers.
 */
export function createTestRequest(
  method: string,
  path: string,
  options: RequestOptions = {},
): NextRequest {
  const { body, headers = {}, cookies = {}, searchParams = {} } = options;

  const url = new URL(path, "http://localhost:3000");
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const init: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const request = new NextRequest(url, init as never);

  // Set cookies on the request
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }

  return request;
}

// ---------------------------------------------------------------------------
// createAuthenticatedRequest
// ---------------------------------------------------------------------------
interface AuthOptions extends RequestOptions {
  userId?: string;
  orgId?: string;
  sessionToken?: string;
}

/**
 * Build an authenticated NextRequest with session cookie and org headers.
 */
export function createAuthenticatedRequest(
  method: string,
  path: string,
  options: AuthOptions = {},
): NextRequest {
  const {
    userId = "test-user-id",
    orgId = "test-org-id",
    sessionToken = "test-session-token",
    headers = {},
    cookies = {},
    ...rest
  } = options;

  return createTestRequest(method, path, {
    ...rest,
    headers: {
      "x-user-id": userId,
      "x-org-id": orgId,
      ...headers,
    },
    cookies: {
      "next-auth.session-token": sessionToken,
      ...cookies,
    },
  });
}
