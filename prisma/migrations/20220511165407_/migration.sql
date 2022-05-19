/*
  Warnings:

  - The primary key for the `Goal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[key]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_goalId_fkey";

-- DropForeignKey
ALTER TABLE "_connected" DROP CONSTRAINT "_connected_A_fkey";

-- DropForeignKey
ALTER TABLE "_connected" DROP CONSTRAINT "_connected_B_fkey";

-- DropForeignKey
ALTER TABLE "Criteria" DROP CONSTRAINT "Criteria_goalId_fkey";

-- DropForeignKey
ALTER TABLE "_dependsOn" DROP CONSTRAINT "_dependsOn_A_fkey";

-- DropForeignKey
ALTER TABLE "_dependsOn" DROP CONSTRAINT "_dependsOn_B_fkey";

-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_goalId_fkey";

-- DropForeignKey
ALTER TABLE "_goalParticipants" DROP CONSTRAINT "_goalParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "_GoalToTag" DROP CONSTRAINT "_GoalToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_goalId_fkey";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "goalId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_connected" ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Criteria" ALTER COLUMN "goalId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_dependsOn" ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Estimate" ALTER COLUMN "goalId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Goal_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Goal_id_seq";

-- AlterTable
ALTER TABLE "_goalParticipants" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_GoalToTag" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reaction" ALTER COLUMN "goalId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_key_key" ON "Project"("key");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criteria" ADD CONSTRAINT "Criteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalParticipants" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalToTag" ADD FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dependsOn" ADD FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dependsOn" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_connected" ADD FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_connected" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
