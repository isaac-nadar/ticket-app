import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  const { currentPassword, newPassword } = await req.json();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.userId },
    data: { password: hash },
  });

  return NextResponse.json({ ok: true });
}
