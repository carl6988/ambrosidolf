-- CreateTable
CREATE TABLE "CreatorManagementField" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "accountNames" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorManagementField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorManagementField_creatorId_key_key" ON "CreatorManagementField"("creatorId", "key");

-- AddForeignKey
ALTER TABLE "CreatorManagementField" ADD CONSTRAINT "CreatorManagementField_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
