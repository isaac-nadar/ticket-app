/*
  Warnings:

  - You are about to drop the column `status` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "status";

-- DropEnum
DROP TYPE "CardStatus";
