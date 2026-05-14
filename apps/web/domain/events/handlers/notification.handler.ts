import { NotificationRepository } from "@/domain/notification/notification.repo";
import { DomainEvents } from "@/domain/events/domain-events"; // Import the bus

export const NotificationHandler = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handle(event: any) {
    switch (event.type) {
      case "CARD_MOVED": {
        const { cardId, toColumnId, userId } = event.payload;
        if (userId) {
          await NotificationRepository.create(
            userId,
            "Card moved",
            `Card ${cardId} moved to new column`,
          );
        }
        break;
      }

      case "CARD_CREATED": {
        const { cardId, userId } = event.payload;

        if (userId) {
          await NotificationRepository.create(
            userId,
            "New card created",
            `Card ${cardId} created`,
          );
        }

        break;
      }

      case "CARD_UPDATED": {
        const { cardId, userId } = event.payload;

        // Only send a notification if an assigneeId was provided in the update
        if (userId) {
          await NotificationRepository.create(
            userId,
            "Card Assigned/Updated",
            `You were assigned to or had an update on Card ${cardId}`,
          );
        }
        break;
      }
    }
  },
};
