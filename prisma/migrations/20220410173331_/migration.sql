-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "project_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
