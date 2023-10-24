-- CreateTable
CREATE TABLE "GoalsFilterPreset" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "issuers" TEXT[],
    "owners" TEXT[],
    "participants" TEXT[],
    "states" TEXT[],
    "priorities" TEXT[],
    "estimates" TEXT[],
    "projects" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "GoalsFilterPreset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GoalsFilterPreset" ADD CONSTRAINT "GoalsFilterPreset_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
