-- CreateEnum
CREATE TYPE "StateType" AS ENUM ('NotStarted', 'InProgress', 'Completed', 'Failed', 'Canceled');

-- AlterTable
ALTER TABLE "State" ADD COLUMN     "type" "StateType";
