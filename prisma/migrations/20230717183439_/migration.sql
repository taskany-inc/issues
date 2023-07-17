-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_priorityId_fkey";

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "priorityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;
