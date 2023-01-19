/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_key_key" ON "Team"("key");
