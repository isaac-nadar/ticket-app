/*
  Warnings:

  - Added the required column `status` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "status" "CardStatus" NOT NULL;
