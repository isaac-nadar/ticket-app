import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin } from "@/lib/auth";
import { UserService } from "@/domain/user/user.service";

export async function POST(req: NextRequest) {
  requireAdmin(req);

  const { email, password, role, name } = await req.json();

  const hash = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "name required" },
      { status: 400 },
    );
  }

  try {
    const user = await UserService.createUser({
      email,
      name,
      passwordHash: hash,
      role: role ?? "USER",
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  requireAdmin(req);

  const users = await UserService.getAllUsers();

  return NextResponse.json(users);
}
