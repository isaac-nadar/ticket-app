import "@/app/api/_bootstrap";
import { NextRequest, NextResponse } from "next/server";
import { CardService } from "@/domain/card/card.service";
import { requireUser } from "@/lib/auth";
import { AuthzService } from "@/domain/authz/authz.service";
import { withErrorHandler } from "@/lib/api-wrapper";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  requireUser(req);
  const { cardId } = await params;

  try {
    const body = await req.json();
    // We pass the body directly to our service.
    // Prisma is smart enough to only update the keys present in the 'body' object.
    const updatedCard = await CardService.updateCardDetails(cardId, {
      title: body?.title,
      description: body?.description,
      type: body?.type,
      assigneeId: body?.assigneeId,
    });

    return NextResponse.json(updatedCard);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ cardId: string }> },
  ) => {
    const user = requireUser(req);
    const { cardId } = await params;

    await AuthzService.requireCardAccess(user.userId, cardId);
    await CardService.deleteCard(cardId);

    return NextResponse.json({ ok: true });
  },
);
