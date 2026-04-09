import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signJwt } from "@/lib/jwt";
import { withCors } from "@/lib/cors";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = signJwt({
    userId: user.id,
    role: user.role,
  });

  const res = NextResponse.json({ token });
  return withCors(res, req.headers.get("origin"));
}
