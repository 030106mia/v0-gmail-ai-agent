-- AlterTable
ALTER TABLE "EmailCache" ADD COLUMN "fromEmail" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "fromName" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "language" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "originalBody" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "receivedAt" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "subject" TEXT;
ALTER TABLE "EmailCache" ADD COLUMN "translatedZh" TEXT;
