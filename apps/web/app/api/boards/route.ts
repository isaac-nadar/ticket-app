import "@/app/api/_bootstrap";
import { NextRequest, NextResponse } from "next/server";
import { BoardService, BoardQueryService } from "@/domain/board/board.service";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const board = await BoardService.createBoard(name, "");

    return NextResponse.json(board, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const boards = await BoardQueryService.listBoards();
    return NextResponse.json(boards);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
