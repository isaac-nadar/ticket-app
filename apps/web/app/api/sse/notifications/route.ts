import { getCurrentUser } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse-hub";

// Not external integration — see app/api/sse/board/[boardId]/route.ts.

export async function GET() {
  // The channel is derived from the authenticated session, not a
  // client-supplied id — nobody can subscribe to another user's
  // notification stream by guessing/passing an id.
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return createSSEResponse(`user-${user.userId}`);
}
