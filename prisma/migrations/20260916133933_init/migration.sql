-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('REEL', 'PHOTO', 'CAROUSEL');

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sltBioPageSlug" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "externalPostId" TEXT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostDailyMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "shares" INTEGER,
    "saves" INTEGER,

    CONSTRAINT "PostDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDailyMetric" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER NOT NULL,
    "totalViews" INTEGER,

    CONSTRAINT "AccountDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkClickImport" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "postId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL,
    "uniqueClicks" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'slt.bio',
    "rawPayload" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkClickImport_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDailyMetric" ADD CONSTRAINT "PostDailyMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDailyMetric" ADD CONSTRAINT "AccountDailyMetric_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClickImport" ADD CONSTRAINT "LinkClickImport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClickImport" ADD CONSTRAINT "LinkClickImport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
