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

  const ids = staleCards.map((c: Card) => c.id);

  await CardRepository.deleteManyByIds(ids);

  for (const card of staleCards) {
    await AuditRepository.log("Card", card.id, "AUTO_CLEANUP", {
      reason: "DONE_OLDER_THAN_30_DAYS",
      updatedAt: card.updatedAt,
    });
  }

  console.log(`🧹 Cleaned ${ids.length} done cards`);
}
