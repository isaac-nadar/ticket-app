import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { AuthUser } from "@/lib/auth";

type ActionContext = { user: AuthUser };

type ActionHandler<TInput, TOutput> = (
  input: TInput,
  ctx: ActionContext,
) => Promise<
  { success: true; data: TOutput } | { success: false; error: string }
>;

export function createSafeAction<TInput = void, TOutput = unknown>(
  handler: ActionHandler<TInput, TOutput>,
  requiredRole?: "USER" | "ADMIN",
) {
  return async (input?: TInput) => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("kanban_token")?.value;

      if (!token) throw new Error("Unauthorized");
      const user = verifyJwt(token) as unknown as AuthUser;

      if (requiredRole === "ADMIN" && user.role !== "ADMIN") {
        throw new Error("Forbidden: Admin access required.");
      }

      return await handler(input as TInput, { user });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      console.error("[ACTION ERROR]:", message);
      return {
        success: false as const,
        error: message || "An unexpected error occurred",
      };
    }
  };
}
