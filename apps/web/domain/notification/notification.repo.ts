import prisma from "@/lib/db";

export const NotificationRepository = {
  create: async (
    userId: string,
    type: string,
    title: string,
    body?: string,
  ) => {
    return prisma.notification.create({
      data: {
        userId,
        title: type,
        body: title,
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

  getRecent: async (userId: string, take: number = 50) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take, // Limit to prevent massive payloads
    });
  },

  markAsRead: async (notificationId: string, userId: string) => {
    return prisma.notification.update({
      where: { id: notificationId, userId },
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

  findForUserPaginated: async (
    userId: string,
    limit: number,
    cursor?: string,
  ) => {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      take: limit + 1, // Fetch one extra record to see if a next page exists
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return notifications;
  },
};
