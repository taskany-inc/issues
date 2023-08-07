-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Estimate" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "EstimateToGoal" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Filter" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Flow" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Ghost" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "GoalAchieveCriteria" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "GoalHistory" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Reaction" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "State" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);
