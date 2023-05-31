-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_goalId_fkey";

-- DropIndex
DROP INDEX "Estimate_goalId_idx";

-- CreateTable
CREATE TABLE "EstimateToGoal" (
    "id" SERIAL NOT NULL,
    "goalId" TEXT NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "createadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateToGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateToGoal_goalId_idx" ON "EstimateToGoal"("goalId");

-- CreateIndex
CREATE INDEX "EstimateToGoal_estimateId_idx" ON "EstimateToGoal"("estimateId");

-- CreateIndex
CREATE INDEX "Estimate_date_idx" ON "Estimate"("date");

-- AddForeignKey
ALTER TABLE "EstimateToGoal" ADD CONSTRAINT "EstimateToGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateToGoal" ADD CONSTRAINT "EstimateToGoal_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fill join table
INSERT INTO "EstimateToGoal" ("goalId", "estimateId", "createdAt")
SELECT "goalId", "id", "createdAt" from "Estimate"
