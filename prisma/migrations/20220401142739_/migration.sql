/*
  Warnings:

  - A unique constraint covering the columns `[activity_id]` on the table `Ghost` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[activity_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_ghost_id_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_user_id_fkey";

-- AlterTable
ALTER TABLE "Ghost" ADD COLUMN     "activity_id" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activity_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ghost_activity_id_key" ON "Ghost"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_activity_id_key" ON "User"("activity_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
