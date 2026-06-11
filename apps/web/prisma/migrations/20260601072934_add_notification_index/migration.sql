-- DropIndex
DROP INDEX "Notification_userId_read_idx";

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt" DESC);
