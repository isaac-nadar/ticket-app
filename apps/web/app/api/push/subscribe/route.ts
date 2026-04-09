import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  console.log(req);
  const subscription = await req.json();

  await prisma.pushSubscription.create({
    data: {
      userId: "demo-user",
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
  });

  return NextResponse.json({ ok: true });
}
