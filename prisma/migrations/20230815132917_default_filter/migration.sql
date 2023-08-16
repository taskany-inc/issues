-- DropForeignKey
ALTER TABLE "Filter" DROP CONSTRAINT "Filter_activityId_fkey";

-- AlterTable
ALTER TABLE "Filter" ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "activityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
