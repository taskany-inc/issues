-- CreateEnum
CREATE TYPE "DateType" AS ENUM ('Strict', 'Quarter', 'Year');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "estimate" TIMESTAMP(3),
ADD COLUMN     "estimateType" "DateType";
