import prisma from "@/lib/db";

export const UserRepository = {
  findById: async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      // We explicitly select fields so we NEVER accidentally leak the password hash!
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });
  },

  updateProfile: async (userId: string, name: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true },
    });
  },

  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });
  },
};
