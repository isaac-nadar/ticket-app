import { DomainEvents } from "@/domain/events/domain-events";
import prisma from "@/lib/db";
import { deleteS3Objects } from "./storage.service";

// domain/storage/storage.listener.ts
export function registerStorageListeners() {
  DomainEvents.subscribe("CARD_DELETED", async (payload) => {
    // Note: CardService.deleteCard soft-deletes (sets deletedAt) — there's
    // no restore flow, so from the user's perspective the card is gone for
    // good and its attachments should stop costing storage. The Attachment
    // rows themselves stay put (no cascade fires on a soft delete); only
    // the physical S3 objects are cleaned up here.
    const attachments = await prisma.attachment.findMany({
      where: { cardId: payload.cardId },
    });

    if (attachments.length === 0) return;

    await deleteS3Objects(attachments.map((a: { fileUrl: string }) => a.fileUrl));
  });
}
