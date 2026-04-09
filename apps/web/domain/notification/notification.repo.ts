import prisma from "@/lib/db";

export const NotificationRepository = {
  create: async (userId: string, type: string, body?: string) => {
    return prisma.notification.create({
      data: {
        userId,
        type,
        body,
      },
    });
  },

  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  },

  findByUser: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  markAsRead: async (notificationId: string) => {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  countUnread: async (userId: string) => {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  findForUser: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};
