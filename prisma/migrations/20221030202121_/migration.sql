-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Highest', 'High', 'Medium', 'Low', 'Lowest');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "priority" TEXT;
