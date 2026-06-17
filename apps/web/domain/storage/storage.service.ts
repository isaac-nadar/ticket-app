import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Initialize S3 Client outside the function so it caches across serverless cold starts
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const StorageService = {
  generateUploadUrl: async (
    fileName: string,
    fileType: string,
    userId: string,
  ) => {
    // 1. Sanitize the filename and add a random UUID to prevent overwriting
    const extension = fileName.split(".").pop() || "bin";
    const uniqueId = crypto.randomUUID();
    const s3Key = `attachments/${userId}/${uniqueId}.${extension}`;

    // 2. Build the S3 upload command
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      ContentType: fileType,
    });

    // 3. Generate the temporary ticket (expires in 60 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // 4. Construct the final public URL where the file will live
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;

    return { uploadUrl, fileUrl, s3Key };
  },
};
