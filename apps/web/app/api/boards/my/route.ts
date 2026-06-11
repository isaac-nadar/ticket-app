import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { BoardUserService } from "@/domain/board/board.service";

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  const boards = await BoardUserService.listBoardsForUser(user.userId);

  return NextResponse.json(boards);
}
