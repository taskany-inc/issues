-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_id_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_id_fkey";

-- DropIndex
DROP INDEX "Project_activityId_idx";

-- DropIndex
DROP INDEX "Team_activityId_idx";

-- CreateTable
CREATE TABLE "_parentChildren" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_teamChildren" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_parentChildren_AB_unique" ON "_parentChildren"("A", "B");

-- CreateIndex
CREATE INDEX "_parentChildren_B_index" ON "_parentChildren"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_teamChildren_AB_unique" ON "_teamChildren"("A", "B");

-- CreateIndex
CREATE INDEX "_teamChildren_B_index" ON "_teamChildren"("B");

-- AddForeignKey
ALTER TABLE "_parentChildren" ADD CONSTRAINT "_parentChildren_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_parentChildren" ADD CONSTRAINT "_parentChildren_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamChildren" ADD CONSTRAINT "_teamChildren_A_fkey" FOREIGN KEY ("A") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_teamChildren" ADD CONSTRAINT "_teamChildren_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
