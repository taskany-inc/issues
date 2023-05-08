-- DropEnum
DROP TYPE "Priority";

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "delay" INTEGER,
    "retry" INTEGER,
    "cron" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
