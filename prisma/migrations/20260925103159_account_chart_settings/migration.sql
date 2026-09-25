-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "chartColor" TEXT,
ADD COLUMN     "showInChart" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
