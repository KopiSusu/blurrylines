/*
  Warnings:

  - A unique constraint covering the columns `[subscription_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "subscription_id" UUID;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT,
    "email" TEXT,
    "end_at" TIMESTAMP(3),
    "subscription_id" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_id_key" ON "subscriptions"("subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_subscription_id_customer_id_idx" ON "subscriptions"("subscription_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_subscription_id_key" ON "profiles"("subscription_id");

-- CreateIndex
CREATE INDEX "profiles_subscription_id_idx" ON "profiles"("subscription_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
