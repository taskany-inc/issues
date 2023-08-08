-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc', current_timestamp),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc', current_timestamp),

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_releasesRead" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_releasesDelayed" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_version_key" ON "Release"("version");

-- CreateIndex
CREATE UNIQUE INDEX "_releasesRead_AB_unique" ON "_releasesRead"("A", "B");

-- CreateIndex
CREATE INDEX "_releasesRead_B_index" ON "_releasesRead"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_releasesDelayed_AB_unique" ON "_releasesDelayed"("A", "B");

-- CreateIndex
CREATE INDEX "_releasesDelayed_B_index" ON "_releasesDelayed"("B");

-- AddForeignKey
ALTER TABLE "_releasesRead" ADD CONSTRAINT "_releasesRead_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_releasesRead" ADD CONSTRAINT "_releasesRead_B_fkey" FOREIGN KEY ("B") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_releasesDelayed" ADD CONSTRAINT "_releasesDelayed_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_releasesDelayed" ADD CONSTRAINT "_releasesDelayed_B_fkey" FOREIGN KEY ("B") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
