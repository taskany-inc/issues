/*
  Warnings:

  - You are about to drop the column `defaultStateId` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the `StatesOnFlow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_defaultStateId_fkey";

-- DropForeignKey
ALTER TABLE "StatesOnFlow" DROP CONSTRAINT "StatesOnFlow_flowId_fkey";

-- DropForeignKey
ALTER TABLE "StatesOnFlow" DROP CONSTRAINT "StatesOnFlow_stateId_fkey";

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "defaultStateId";

-- DropTable
DROP TABLE "StatesOnFlow";

-- CreateTable
CREATE TABLE "_FlowToState" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FlowToState_AB_unique" ON "_FlowToState"("A", "B");

-- CreateIndex
CREATE INDEX "_FlowToState_B_index" ON "_FlowToState"("B");

-- AddForeignKey
ALTER TABLE "_FlowToState" ADD FOREIGN KEY ("A") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlowToState" ADD FOREIGN KEY ("B") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;
