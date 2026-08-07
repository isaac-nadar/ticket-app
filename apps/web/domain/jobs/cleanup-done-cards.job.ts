import { CardService } from "@/domain/card/card.service";
import { AuditService } from "@/domain/audit/audit.service";
import { deleteS3Objects } from "@/domain/storage/storage.service";
import { Card } from "../card/card.types";

const DAYS = 30;

export async function cleanupDoneCards() {
  const staleCards = await CardService.findDoneOlderThan(DAYS);

  if (staleCards.length === 0) {
    console.log("🧹 No stale done cards to clean");
    return;
  }

  // S3 cleanup — this is a hard delete (unlike CardService.deleteCard's
  // soft delete), so the attachment rows are gone for good once
  // bulkDelete runs below. Clean up the physical files first.
  const fileUrlsToDelete = staleCards.flatMap((card: Card) =>
    card.attachments.map((att) => att.fileUrl),
  );

  if (fileUrlsToDelete.length > 0) {
    await deleteS3Objects(fileUrlsToDelete);
  }

  const ids = staleCards.map((c: Card) => c.id);

  // 1. Bulk delete is MUCH faster than deleting one by one in a loop
  await CardService.bulkDelete(ids);

  // 2. We still maintain our audit trail!
  for (const card of staleCards) {
    await AuditService.log("Card", card.id, "AUTO_CLEANUP", {
      reason: "DONE_OLDER_THAN_30_DAYS",
      updatedAt: card.updatedAt,
    });
  }

  console.log(`🧹 Cleaned ${ids.length} done cards`);
}
