import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { BoardRepository } from "@/domain/board/board.repo";

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  const boards = await BoardRepository.findBoardsForUser(user.userId);

  return NextResponse.json(boards);
}
