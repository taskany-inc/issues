-- AlterTable
ALTER TABLE "ExternalTask" ALTER COLUMN "ownerEmail" DROP NOT NULL,
ALTER COLUMN "ownerName" DROP NOT NULL,
ALTER COLUMN "ownerId" DROP NOT NULL;
