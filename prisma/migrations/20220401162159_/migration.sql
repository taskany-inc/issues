/*
  Warnings:

  - You are about to drop the column `ghost_id` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_ghost_id_fkey";

-- DropIndex
DROP INDEX "User_ghost_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "ghost_id",
ADD COLUMN     "host_id" TEXT,
ADD COLUMN     "invited_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
