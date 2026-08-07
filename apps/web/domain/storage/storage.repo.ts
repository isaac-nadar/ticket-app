import prisma from "@/lib/db";

export const StorageRepository = {
  createAttachment: async (data: {
    cardId: string;
    userId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    sizeBytes: number;
  }) => {
    return prisma.attachment.create({ data });
  },

  findByCardId: async (cardId: string) => {
    return prisma.attachment.findMany({ where: { cardId } });
  },
};
