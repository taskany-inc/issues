/*
  Warnings:

  - The primary key for the `Team` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_id_fkey";

-- DropForeignKey
ALTER TABLE "_teamParticipants" DROP CONSTRAINT "_teamParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamProjects" DROP CONSTRAINT "_teamProjects_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamStargizers" DROP CONSTRAINT "_teamStargizers_B_fkey";

-- DropForeignKey
ALTER TABLE "_teamWatchers" DROP CONSTRAINT "_teamWatchers_B_fkey";

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "teamId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Team" DROP CONSTRAINT "Team_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Team_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Team_id_seq";

-- AlterTable
ALTER TABLE "_teamParticipants" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_teamProjects" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_teamStargizers" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_teamWatchers" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_id_fkey" FOREIGN KEY ("id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamParticipants" ADD CONSTRAINT "_teamParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamWatchers" ADD CONSTRAINT "_teamWatchers_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamStargizers" ADD CONSTRAINT "_teamStargizers_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamProjects" ADD CONSTRAINT "_teamProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
