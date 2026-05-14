import prisma from "@/lib/db";

export const AuthzRepository = {
  // Returns true if the user is linked to the board that owns this card
  async canAccessCard(userId: string, cardId: string): Promise<boolean> {
    const accessRecord = await prisma.card.findFirst({
      where: {
        id: cardId,
        // Traverse up the relational tree: Card -> Column -> Board -> BoardUsers
        column: {
          board: {
            users: {
              some: { userId: userId }, // Is the user in the board's user list?
            },
          },
        },
      },
      select: { id: true }, // We only select the ID to keep the query lightning fast
    });

    return !!accessRecord; // Returns true if found, false if null
  },
};
