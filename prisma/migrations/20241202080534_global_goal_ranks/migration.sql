-- DropForeignKey
ALTER TABLE "GoalRank" DROP CONSTRAINT "GoalRank_activityId_fkey";

-- DropIndex
DROP INDEX "GoalRank_activityId_goalId_key";

-- AlterTable
ALTER TABLE "GoalRank" ALTER COLUMN "activityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GoalRank" ADD CONSTRAINT "GoalRank_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Unique ranks for goals
CREATE UNIQUE INDEX goal_rank_activity_id_unique ON "GoalRank"("goalId", "activityId") WHERE "activityId" IS NOT NULL;
CREATE UNIQUE INDEX goal_rank_unique ON "GoalRank"("goalId") WHERE "activityId" IS NULL;
