-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "cardId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
