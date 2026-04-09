import prisma from "@/lib/db";

export const AuditRepository = {
  log: async (
    entity: string,
    entityId: string,
    action: string,
    payload: unknown
  ) => {
    return prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        payload,
      },
    });
  },
};
