import { DomainEvents } from "../domain-events";
import { broadcast } from "@/lib/sse-hub";

export function registerRealtimeListeners() {
  // Whenever the board updates, we tell every connected viewer to refresh!
  DomainEvents.subscribe("CARD_MOVED", async ({ boardId }) => {
    broadcast(`board-${boardId}`, "board-updated", { message: "Refresh!" });
  });

  DomainEvents.subscribe("CARD_CREATED", async ({ boardId }) => {
    broadcast(`board-${boardId}`, "board-updated", { message: "Refresh!" });
  });

  DomainEvents.subscribe("CARD_UPDATED", async ({ boardId }) => {
    broadcast(`board-${boardId}`, "board-updated", { message: "Refresh!" });
  });
}
