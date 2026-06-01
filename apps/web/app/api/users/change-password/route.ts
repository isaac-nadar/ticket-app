import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireUser } from "@/lib/auth";
import { UserService } from "@/domain/user/user.service";

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  const { currentPassword, newPassword } = await req.json();

  const dbUser = await UserService.getUserById(user.userId);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await UserService.updatePassword(user.userId, hash);

  return NextResponse.json({ ok: true });
}
