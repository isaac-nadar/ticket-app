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

// Provision a new employee
export const provisionEmployeeAction = createSafeAction(
  async (
    data: { email: string; name: string; role: "ADMIN" | "USER" },
    { user },
  ) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden: Admins only");

    // Generate a default temporary password for the employee
    const tempPassword = "TicketApp123!";
    const hash = await bcrypt.hash(tempPassword, 10);

    const newUser = await UserService.createUser({
      email: data.email.toLowerCase(),
      passwordHash: hash,
      role: data.role,
      name: data.name,
    });

    revalidatePath("/admin");

    // Return the temp password to the UI so the admin can copy it and send it to the employee
    return { success: true, data: { ...newUser, tempPassword } };
  },
);
