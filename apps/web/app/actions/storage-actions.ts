"use server";

import { createSafeAction } from "@/lib/safe-action";
import { StorageService } from "@/domain/storage/storage.service";
import prisma from "@/lib/db";
import { DomainEvents } from "@/domain/events/domain-events";

// 1. Ask AWS for a Presigned URL
export const getUploadUrlAction = createSafeAction(
  async (data: { fileName: string; fileType: string }, { user }) => {
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
    const attachment = await prisma.attachment.create({
      data: {
        cardId: data.cardId,
        userId: user.userId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        sizeBytes: data.sizeBytes,
      },
    });

    // Optional: Broadcast this so the Real-Time Pusher hook updates the UI for everyone!
    await DomainEvents.dispatch({
      type: "CARD_UPDATED",
      payload: {
        boardId: data.boardId,
        cardId: data.cardId,
        userId: user.userId,
      },
    });

    return { success: true, data: attachment };
  },
);
