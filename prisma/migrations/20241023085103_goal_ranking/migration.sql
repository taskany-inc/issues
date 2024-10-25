-- CreateTable
CREATE TABLE "GoalRanking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "goalRanks" JSONB NOT NULL,

    CONSTRAINT "GoalRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalRanking_userId_projectId_key" ON "GoalRanking"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "GoalRanking" ADD CONSTRAINT "GoalRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalRanking" ADD CONSTRAINT "GoalRanking_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
