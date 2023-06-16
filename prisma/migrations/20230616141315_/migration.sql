-- CreateTable
CREATE TABLE "GoalAchieveCriteria" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "goalIdAsCriteria" TEXT,
    "title" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalAchieveCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalAchieveCriteria_goalIdAsCriteria_key" ON "GoalAchieveCriteria"("goalIdAsCriteria");

-- CreateIndex
CREATE INDEX "GoalAchieveCriteria_title_idx" ON "GoalAchieveCriteria"("title");

-- CreateIndex
CREATE INDEX "GoalAchieveCriteria_goalId_idx" ON "GoalAchieveCriteria"("goalId");

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_goalIdAsCriteria_fkey" FOREIGN KEY ("goalIdAsCriteria") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
