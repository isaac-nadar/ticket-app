// import { DomainEvents } from "@/domain/events/domain-events";
// import { AuditRepository } from "./audit.repo";
// import { isCardMovedEvent } from "@/domain/events/event-guards";

// DomainEvents.register(async (event) => {
//   if (
//     event.type !== "CARD_MOVED" &&
//     event.type !== "CARD_UPDATED" &&
//     event.type !== "CARD_DELETED" &&
//     event.type !== "COMMENTS_ADDED"
//   )
//     return;

//   if (event.type === "CARD_MOVED") {
//     if (!isCardMovedEvent(event.payload)) {
//       throw new Error("Invalid CARD_MOVED event payload");
//     }
//   }

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const payload = event.payload as any;

//   await AuditRepository.log("Card", payload.cardId, event.type, payload);
// });

import { DomainEvents } from "@/domain/events/domain-events";
import { AuditRepository } from "./audit.repo";

// 👇 Add this wrapper function around your existing code
export function registerAuditListeners() {
  DomainEvents.subscribe("CARD_MOVED", async (payload) => {
    await AuditRepository.log("Card", payload.cardId, "CARD_MOVED", payload);
  });
}
