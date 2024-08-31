/*
  Warnings:

  - You are about to drop the column `subscription_id` on the `profiles` table. All the data in the column will be lost.
  - The primary key for the `subscriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `stripe_customer_id` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_subscription_id_fkey";

-- DropIndex
DROP INDEX "profiles_subscription_id_idx";

-- DropIndex
DROP INDEX "profiles_subscription_id_key";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "subscription_id",
ADD COLUMN     "stripe_customer_id" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_pkey",
DROP COLUMN "id",
ALTER COLUMN "stripe_customer_id" SET NOT NULL,
ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripe_customer_id_key" ON "profiles"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "profiles_stripe_customer_id_idx" ON "profiles"("stripe_customer_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "subscriptions"("stripe_customer_id") ON DELETE SET NULL ON UPDATE CASCADE;
