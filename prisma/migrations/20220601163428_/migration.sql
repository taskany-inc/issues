/*
  Warnings:

  - You are about to drop the column `slug` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Tag` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Project_slug_idx";

-- DropIndex
DROP INDEX "Project_slug_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "color";

-- CreateIndex
CREATE INDEX "Project_key_idx" ON "Project"("key");
