/*
  Warnings:

  - You are about to drop the column `created_at` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `ghost_id` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `goal_id` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Criteria` table. All the data in the column will be lost.
  - You are about to drop the column `goal_id` on the `Criteria` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Criteria` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Estimate` table. All the data in the column will be lost.
  - You are about to drop the column `goal_id` on the `Estimate` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Estimate` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Ghost` table. All the data in the column will be lost.
  - You are about to drop the column `host_id` on the `Ghost` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Ghost` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `issuer_id` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `flow_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `comment_id` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `goal_id` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `State` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `State` table. All the data in the column will be lost.
  - You are about to drop the column `activity_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `host_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `invited_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ghostId]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[settingsId]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[activityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalId` to the `Criteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalId` to the `Estimate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `Ghost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `flowId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('dark', 'light');

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_ghost_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "Criteria" DROP CONSTRAINT "Criteria_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_host_id_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_issuer_id_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_project_id_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_flow_id_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_host_id_fkey";

-- DropIndex
DROP INDEX "Activity_ghost_id_idx";

-- DropIndex
DROP INDEX "Activity_ghost_id_key";

-- DropIndex
DROP INDEX "Comment_author_id_idx";

-- DropIndex
DROP INDEX "Comment_goal_id_idx";

-- DropIndex
DROP INDEX "Criteria_goal_id_idx";

-- DropIndex
DROP INDEX "Estimate_goal_id_idx";

-- DropIndex
DROP INDEX "Ghost_host_id_idx";

-- DropIndex
DROP INDEX "Goal_issuer_id_idx";

-- DropIndex
DROP INDEX "Goal_owner_id_idx";

-- DropIndex
DROP INDEX "Reaction_author_id_idx";

-- DropIndex
DROP INDEX "Reaction_comment_id_idx";

-- DropIndex
DROP INDEX "Reaction_goal_id_idx";

-- DropIndex
DROP INDEX "User_activity_id_key";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "created_at",
DROP COLUMN "ghost_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ghostId" TEXT,
ADD COLUMN     "settingsId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "author_id",
DROP COLUMN "created_at",
DROP COLUMN "goal_id",
DROP COLUMN "updated_at",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goalId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Criteria" DROP COLUMN "created_at",
DROP COLUMN "goal_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goalId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Estimate" DROP COLUMN "created_at",
DROP COLUMN "goal_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goalId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recommended" BOOLEAN,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Ghost" DROP COLUMN "created_at",
DROP COLUMN "host_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hostId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "created_at",
DROP COLUMN "issuer_id",
DROP COLUMN "owner_id",
DROP COLUMN "project_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "issuerId" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "created_at",
DROP COLUMN "flow_id",
DROP COLUMN "owner_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "flowId" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "author_id",
DROP COLUMN "comment_id",
DROP COLUMN "created_at",
DROP COLUMN "goal_id",
DROP COLUMN "updated_at",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goalId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "State" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activity_id",
DROP COLUMN "created_at",
DROP COLUMN "host_id",
DROP COLUMN "invited_at",
DROP COLUMN "updated_at",
ADD COLUMN     "activityId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "theme" "Theme",
    "flowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_ghostId_key" ON "Activity"("ghostId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_settingsId_key" ON "Activity"("settingsId");

-- CreateIndex
CREATE INDEX "Activity_ghostId_idx" ON "Activity"("ghostId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_goalId_idx" ON "Comment"("goalId");

-- CreateIndex
CREATE INDEX "Criteria_goalId_idx" ON "Criteria"("goalId");

-- CreateIndex
CREATE INDEX "Estimate_goalId_idx" ON "Estimate"("goalId");

-- CreateIndex
CREATE INDEX "Ghost_hostId_idx" ON "Ghost"("hostId");

-- CreateIndex
CREATE INDEX "Goal_ownerId_idx" ON "Goal"("ownerId");

-- CreateIndex
CREATE INDEX "Goal_issuerId_idx" ON "Goal"("issuerId");

-- CreateIndex
CREATE INDEX "Reaction_authorId_idx" ON "Reaction"("authorId");

-- CreateIndex
CREATE INDEX "Reaction_goalId_idx" ON "Reaction"("goalId");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "Reaction"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_activityId_key" ON "User"("activityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ghostId_fkey" FOREIGN KEY ("ghostId") REFERENCES "Ghost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "Settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criteria" ADD CONSTRAINT "Criteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
