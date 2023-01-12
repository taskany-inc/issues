-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "flowId" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
