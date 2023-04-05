/*
  Warnings:

  - You are about to drop the column `key` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Team` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Project_key_idx";

-- DropIndex
DROP INDEX "Project_key_key";

-- DropIndex
DROP INDEX "Team_key_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "key";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "key";
