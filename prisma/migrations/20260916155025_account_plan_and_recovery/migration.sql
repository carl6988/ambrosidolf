-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "dailyPostsPlan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "CreatorRecoveryAccount" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorRecoveryAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorRecoveryAccount_creatorId_idx" ON "CreatorRecoveryAccount"("creatorId");

-- AddForeignKey
ALTER TABLE "CreatorRecoveryAccount" ADD CONSTRAINT "CreatorRecoveryAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
