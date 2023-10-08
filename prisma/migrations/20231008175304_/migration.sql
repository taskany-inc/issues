-- CreateTable
CREATE TABLE "_partnershipProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_partnershipProjects_AB_unique" ON "_partnershipProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_partnershipProjects_B_index" ON "_partnershipProjects"("B");

-- AddForeignKey
ALTER TABLE "_partnershipProjects" ADD CONSTRAINT "_partnershipProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partnershipProjects" ADD CONSTRAINT "_partnershipProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
