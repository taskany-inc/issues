/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `Ghost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_email_fkey";

-- AlterTable
ALTER TABLE "Ghost" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ghost_user_id_key" ON "Ghost"("user_id");

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;
