-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "externalTeamId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_projects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalTeamId_key" ON "Team"("externalTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "_projects_AB_unique" ON "_projects"("A", "B");

-- CreateIndex
CREATE INDEX "_projects_B_index" ON "_projects"("B");

-- AddForeignKey
ALTER TABLE "_projects" ADD CONSTRAINT "_projects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_projects" ADD CONSTRAINT "_projects_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
