/*
  Warnings:

  - Made the column `priority` on table `Goal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Flow_title_key";

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "priority" SET NOT NULL;
