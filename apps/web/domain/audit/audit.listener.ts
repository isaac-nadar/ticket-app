import { DomainEvents } from "@/domain/events/domain-events";
import { AuditRepository } from "./audit.repo";

// 👇 Add this wrapper function around your existing code
export function registerAuditListeners() {
  DomainEvents.subscribe("CARD_MOVED", async (payload) => {
    await AuditRepository.log("Card", payload.cardId, "CARD_MOVED", payload);
  });
}
