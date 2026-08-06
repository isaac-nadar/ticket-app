"use server";

import { createSafeAction } from "@/lib/safe-action";
import { StorageService } from "@/domain/storage/storage.service";
import { AuthzService } from "@/domain/authz/authz.service";
import { enforceRateLimit } from "@/domain/rate-limit/rate-limit.service";
import prisma from "@/lib/db";
import { DomainEvents } from "@/domain/events/domain-events";
import { randomUUID } from "crypto";

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

    // Notify the card's current assignee that a file was attached
    // (never the uploader themselves).
    const card = await prisma.card.findUnique({
      where: { id: data.cardId },
      select: { assigneeId: true },
    });

    if (card?.assigneeId && card.assigneeId !== user.userId) {
      await DomainEvents.dispatch({
        id: randomUUID(),
        type: "NOTIFICATION_CREATED",
        payload: {
          userId: card.assigneeId,
          actorId: user.userId,
          cardId: data.cardId,
          title: "New attachment",
          body: `${user.name ?? "Someone"} attached a file to a card you're assigned to`,
        },
      });
    }

    // Broadcast so the Real-Time Pusher hook updates the board for everyone!
    await DomainEvents.dispatch({
      id: randomUUID(),
      type: "CARD_UPDATED",
      payload: {
        boardId: data.boardId,
        cardId: data.cardId,
        actorId: user.userId,
        changes: {},
      },
    });

    return { success: true, data: attachment };
  },
);
