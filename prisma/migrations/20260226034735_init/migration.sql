-- CreateTable
CREATE TABLE "EmailCache" (
    "emailId" TEXT NOT NULL PRIMARY KEY,
    "score" REAL,
    "scoredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "jiraKey" TEXT,
    "updatedAt" DATETIME NOT NULL
);
