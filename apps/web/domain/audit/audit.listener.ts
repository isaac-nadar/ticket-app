import { DomainEvents } from "@/domain/events/domain-events";
import { AuditRepository } from "./audit.repo";
import { isCardMovedEvent } from "@/domain/events/event-guards";

DomainEvents.register(async (event) => {
  if (
    event.type !== "CARD_MOVED" &&
    event.type !== "CARD_UPDATED" &&
    event.type !== "CARD_DELETED"
  )
    return;

  if (event.type === "CARD_MOVED") {
    if (!isCardMovedEvent(event.payload)) {
      throw new Error("Invalid CARD_MOVED event payload");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = event.payload as any;

  await AuditRepository.log("Card", payload.cardId, event.type, payload);
});
