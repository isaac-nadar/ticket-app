import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BoardUser } from "@/domain/board/board.type";
import { verifyJwt } from "@/lib/jwt";
import { CreateBoardButton } from "./create-board-button";
import { BoardUserService } from "@/domain/board/board.service";
import { Shield } from "lucide-react"; // A good icon for Admin settings
import { Button } from "@/components/ui/button";

// This is a Server Component!
export default async function BoardsDashboard() {
  // 1. Get the cookie directly on the server
  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;

  if (!token) redirect("/login");

  let userId;
  let userRole;
  try {
    const decoded = verifyJwt(token);
    userId = decoded.userId;
    userRole = decoded.role;
  } catch {
    redirect("/login");
  }

  // 2. Fetch boards this user belongs to
  const userBoards = await BoardUserService.listBoardsForUser(userId);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-card-foreground mb-8">
        Your Boards
      </h1>

      {userRole === "ADMIN" && <CreateBoardButton />}
      {userRole === "ADMIN" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}

      <div className="flex gap-4">
        {userBoards.map((bu: BoardUser) => (
          <Link
            key={bu.board.id}
            href={`/boards/${bu.board.id}`}
            className="bg-card p-6 rounded-ui shadow-ui hover:shadow-ui-hover border border-ui  transition cursor-pointer w-64 block"
          >
            <h2 className="text-xl font-semibold text-card-foreground">
              {bu.board.name}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
