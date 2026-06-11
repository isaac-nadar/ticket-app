import { DomainEvents } from "../domain-events";
import { pusherServer } from "@/lib/pusher";

export function registerRealtimeListeners() {
  // Whenever the board updates, we tell Pusher to refresh the UI for everyone looking at it!
  DomainEvents.subscribe("CARD_MOVED", async ({ boardId }) => {
    await pusherServer.trigger(`board-${boardId}`, "board-updated", {
      message: "Refresh!",
    });
  });

  DomainEvents.subscribe("CARD_CREATED", async ({ boardId }) => {
    await pusherServer.trigger(`board-${boardId}`, "board-updated", {
      message: "Refresh!",
    });
  });

  DomainEvents.subscribe("CARD_UPDATED", async ({ boardId }) => {
    await pusherServer.trigger(`board-${boardId}`, "board-updated", {
      message: "Refresh!",
    });
  });
}
