/*
  Warnings:

  - You are about to drop the column `estimate` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `quarter` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "estimate",
DROP COLUMN "quarter",
DROP COLUMN "year";

-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Estimate" (
    "id" SERIAL NOT NULL,
    "q" TEXT,
    "y" TEXT,
    "date" TEXT,
    "goal_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Estimate_goal_id_idx" ON "Estimate"("goal_id");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
