import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/jwt";
import { AuthUser } from "@/lib/auth";
import { AdminDashboardClient } from "./admin-client";
import { UserService } from "@/domain/user/user.service";

export default async function AdminPage() {
  // 1. Strict Server-Side Route Protection
  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;

  if (!token) redirect("/");

  const user = verifyJwt(token) as unknown as AuthUser;

  if (user.role !== "ADMIN") {
    redirect("/boards"); // Kick normal users back to their boards
  }

  // 2. Fetch initial data
  const users = await UserService.getAllUsers();

  return (
    <div className="container mx-auto max-w-5xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Provision access for company employees.
          </p>
        </div>
      </div>

      {/* Render the interactive client component */}
      <AdminDashboardClient initialUsers={users} />
    </div>
  );
}
