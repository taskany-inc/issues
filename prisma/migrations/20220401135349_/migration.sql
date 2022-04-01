/*
  Warnings:

  - You are about to drop the column `user_id` on the `Ghost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ghost_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_user_id_fkey";

-- DropIndex
DROP INDEX "Ghost_user_id_key";

-- AlterTable
ALTER TABLE "Ghost" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ghost_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_ghost_id_key" ON "User"("ghost_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ghost_id_fkey" FOREIGN KEY ("ghost_id") REFERENCES "Ghost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
