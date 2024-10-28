-- AlterTable
ALTER TABLE "ExternalTask" ADD COLUMN     "assigneeEmail" TEXT,
ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "assigneeName" TEXT,
ADD COLUMN     "creatorEmail" TEXT,
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "creatorName" TEXT;

-- UpdateTable
UPDATE "ExternalTask" SET   "creatorEmail" = "ownerEmail",
"creatorId" = "ownerId",
"creatorName" = "ownerName";
