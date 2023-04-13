/*
  Warnings:

  - You are about to drop the column `team` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamChildren` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamProjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamStargizers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamWatchers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_flowId_fkey";

-- DropForeignKey
ALTER TABLE "_teamChildren" DROP CONSTRAINT "_teamChildren_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamChildren" DROP CONSTRAINT "_teamChildren_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamParticipants" DROP CONSTRAINT "_teamParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamParticipants" DROP CONSTRAINT "_teamParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamProjects" DROP CONSTRAINT "_teamProjects_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamProjects" DROP CONSTRAINT "_teamProjects_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamStargizers" DROP CONSTRAINT "_teamStargizers_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamStargizers" DROP CONSTRAINT "_teamStargizers_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamWatchers" DROP CONSTRAINT "_teamWatchers_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamWatchers" DROP CONSTRAINT "_teamWatchers_B_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "team";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "_teamChildren";

-- DropTable
DROP TABLE "_teamParticipants";

-- DropTable
DROP TABLE "_teamProjects";

-- DropTable
DROP TABLE "_teamStargizers";

-- DropTable
DROP TABLE "_teamWatchers";
