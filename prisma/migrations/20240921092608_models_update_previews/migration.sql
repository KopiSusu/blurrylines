/*
  Warnings:

  - You are about to drop the `trainings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[removal_task_id]` on the table `previews` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "preview_status" ADD VALUE 'REMOVING';

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_profile_id_fkey";

-- DropIndex
DROP INDEX "previews_task_id_idx";

-- AlterTable
ALTER TABLE "previews" ADD COLUMN     "removal_task_id" TEXT;

-- DropTable
DROP TABLE "trainings";

-- CreateIndex
CREATE UNIQUE INDEX "previews_removal_task_id_key" ON "previews"("removal_task_id");

-- CreateIndex
CREATE INDEX "previews_task_id_removal_task_id_idx" ON "previews"("task_id", "removal_task_id");
