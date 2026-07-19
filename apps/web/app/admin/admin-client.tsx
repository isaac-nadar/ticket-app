"use client";

import { useState, useTransition } from "react";
import { provisionEmployeeAction } from "@/app/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "@/domain/user/user.types";

export function AdminDashboardClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 👇 Added error state
  const [isPending, startTransition] = useTransition();
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    pass: string;
  } | null>(null);

  const handleAddEmployee = () => {
    setErrorMsg(null); // Clear previous errors
    setGeneratedCredentials(null);

    // Basic client validation
    if (!name.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email is required.");
      return;
    }

    startTransition(async () => {
      const res = await provisionEmployeeAction({ email, name, role });

      if (res?.success === true && res.data) {
        setGeneratedCredentials({ email: email, pass: res.data.tempPassword });
        setEmail("");
        setName("");
        setRole("USER");
      } else if(res.success === false) {
        // 👇 Display the specific DB error returned from the server
        setErrorMsg(res?.error || "Failed to create user");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* ADD USER FORM */}
      <div className="col-span-1 flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm h-fit">
        <h2 className="font-semibold text-lg border-b pb-2">Add Employee</h2>

        <div className="space-y-1">
          <Label>Full Name</Label>
          <Input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Company Email</Label>
          <Input
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Role</Label>
          <Select value={role} onValueChange={(val: "ADMIN" | "USER") => setRole(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Standard User</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 👇 Inline Error Message */}
        {errorMsg && (
          <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md border border-red-200">
            {errorMsg}
          </p>
        )}

        <Button
          onClick={handleAddEmployee}
          disabled={isPending}
          className="mt-2 w-full"
        >
          {isPending ? "Provisioning..." : "Provision Account"}
        </Button>

        {generatedCredentials && (
          <div className="mt-4 rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">
              Credentials Generated
            </p>
            <p className="text-sm font-mono text-gray-800">
              Email: {generatedCredentials.email}
            </p>
            <p className="text-sm font-mono text-gray-800">
              Pass: {generatedCredentials.pass}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Send these to the employee. They can log in immediately.
            </p>
          </div>
        )}
      </div>

      {/* USER LIST (Untouched) */}
      <div className="col-span-1 md:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-lg border-b pb-2 mb-4">
          Active Directory
        </h2>
        <div className="space-y-4">
          {initialUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
