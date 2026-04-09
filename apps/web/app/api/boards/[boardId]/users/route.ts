import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { BoardRepository } from "@/domain/board/board.repo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  requireAdmin(req);

  const { userId } = await req.json();
  const { boardId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await BoardRepository.assignUser(boardId, userId);

  return NextResponse.json({ ok: true });
}
