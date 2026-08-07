"use server";

import { createSafeAction } from "@/lib/safe-action";
import { StorageService } from "@/domain/storage/storage.service";
import { AuthzService } from "@/domain/authz/authz.service";
import { enforceRateLimit } from "@/domain/rate-limit/rate-limit.service";

// 1. Ask AWS for a Presigned URL
export const getUploadUrlAction = createSafeAction(
  async (data: { fileName: string; fileType: string }, { user }) => {
    await enforceRateLimit(user.userId);

    const credentials = await StorageService.generateUploadUrl(
      data.fileName,
      data.fileType,
      user.userId,
    );
    return { success: true, data: credentials };
  },
);

// 2. Save the final file details into PostgreSQL
export const saveAttachmentAction = createSafeAction(
  async (
    data: {
      cardId: string;
      boardId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      sizeBytes: number;
    },
    { user },
  ) => {
    await AuthzService.requireCardAccess(user.userId, data.cardId, user.role);

    const attachment = await StorageService.saveAttachment(
      data,
      user.userId,
      user.name,
    );

    return { success: true, data: attachment };
  },
);
