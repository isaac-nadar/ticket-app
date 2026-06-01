import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signJwt } from "@/lib/jwt";
import { withCors } from "@/lib/cors";

import { withErrorHandler } from "@/lib/api-wrapper";
import { UnauthorizedError } from "@/lib/errors";
import { UserService } from "@/domain/user/user.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { email, password } = await req.json();

  // 1. Find User
  const user = await UserService.checkUser(email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  // 2. Verify Password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new UnauthorizedError("Invalid email or password");

  // 3. Generate JWT
  const token = signJwt({
    userId: user.id,
    role: user.role,
  });

  const response = NextResponse.json({
    ok: true,
    userId: user.id,
    token: token,
  });

  // 4. THE MAGIC: Set the HttpOnly Cookie
  response.cookies.set({
    name: "kanban_token",
    value: token,
    httpOnly: true, // Blocks JavaScript from reading it
    secure: process.env.NODE_ENV === "production", // Requires HTTPS in prod
    sameSite: "lax", // Protects against CSRF attacks
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: "/", // Available across the whole app
  });

  // return response;
  return withCors(response, req.headers.get("origin"));
});
