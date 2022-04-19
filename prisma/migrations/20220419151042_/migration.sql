-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "flow_id" TEXT;

-- DropEnum
DROP TYPE "Quarter";

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "graph" TEXT,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flow_title_key" ON "Flow"("title");

-- CreateIndex
CREATE UNIQUE INDEX "State_title_key" ON "State"("title");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
