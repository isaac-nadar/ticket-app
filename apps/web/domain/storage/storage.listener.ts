import { DomainEvents } from "@/domain/events/domain-events";

// domain/storage/storage.listener.ts
DomainEvents.subscribe("CARD_DELETED", async (payload) => {
  // 1. Fetch all attachments for this card
  const attachments = await prisma.attachment.findMany({
    where: { cardId: payload.cardId },
  });

  // 2. Tell AWS S3 to delete the physical files
  //   for (const file of attachments) {
  //     await s3Client.send(
  //       new DeleteObjectCommand({
  //         Bucket: process.env.S3_BUCKET_NAME,
  //         Key: file.fileName, // The unique key in S3
  //       }),
  //     );
  //   }

  // (Note: Prisma's onDelete: Cascade will automatically handle deleting
  // the database rows when the Card is deleted, so S3 is all we care about here!)
});
