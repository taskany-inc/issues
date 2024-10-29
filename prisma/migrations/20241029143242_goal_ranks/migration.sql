-- CreateTable
CREATE TABLE "GoalRank" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "activityId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GoalRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalRank_activityId_idx" ON "GoalRank"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalRank_activityId_goalId_key" ON "GoalRank"("activityId", "goalId");

-- AddForeignKey
ALTER TABLE "GoalRank" ADD CONSTRAINT "GoalRank_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalRank" ADD CONSTRAINT "GoalRank_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
