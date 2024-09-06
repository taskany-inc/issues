-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AlterTable
ALTER TABLE "GoalAchieveCriteria" ADD COLUMN     "externalTaskId" TEXT;

-- CreateTable
CREATE TABLE "ExternalTask" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "typeIconUrl" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "stateIconUrl" TEXT NOT NULL,
    "stateColor" TEXT,
    "stateCategoryId" INTEGER NOT NULL,
    "stateCategoryName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "ExternalTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalTask_externalId_idx" ON "ExternalTask"("externalId");

-- CreateIndex
CREATE INDEX "ExternalTask_title_idx" ON "ExternalTask"("title");

-- AddForeignKey
ALTER TABLE "GoalAchieveCriteria" ADD CONSTRAINT "GoalAchieveCriteria_externalTaskId_fkey" FOREIGN KEY ("externalTaskId") REFERENCES "ExternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
