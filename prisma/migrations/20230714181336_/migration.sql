/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Flow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `priorityId` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "priorityId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Priority" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Priority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flow_title_key" ON "Flow"("title");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
