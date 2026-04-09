import { NextResponse } from "next/server";
import { NotificationService } from "@/domain/notification/notification.service";
import "@/app/api/_bootstrap";

const USER_ID = "demo-user";

export async function GET() {
  const count =
    await NotificationService.unreadCount(USER_ID);

  return NextResponse.json({ unread: count });
}
