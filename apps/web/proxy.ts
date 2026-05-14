export { default } from "next-auth/middleware";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Create a strict TypeScript interface for our expected JWT payload
interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("kanban_token")?.value;
  const { pathname } = request.nextUrl;

  // --- 2. ADMIN ROUTE PROTECTION ---
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Edge-safe JWT decoding. A JWT is three parts separated by dots.
      // The payload is the second part (index 1), encoded in Base64.
      const payloadString = atob(token.split(".")[1]);
      const decodedToken = JSON.parse(payloadString) as JwtPayload;

      // Note: Check your Prisma schema to see if your roles are uppercase (e.g. "ADMIN")
      if (decodedToken.role !== "admin" && decodedToken.role !== "ADMIN") {
        // They are logged in, but not an admin. Kick them to their dashboard.
        return NextResponse.redirect(new URL("/boards", request.url));
      }
    } catch (error) {
      // If the token is completely malformed or tampering is detected
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // --- 3. STANDARD USER ROUTE PROTECTION ---
  if (pathname.startsWith("/boards")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // --- 4. ALLOW TRAFFIC ---
  // If they passed the checks (or if it's an unprotected route like /login), let them through!
  return NextResponse.next();
}

// 5. THE MATCHER: Consolidate all protected routes here
export const config = {
  matcher: ["/boards", "/boards/:path*", "/admin", "/admin/:path*"],
};
