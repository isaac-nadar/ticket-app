import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import "@/app/api/_bootstrap";
import { PushService } from "@/domain/push/push.service";

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const subscription = await req.json();

    // Ensure the payload has the required Web Push fields
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 },
      );
    }

    // Save it to Postgres linked to the User
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId: user.userId,
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys,
    //   },
    // });

    await PushService.createPushSubscription(
      user.userId,
      subscription.endpoint,
      subscription.keys,
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
