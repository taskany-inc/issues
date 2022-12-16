/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Team_title_key" ON "Team"("title");
