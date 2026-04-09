import "@/app/api/_bootstrap";
import { NextResponse } from "next/server";
import { BoardQueryService } from "@/domain/board/board.service";

type RouteContext = {
  params: Promise<{
    boardId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { boardId } = await params;

    const board = await BoardQueryService.getBoard(boardId);
    return NextResponse.json(board);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 404 });
  }
}
