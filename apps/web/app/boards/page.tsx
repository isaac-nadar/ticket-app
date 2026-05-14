import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import Link from "next/link";
import { BoardUser } from "@/domain/board/board.type";
import { verifyJwt } from "@/lib/jwt";

// This is a Server Component!
export default async function BoardsDashboard() {
  // 1. Get the cookie directly on the server
  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;

  if (!token) redirect("/login");

  let userId;
  try {
    const decoded = verifyJwt(token);
    userId = decoded.userId;
  } catch {
    redirect("/login");
  }

  // 2. Fetch boards this user belongs to
  const userBoards = await prisma.boardUser.findMany({
    where: { userId },
    include: { board: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Boards</h1>
      <div className="flex gap-4">
        {userBoards.map((bu: BoardUser) => (
          <Link
            key={bu.board.id}
            href={`/boards/${bu.board.id}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer w-64 block"
          >
            <h2 className="text-xl font-semibold text-gray-700">
              {bu.board.name}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
