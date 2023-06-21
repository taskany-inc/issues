/*
  Warnings:

  - A unique constraint covering the columns `[projectId,scopeId]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Goal_projectId_scopeId_key" ON "Goal"("projectId", "scopeId");
