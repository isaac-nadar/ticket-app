import { AuditReadRepository } from "./audit.read.repo";

export const AuditQueryService = {
  getCardTimeline: async (cardId: string) => {
    if (!cardId) {
      throw new Error("cardId is required");
    }

    return AuditReadRepository.findByEntity("Card", cardId);
  },
};
