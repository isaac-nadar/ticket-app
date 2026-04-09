import { NextRequest, NextResponse } from "next/server";
import { NotificationRepository } from "@/domain/notification/notification.repo";
import { NotificationService } from "@/domain/notification/notification.service";
import "@/app/api/_bootstrap";

const USER_ID = "demo-user";

export async function GET() {
  const notifications =
    await NotificationRepository.findByUser(USER_ID);

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const { notificationId } = await req.json();

  try {
    const updated =
      await NotificationService.markRead(notificationId, USER_ID);

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
