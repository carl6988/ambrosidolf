-- CreateTable
CREATE TABLE "CreatorPhoneLogin" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "phoneLabel" TEXT NOT NULL,
    "phoneOwner" TEXT,
    "media" TEXT,
    "accountUsername" TEXT,
    "accountPassword" TEXT,
    "gmailAppleId" TEXT,
    "gmailApplePassword" TEXT,
    "gmailCreatedOnPhone" TEXT,
    "simPin" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPhoneLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorPhoneLogin_creatorId_idx" ON "CreatorPhoneLogin"("creatorId");

-- AddForeignKey
ALTER TABLE "CreatorPhoneLogin" ADD CONSTRAINT "CreatorPhoneLogin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
