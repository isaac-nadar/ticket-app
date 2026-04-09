-- CreateTable
CREATE TABLE "BoardUser" (
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BoardUser_pkey" PRIMARY KEY ("boardId","userId")
);

-- AddForeignKey
ALTER TABLE "BoardUser" ADD CONSTRAINT "BoardUser_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardUser" ADD CONSTRAINT "BoardUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
