-- AlterTable
ALTER TABLE "UsageLog" ALTER COLUMN "endedAt" DROP NOT NULL,
ALTER COLUMN "durationMinutes" DROP NOT NULL;
