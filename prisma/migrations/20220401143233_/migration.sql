/*
  Warnings:

  - You are about to drop the column `user_id` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `activity_id` on the `Ghost` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_activity_id_fkey";

-- DropIndex
DROP INDEX "Activity_user_id_idx";

-- DropIndex
DROP INDEX "Activity_user_id_key";

-- DropIndex
DROP INDEX "Ghost_activity_id_key";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "Ghost" DROP COLUMN "activity_id";

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ghost_id_fkey" FOREIGN KEY ("ghost_id") REFERENCES "Ghost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
