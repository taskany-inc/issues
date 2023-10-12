/*
  Warnings:

  - You are about to drop the column `priority` on the `Goal` table. All the data in the column will be lost.
  - The primary key for the `Priority` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_priorityId_fkey";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "priority",
ALTER COLUMN "priorityId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Priority" DROP CONSTRAINT "Priority_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Priority_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Priority_id_seq";

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;
