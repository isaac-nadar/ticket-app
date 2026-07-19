-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "nextSequence" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "prefix" TEXT;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "sequenceNum" INTEGER NOT NULL DEFAULT 0;
