-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
