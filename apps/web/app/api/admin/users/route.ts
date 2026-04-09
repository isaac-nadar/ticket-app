import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  requireAdmin(req);

  const { email, password, role } = await req.json();

  const hash = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: role ?? "USER",
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  requireAdmin(req);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
