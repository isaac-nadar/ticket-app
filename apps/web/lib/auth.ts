import { cookies } from "next/headers";
import { verifyJwt } from "./jwt";

export type AuthUser = {
  name: string;
  avatar?: string;
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
};

// Server Actions don't get a NextRequest — reads the session cookie directly.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;
  if (!token) return null;

  try {
    return verifyJwt(token) as unknown as AuthUser;
  } catch {
    return null;
  }
}
