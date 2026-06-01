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

  create: async (data: {
    email: string;
    passwordHash: string;
    role: "USER" | "ADMIN";
  }) => {
    const payload = {
      email: data.email,
      password: data.passwordHash,
      role: data.role,
    };

    return prisma.user.create({
      payload,
      select: { id: true, email: true },
    });
  },

  updateProfile: async (userId: string, name: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true },
    });
  },

  updatePassword: async (userId: string, passwordHash: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
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
        role: true,
      },
    });
  },

  checkUser: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  listAllUsers: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
