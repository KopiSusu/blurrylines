/*
  Warnings:

  - You are about to drop the column `customer_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_id` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "subscriptions_subscription_id_customer_id_idx";

-- DropIndex
DROP INDEX "subscriptions_subscription_id_key";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "customer_id",
DROP COLUMN "subscription_id",
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_stripe_customer_id_idx" ON "subscriptions"("stripe_subscription_id", "stripe_customer_id");
