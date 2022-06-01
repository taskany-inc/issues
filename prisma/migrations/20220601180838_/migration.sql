/*
  Warnings:

  - You are about to drop the column `color` on the `State` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "State" DROP COLUMN "color",
ADD COLUMN     "hue" INTEGER NOT NULL DEFAULT 0;
