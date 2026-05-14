import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  const body = await req.json();

  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: user.userId,
      endpoint: body.endpoint,
    },
  });

  return NextResponse.json({ ok: true });
}
