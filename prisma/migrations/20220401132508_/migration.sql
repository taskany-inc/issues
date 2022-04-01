/*
  Warnings:

  - You are about to drop the column `user_id` on the `Ghost` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_user_id_fkey";

-- DropIndex
DROP INDEX "Ghost_user_id_idx";

-- DropIndex
DROP INDEX "Ghost_user_id_key";

-- AlterTable
ALTER TABLE "Ghost" DROP COLUMN "user_id";

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
