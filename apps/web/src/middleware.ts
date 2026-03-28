import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export default auth((req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return response;
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
