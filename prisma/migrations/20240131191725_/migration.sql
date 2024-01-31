/*
  Warnings:

  - A unique constraint covering the columns `[emoji,commentId,activityId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reaction_emoji_commentId_activityId_key" ON "Reaction"("emoji", "commentId", "activityId");
