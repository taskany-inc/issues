/*
  Warnings:

  - You are about to drop the column `flow_id` on the `State` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "State" DROP CONSTRAINT "State_flow_id_fkey";

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "defaultStateId" TEXT;

-- AlterTable
ALTER TABLE "State" DROP COLUMN "flow_id";

-- CreateTable
CREATE TABLE "StatesOnFlow" (
    "flowId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,

    CONSTRAINT "StatesOnFlow_pkey" PRIMARY KEY ("flowId","stateId")
);

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_defaultStateId_fkey" FOREIGN KEY ("defaultStateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatesOnFlow" ADD CONSTRAINT "StatesOnFlow_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatesOnFlow" ADD CONSTRAINT "StatesOnFlow_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
