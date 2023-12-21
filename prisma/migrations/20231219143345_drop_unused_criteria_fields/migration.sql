/*
  Warnings:

  - You are about to drop the column `goalIdAsCriteria` on the `GoalAchieveCriteria` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GoalAchieveCriteria" DROP CONSTRAINT "GoalAchieveCriteria_goalIdAsCriteria_fkey";

-- DropIndex
DROP INDEX "GoalAchieveCriteria_goalIdAsCriteria_key";

-- AlterTable
ALTER TABLE "GoalAchieveCriteria" DROP COLUMN "goalIdAsCriteria";
