"use server";

import { createSafeAction } from "@/lib/safe-action";
import { UserService } from "@/domain/user/user.service";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// Fetch all users for the admin table
export const getAllUsersAction = createSafeAction(async (_, { user }) => {
  if (user.role !== "ADMIN") throw new Error("Forbidden");

  const users = await UserService.getAllUsers();

  return { success: true, data: users };
});

const isValidEmail = (email: string) => {
  // Standard email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export type ProvisionResponse =
  | { success: true; data: { tempPassword: string; [key: string]: any } }
  | { success: false; error: string };

export const provisionEmployeeAction = createSafeAction(
  async (
    data: { email: string; name: string; role: "ADMIN" | "USER" },
    { user },
  ): Promise<ProvisionResponse> => { // 👇 2. Force the return type here

    if (user.role !== "ADMIN") throw new Error("Forbidden: Admins only");

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters." };
    }

    if (!data.email || !isValidEmail(data.email.trim())) {
      return { success: false, error: "Invalid email address." };
    }

    if (data.role !== "ADMIN" && data.role !== "USER") {
      return { success: false, error: "Invalid role selected." };
    }

    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    // Generate a default temporary password for the employee
    const tempPassword = "TicketApp123!";
    const hash = await bcrypt.hash(tempPassword, 10);

    const newUser = await UserService.createUser({
      email: cleanEmail,
      passwordHash: hash,
      role: data.role,
      name: cleanName,
    });

    // If UserService returned your duplicate error, pass it directly to the UI
    if (newUser?.success === false) {
      return { success: false, error: newUser.error || "Failed to create user." };
    }

    revalidatePath("/admin");

    // 3. Return matches the success: true signature perfectly
    return {
      success: true,
      data: { ...newUser, tempPassword }
    };
  },
);
