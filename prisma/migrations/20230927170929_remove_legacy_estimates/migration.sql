/*
  Warnings:

  - You are about to drop the `Estimate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstimateToGoal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_activityId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateToGoal" DROP CONSTRAINT "EstimateToGoal_estimateId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateToGoal" DROP CONSTRAINT "EstimateToGoal_goalId_fkey";

-- DropTable
DROP TABLE "Estimate";

-- DropTable
DROP TABLE "EstimateToGoal";
