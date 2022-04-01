/*
  Warnings:

  - A unique constraint covering the columns `[A,B]` on the table `_goalParticipants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_teamParticipants` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `B` on the `_goalParticipants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_teamParticipants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_issuer_id_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "_goalParticipants" DROP CONSTRAINT "_goalParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_goalParticipants" DROP CONSTRAINT "_goalParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "_teamParticipants" DROP CONSTRAINT "_teamParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamParticipants" DROP CONSTRAINT "_teamParticipants_B_fkey";

-- AlterTable
ALTER TABLE "_goalParticipants" ALTER COLUMN "A" SET DATA TYPE TEXT,
DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "_teamParticipants" ALTER COLUMN "A" SET DATA TYPE TEXT,
DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Ghost" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ghost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "ghost_id" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ghost_email_key" ON "Ghost"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ghost_user_id_key" ON "Ghost"("user_id");

-- CreateIndex
CREATE INDEX "Ghost_host_id_idx" ON "Ghost"("host_id");

-- CreateIndex
CREATE INDEX "Ghost_user_id_idx" ON "Ghost"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_ghost_id_key" ON "Activity"("ghost_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_user_id_key" ON "Activity"("user_id");

-- CreateIndex
CREATE INDEX "Activity_ghost_id_idx" ON "Activity"("ghost_id");

-- CreateIndex
CREATE INDEX "Activity_user_id_idx" ON "Activity"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_goalParticipants_AB_unique" ON "_goalParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_goalParticipants_B_index" ON "_goalParticipants"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_teamParticipants_AB_unique" ON "_teamParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_teamParticipants_B_index" ON "_teamParticipants"("B");

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ghost_id_fkey" FOREIGN KEY ("ghost_id") REFERENCES "Ghost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamParticipants" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamParticipants" ADD FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalParticipants" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalParticipants" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
