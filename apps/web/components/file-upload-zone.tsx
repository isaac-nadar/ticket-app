"use client";

import { useState } from "react";
import {
  getUploadUrlAction,
  saveAttachmentAction,
} from "@/app/actions/storage-actions";
import { useRouter } from "next/navigation";

interface FileUploadZoneProps {
  cardId: string;
  boardId: string;
}

export function FileUploadZone({ cardId, boardId }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    try {
      // 1. Get the Presigned URL from our Next.js backend
      const authRes = await getUploadUrlAction({
        fileName: file.name,
        fileType: file.type,
      });

      if (!authRes?.success || !authRes.data) {
        // If it failed, throw the backend error message (or a fallback)
        throw new Error(
          "error" in authRes ? authRes.error : "Failed to get upload ticket",
        );
      }

      if (!authRes.data?.uploadUrl)
        throw new Error("Failed to get upload ticket");

      const { uploadUrl, fileUrl } = authRes.data;

      // 2. Upload directly to AWS S3 (Bypassing Next.js entirely!)
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!s3Response.ok) throw new Error("S3 Upload Failed");

      // 3. Save the database record
      await saveAttachmentAction({
        cardId,
        boardId,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type,
        sizeBytes: file.size,
      });

      console.log("✅ File uploaded successfully!");
      router.refresh(); // Refresh the UI to show the new attachment
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative mt-4 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
        ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-300 bg-gray-50/50 hover:bg-gray-100"}
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        type="file"
        onChange={handleFileSelect}
        className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
        disabled={isUploading}
      />
      <div className="text-center">
        {isUploading ? (
          <p className="text-sm font-medium text-gray-500 animate-pulse">
            Uploading to S3...
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Click or drag a file to attach
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF up to 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
