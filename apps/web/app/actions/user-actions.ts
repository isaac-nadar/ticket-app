"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { AuthUser } from "@/lib/auth";
import { UserService } from "@/domain/user/user.service";
import { createSafeAction } from "@/lib/safe-action";

export async function updateProfileAction(name: string) {
  try {
    // 1. Securely grab and verify your custom cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("kanban_token")?.value;

    if (!token) throw new Error("Unauthorized");
    const session = verifyJwt(token) as unknown as AuthUser;

    // 2. Update the database via the Domain Layer
    await UserService.updateName(session.userId, name);

    // 3. Purge the global Next.js layout cache so the new name appears everywhere instantly
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: unknown) {
    console.error("[SERVER] Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export const changePasswordAction = createSafeAction(
  async (data: { oldPass: string; newPass: string }, { user }) => {
    if (data.newPass.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }
    if (data.oldPass === data.newPass) {
      throw new Error("New password must be different from the old password");
    }

    await UserService.changePassword(user.userId, data.oldPass, data.newPass);

    return {
      success: true,
      data: { message: "Password updated successfully!" },
    };
  },
);
