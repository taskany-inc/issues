-- CreateTable
CREATE TABLE "_goalWatchers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_goalStars" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_goalWatchers_AB_unique" ON "_goalWatchers"("A", "B");

-- CreateIndex
CREATE INDEX "_goalWatchers_B_index" ON "_goalWatchers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_goalStars_AB_unique" ON "_goalStars"("A", "B");

-- CreateIndex
CREATE INDEX "_goalStars_B_index" ON "_goalStars"("B");

-- AddForeignKey
ALTER TABLE "_goalWatchers" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalWatchers" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalStars" ADD FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goalStars" ADD FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
