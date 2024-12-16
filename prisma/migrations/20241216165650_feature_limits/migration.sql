/*
  Warnings:

  - You are about to drop the `FeatureUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FeatureUsage" DROP CONSTRAINT "FeatureUsage_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "FeatureUsage" DROP CONSTRAINT "FeatureUsage_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "FeatureUsage" DROP CONSTRAINT "FeatureUsage_userId_fkey";

-- DropTable
DROP TABLE "FeatureUsage";

-- CreateTable
CREATE TABLE "feature_usage" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "currentUsage" DOUBLE PRECISION,
    "unit" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "resetFrequency" TEXT,

    CONSTRAINT "feature_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_limit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featureKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "feature_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_usage_subscriptionId_featureName_periodStart_period_key" ON "feature_usage"("subscriptionId", "featureName", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "feature_limit_subscriptionId_idx" ON "feature_limit"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_limit_subscriptionId_featureKey_key" ON "feature_limit"("subscriptionId", "featureKey");

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_limit" ADD CONSTRAINT "feature_limit_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
