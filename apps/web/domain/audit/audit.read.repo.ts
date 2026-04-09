import prisma from "@/lib/db";

export const AuditReadRepository = {
  findByEntity: async (entity: string, entityId: string) => {
    return prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};