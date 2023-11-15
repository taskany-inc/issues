-- AlterTable
ALTER TABLE "GoalAchieveCriteria" ADD COLUMN     "criteriaGoalId" TEXT;

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_criteriaGoalId_fkey" FOREIGN KEY ("criteriaGoalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UpdateCriteriaData
UPDATE "GoalAchieveCriteria"
SET "criteriaGoalId" = "goalIdAsCriteria", "updatedAt" = "updatedAt"
