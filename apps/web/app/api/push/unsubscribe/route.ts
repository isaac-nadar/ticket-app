import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PushService } from "@/domain/push/push.service";

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  const body = await req.json();

  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  // await prisma.pushSubscription.deleteMany({
  //   where: {
  //     userId: user.userId,
  //     endpoint: body.endpoint,
  //   },
  // });

  await PushService.deleteAllSubscriptionsForEndpoint(
    user.userId,
    body.endpoint,
  );

  return NextResponse.json({ ok: true });
}
