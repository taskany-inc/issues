-- CreateTable
CREATE TABLE "_projectAccess" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_projectAccess_AB_unique" ON "_projectAccess"("A", "B");

-- CreateIndex
CREATE INDEX "_projectAccess_B_index" ON "_projectAccess"("B");

-- AddForeignKey
ALTER TABLE "_projectAccess" ADD CONSTRAINT "_projectAccess_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_projectAccess" ADD CONSTRAINT "_projectAccess_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
