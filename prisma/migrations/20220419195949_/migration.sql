/*
  Warnings:

  - Made the column `flow_id` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_flow_id_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "flow_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
