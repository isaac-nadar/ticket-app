import { JwtPayload } from "./jwt";

export function requireRole(
  user: JwtPayload,
  role: "ADMIN" | "USER"
) {
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
}
