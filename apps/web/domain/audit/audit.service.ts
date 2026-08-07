import { AuditReadRepository } from "./audit.read.repo";
import { AuditRepository } from "./audit.repo";

export const AuditQueryService = {
  getCardTimeline: async (cardId: string) => {
    if (!cardId) {
      throw new Error("cardId is required");
    }

    return AuditReadRepository.findByEntity("Card", cardId);
  },
};

// Write side — kept separate from AuditQueryService the same way
// BoardService/BoardQueryService are split.
export const AuditService = {
  log: async (
    entity: string,
    entityId: string,
    action: string,
    payload: unknown,
  ) => {
    return AuditRepository.log(entity, entityId, action, payload);
  },
};
