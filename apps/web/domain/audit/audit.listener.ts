import { DomainEvents } from "@/domain/events/domain-events";
import { AuditService } from "./audit.service";

// 👇 Add this wrapper function around your existing code
export function registerAuditListeners() {
  DomainEvents.subscribe("CARD_MOVED", async (payload) => {
    await AuditService.log("Card", payload.cardId, "CARD_MOVED", payload);
  });
}
