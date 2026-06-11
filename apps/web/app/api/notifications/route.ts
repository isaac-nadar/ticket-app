import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/domain/notification/notification.service";
import "@/app/api/_bootstrap";
import { requireUser } from "@/lib/auth";

// const USER_ID = "demo-user";

export async function GET(req: NextRequest) {
  try {
    const user = requireUser(req);

    // Extract query parameters from the URL
    const searchParams = req.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor") || undefined;

    // Default to 10 items if no limit is provided
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const result = await NotificationService.getFeed(
      user.userId,
      limit,
      cursor,
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = requireUser(req);
  const { notificationId } = await req.json();

  try {
    const updated = await NotificationService.markRead(
      notificationId,
      user.userId,
    );

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
