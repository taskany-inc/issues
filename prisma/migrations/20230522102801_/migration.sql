-- CreateTable
CREATE TABLE "GoalHistory" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "nextValue" TEXT,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalHistory_id_idx" ON "GoalHistory"("id");

-- CreateIndex
CREATE INDEX "GoalHistory_goalId_idx" ON "GoalHistory"("goalId");

-- AddForeignKey
ALTER TABLE "GoalHistory" ADD CONSTRAINT "GoalHistory_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalHistory" ADD CONSTRAINT "GoalHistory_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
