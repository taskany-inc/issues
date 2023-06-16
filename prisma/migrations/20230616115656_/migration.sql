-- CreateTable
CREATE TABLE "GoalAchiveCriteria" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "goalIdAsCriteria" TEXT,
    "title" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalAchiveCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalAchiveCriteria_goalIdAsCriteria_key" ON "GoalAchiveCriteria"("goalIdAsCriteria");

-- CreateIndex
CREATE INDEX "GoalAchiveCriteria_title_idx" ON "GoalAchiveCriteria"("title");

-- CreateIndex
CREATE INDEX "GoalAchiveCriteria_goalId_idx" ON "GoalAchiveCriteria"("goalId");

-- AddForeignKey
ALTER TABLE "GoalAchiveCriteria" ADD CONSTRAINT "GoalAchiveCriteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchiveCriteria" ADD CONSTRAINT "GoalAchiveCriteria_goalIdAsCriteria_fkey" FOREIGN KEY ("goalIdAsCriteria") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAchiveCriteria" ADD CONSTRAINT "GoalAchiveCriteria_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
