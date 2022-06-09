/*
  Warnings:

  - You are about to drop the `_goalStars` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_goalStars" DROP CONSTRAINT "_goalStars_A_fkey";

-- DropForeignKey
ALTER TABLE "_goalStars" DROP CONSTRAINT "_goalStars_B_fkey";

-- DropTable
DROP TABLE "_goalStars";

-- CreateTable
CREATE TABLE "_goalStargizers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_goalStargizers_AB_unique" ON "_goalStargizers"("A", "B");

-- CreateIndex
CREATE INDEX "_goalStargizers_B_index" ON "_goalStargizers"("B");

-- AddForeignKey
ALTER TABLE "_goalStargizers" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalStargizers" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
