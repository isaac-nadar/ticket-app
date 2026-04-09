import { NotificationRepository } from "@/domain/notification/notification.repo";

export const NotificationHandler = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handle(event: any) {
    switch (event.type) {
      case "CARD_MOVED": {
        const { cardId, toColumnId, userId } = event.payload;

        await NotificationRepository.create(
          userId,
          "Card moved",
          `Card ${cardId} moved to new column`,
        );

        break;
      }

      case "CARD_CREATED": {
        const { cardId, userId } = event.payload;

        await NotificationRepository.create(
          userId,
          "New card created",
          `Card ${cardId} created`,
        );

        break;
      }
    }
  },
};
