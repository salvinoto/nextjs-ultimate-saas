/*
  Warnings:

  - You are about to drop the `benefit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "benefit" DROP CONSTRAINT "benefit_productId_fkey";

-- DropForeignKey
ALTER TABLE "price" DROP CONSTRAINT "price_productId_fkey";

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "customerId" TEXT;

-- DropTable
DROP TABLE "benefit";

-- DropTable
DROP TABLE "price";

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "polarCustomerId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_polarCustomerId_key" ON "customer"("polarCustomerId");

-- CreateIndex
CREATE INDEX "customer_userId_idx" ON "customer"("userId");

-- CreateIndex
CREATE INDEX "customer_organizationId_idx" ON "customer"("organizationId");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
