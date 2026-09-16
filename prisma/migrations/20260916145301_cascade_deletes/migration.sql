-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "AccountDailyMetric" DROP CONSTRAINT "AccountDailyMetric_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PostDailyMetric" DROP CONSTRAINT "PostDailyMetric_postId_fkey";

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDailyMetric" ADD CONSTRAINT "PostDailyMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDailyMetric" ADD CONSTRAINT "AccountDailyMetric_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
