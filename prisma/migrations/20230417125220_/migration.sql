-- CreateEnum
CREATE TYPE "FilterMode" AS ENUM ('Global', 'Project', 'User');

-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL,
    "mode" "FilterMode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "params" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_filterStargizers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_filterStargizers_AB_unique" ON "_filterStargizers"("A", "B");

-- CreateIndex
CREATE INDEX "_filterStargizers_B_index" ON "_filterStargizers"("B");

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_filterStargizers" ADD CONSTRAINT "_filterStargizers_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_filterStargizers" ADD CONSTRAINT "_filterStargizers_B_fkey" FOREIGN KEY ("B") REFERENCES "Filter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
