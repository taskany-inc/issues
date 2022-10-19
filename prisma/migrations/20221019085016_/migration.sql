-- CreateTable
CREATE TABLE "_projectWatchers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_projectStargizers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_projectWatchers_AB_unique" ON "_projectWatchers"("A", "B");

-- CreateIndex
CREATE INDEX "_projectWatchers_B_index" ON "_projectWatchers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_projectStargizers_AB_unique" ON "_projectStargizers"("A", "B");

-- CreateIndex
CREATE INDEX "_projectStargizers_B_index" ON "_projectStargizers"("B");

-- AddForeignKey
ALTER TABLE "_projectWatchers" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_projectWatchers" ADD FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_projectStargizers" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_projectStargizers" ADD FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
