import { NextRequest } from "next/server";
import { verifyJwt } from "./jwt";
import { UnauthorizedError, ForbiddenError } from "./errors";

export type AuthUser = {
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
};

export function requireUser(req: NextRequest): AuthUser {
  // 1. First, check the secure HttpOnly Cookie (Used by the Browser)
  let token = req.cookies.get("kanban_token")?.value;

  // 2. Fallback to the Bearer header (Used by Postman)
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  // 3. Reject if no token is found in either location
  if (!token) {
    throw new UnauthorizedError("Missing authentication token");
  }

  // 4. Verify and return the payload
  try {
    const decoded = verifyJwt(token) as unknown as AuthUser;
    return decoded;
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function requireAdmin(req: NextRequest): AuthUser {
  const user = requireUser(req);

  if (user.role !== "ADMIN") {
    throw new ForbiddenError(
      "You do not have permission to access this resource",
    );
  }

  return user;
}
