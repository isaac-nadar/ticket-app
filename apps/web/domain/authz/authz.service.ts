import { AuthzRepository } from "./authz.repo";
import { ForbiddenError } from "@/lib/errors"; // 1. Import our custom error

export const AuthzService = {
  async requireCardAccess(
    userId: string,
    cardId: string,
    role?: "ADMIN" | "USER",
  ) {
    // Admins can act on any card regardless of board membership.
    if (role === "ADMIN") return;

    const hasAccess = await AuthzRepository.canAccessCard(userId, cardId);

    if (!hasAccess) {
      // 2. Throw the semantic error!
      throw new ForbiddenError(
        "You do not have permission to access this resource",
      );
    }
  },
};
