-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_goalId_fkey";

-- DropForeignKey
ALTER TABLE "GoalAchieveCriteria" DROP CONSTRAINT "GoalAchieveCriteria_goalIdAsCriteria_fkey";

-- DropForeignKey
ALTER TABLE "GoalAchieveCriteria" DROP CONSTRAINT "GoalAchieveCriteria_goalId_fkey";

-- DropForeignKey
ALTER TABLE "GoalHistory" DROP CONSTRAINT "GoalHistory_goalId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_goalId_fkey";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalHistory" ADD CONSTRAINT "GoalHistory_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_goalIdAsCriteria_fkey" FOREIGN KEY ("goalIdAsCriteria") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
