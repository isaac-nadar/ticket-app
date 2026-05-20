import { BoardQueryService } from "@/domain/board/board.service";
import { notFound, redirect } from "next/navigation";
import { BoardClient } from "./board-client";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { InviteButton } from "./invite-button";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  // 1. We know the cookie exists thanks to Middleware, but let's decode it to get the userId
  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;

  if (!token) redirect("/login"); // Fallback safety

  let userId;
  let userRole;
  try {
    const decoded = verifyJwt(token);
    userId = decoded.userId;
    userRole = decoded.role;
  } catch {
    redirect("/login");
  }

  // 2. THE RESOURCE BOUNCER (IDOR Protection)
  // Check if this specific user has a BoardUser link to this specific board
  const hasAccess = await prisma.boardUser.findFirst({
    where: { userId, boardId },
  });

  if (!hasAccess) {
    // If they are logged in but don't belong to this board, kick them to the dashboard
    redirect("/boards");
  }

  // 3. Now it is 100% safe to fetch the data
  let boardData;
  try {
    boardData = await BoardQueryService.getBoard(boardId);
  } catch (error) {
    notFound();
  }

  if (!boardData) notFound();

  // 4. Return the JSX completely OUTSIDE the try/catch!
  return (
    <main className="h-screen flex flex-col">
      <header className="p-4 bg-card border-b shadow-ui flex items-center justify-start gap-4  px-6  border-border/50  backdrop-blur-sm">
        <h1 className="text-xl font-bold text-card-foreground capitalize">
          {boardData.name}
        </h1>
        {userRole === "ADMIN" && <InviteButton boardId={boardData.id} />}
      </header>

      <BoardClient initialBoard={boardData} userRole={userRole} />
    </main>
  );
}
