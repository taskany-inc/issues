/*
  Warnings:

  - The `theme` column on the `Settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "theme",
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT E'system';

-- DropEnum
DROP TYPE "Theme";
