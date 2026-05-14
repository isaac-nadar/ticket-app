import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/domain/notification/notification.service";
import { requireUser } from "@/lib/auth";
import "@/app/api/_bootstrap";

// const USER_ID = "demo-user";

export async function GET(req: NextRequest) {
  const user = requireUser(req); // Get actual user from token

  const count = await NotificationService.unreadCount(user.userId);

  return NextResponse.json({ unread: count });
}
