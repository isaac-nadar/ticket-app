import { NextResponse } from "next/server";
import { AuditQueryService } from "@/domain/audit/audit.service";
import "@/app/api/_bootstrap";

type RouteContext = {
  params: Promise<{
    cardId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { cardId } = await params;
    const logs = await AuditQueryService.getCardTimeline(cardId);

    return NextResponse.json(logs);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
