import { AuthzRepository } from "./authz.repo";
import { ForbiddenError } from "@/lib/errors"; // 1. Import our custom error

export const AuthzService = {
  async requireCardAccess(userId: string, cardId: string) {
    const hasAccess = await AuthzRepository.canAccessCard(userId, cardId);

    if (!hasAccess) {
      // 2. Throw the semantic error!
      throw new ForbiddenError(
        "You do not have permission to access this resource",
      );
    }
  },
};
