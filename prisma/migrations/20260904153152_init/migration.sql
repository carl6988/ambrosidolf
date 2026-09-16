-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sltBioPageSlug" TEXT,
    CONSTRAINT "Account_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "externalPostId" TEXT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostDailyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "shares" INTEGER,
    "saves" INTEGER,
    CONSTRAINT "PostDailyMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountDailyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "followers" INTEGER NOT NULL,
    "totalViews" INTEGER,
    CONSTRAINT "AccountDailyMetric_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkClickImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "postId" TEXT,
    "date" DATETIME NOT NULL,
    "clicks" INTEGER NOT NULL,
    "uniqueClicks" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'slt.bio',
    "rawPayload" TEXT,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkClickImport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LinkClickImport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE INDEX "Account_creatorId_idx" ON "Account"("creatorId");

-- CreateIndex
CREATE INDEX "Post_accountId_idx" ON "Post"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_accountId_externalPostId_key" ON "Post"("accountId", "externalPostId");

-- CreateIndex
CREATE UNIQUE INDEX "PostDailyMetric_postId_date_key" ON "PostDailyMetric"("postId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDailyMetric_accountId_date_key" ON "AccountDailyMetric"("accountId", "date");

-- CreateIndex
CREATE INDEX "LinkClickImport_accountId_idx" ON "LinkClickImport"("accountId");

-- CreateIndex
CREATE INDEX "LinkClickImport_postId_idx" ON "LinkClickImport"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkClickImport_accountId_date_source_key" ON "LinkClickImport"("accountId", "date", "source");
