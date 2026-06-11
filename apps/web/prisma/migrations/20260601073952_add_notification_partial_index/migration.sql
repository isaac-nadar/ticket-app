-- CreateIndex
CREATE INDEX "unread_notifications_idx" ON "Notification"("userId") WHERE ("read" = false);
