import { CardRepository } from "@/domain/card/card.repo";
import { AuditRepository } from "@/domain/audit/audit.repo";
import { Card } from "../card/card.types";

const DAYS = 30;

export async function cleanupDoneCards() {
  const staleCards = await CardRepository.findDoneOlderThan(DAYS);

  if (staleCards.length === 0) {
    console.log("🧹 No stale done cards to clean");
    return;
  }

  //s3 cleaup
  // const s3KeysToDelete = staleCards.flatMap((card: Card) =>
  //   card.attachments.map((att) => att.fileName),
  // );

  // if (s3KeysToDelete.length > 0) {
  //   await s3Client.send(
  //     new DeleteObjectsCommand({
  //       Bucket: process.env.S3_BUCKET_NAME,
  //       Delete: { Objects: s3KeysToDelete.map((Key) => ({ Key })) },
  //     }),
  //   );
  // }

  const ids = staleCards.map((c: Card) => c.id);

  // 1. Bulk delete is MUCH faster than deleting one by one in a loop
  await CardRepository.deleteManyByIds(ids);

  // 2. We still maintain our audit trail!
  for (const card of staleCards) {
    await AuditRepository.log("Card", card.id, "AUTO_CLEANUP", {
      reason: "DONE_OLDER_THAN_30_DAYS",
      updatedAt: card.updatedAt,
    });
  }

  console.log(`🧹 Cleaned ${ids.length} done cards`);
}
