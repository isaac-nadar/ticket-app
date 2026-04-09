import { DomainEvents } from "@/domain/events/domain-events";
import { AuditRepository } from "./audit.repo";
import { isCardMovedEvent } from "@/domain/events/event-guards";

DomainEvents.register(async (event) => {
  if (event.type !== "CARD_MOVED") return;

  if (!isCardMovedEvent(event.payload)) {
    throw new Error("Invalid CARD_MOVED event payload");
  }

  await AuditRepository.log(
    "Card",
    event.payload.cardId,
    event.type,
    event.payload
  );
});
