'use server'

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { signJwt } from "@/lib/jwt";
import { UserService } from "@/domain/user/user.service";
import { revalidatePath } from "next/cache";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('kanban_token');
  redirect("/");
}

export async function loginAction(data: { email: string; password: string }) {
  try {
    // 1. Find User
    const user = await UserService.checkUser(data.email);
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // 2. Verify Password
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // 3. Generate JWT
    const token = signJwt({
      userId: user.id,
      role: user.role,
    });

    // 4. Set the HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "kanban_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }

  // 5. Cache Invalidation & Redirect
  // IMPORTANT: redirect() throws a special Next.js error, so it MUST live outside the try/catch block!
  revalidatePath("/", "layout");
  redirect("/boards"); // Update this to wherever your user should land!
}
