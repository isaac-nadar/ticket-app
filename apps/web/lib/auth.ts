import { NextRequest } from "next/server";
import { verifyJwt } from "./jwt";

export type AuthUser = {
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
};

export function requireUser(req: NextRequest): AuthUser {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = auth.slice(7);
  const user = verifyJwt(token) as unknown as AuthUser;

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export function requireAdmin(req: NextRequest): AuthUser {
  const user = requireUser(req);

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
