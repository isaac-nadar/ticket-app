import { getCurrentUser } from "@/lib/auth";
import { BoardUserService } from "@/domain/board/board.service";
import { createSSEResponse } from "@/lib/sse-hub";

// Not external integration — this exists because EventSource can only
// speak HTTP GET, so a long-lived stream has to live behind a Route
// Handler rather than a Server Action. (Same reasoning as keeping
// app/api/health.)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;

  // Auth the connection itself — Pusher's board-<id> channel was public
  // and unauthenticated by name (anyone who knew/guessed a boardId could
  // subscribe). Self-hosting is the natural point to actually close that.
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (user.role !== "ADMIN") {
    const access = await BoardUserService.checkUserAccessToBoard(
      user.userId,
      boardId,
    );
    if (!access) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return createSSEResponse(`board-${boardId}`);
}
