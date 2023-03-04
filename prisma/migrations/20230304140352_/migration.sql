/*
  Warnings:

  - Made the column `key` on table `Team` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "slug" DROP NOT NULL,
ALTER COLUMN "key" SET NOT NULL;
