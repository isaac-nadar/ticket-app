import "@/app/api/_bootstrap";
import { NextRequest, NextResponse } from "next/server";
import { CardService } from "@/domain/card/card.service";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/domain/rate-limit/rate-limit.service";

import { IdempotencyService } from "@/domain/idempotency/idempotency.service";

export async function GET(req: NextRequest) {
  const boardId = req.nextUrl.searchParams.get("boardId");

  try {
    const cards = await CardService.listByBoard(boardId as string);
    return NextResponse.json(cards);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("idempotency-key");

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key required" },
      { status: 400 },
    );
  }

  try {
    const user = requireUser(req);
    await enforceRateLimit(user.userId);
    const body = await req.json();

    const card = await IdempotencyService.execute(idempotencyKey, () =>
      CardService.createCard(body.title, body.type, body.columnId),
    );

    return NextResponse.json(card, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireUser(req);
    await enforceRateLimit(user.userId);
    const { cardId, targetColumnId, targetPosition, boardId } = await req.json();
    const card = await CardService.reorderCard(
      boardId,
      cardId,
      targetColumnId,
      targetPosition,
      user.userId,
    );

    return NextResponse.json(card);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
