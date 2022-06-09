/*
  Warnings:

  - Made the column `q` on table `Estimate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `y` on table `Estimate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `Estimate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Estimate" ALTER COLUMN "q" SET NOT NULL,
ALTER COLUMN "y" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL;
