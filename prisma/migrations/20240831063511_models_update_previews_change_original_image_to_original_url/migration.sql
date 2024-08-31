/*
  Warnings:

  - You are about to drop the column `original_image` on the `previews` table. All the data in the column will be lost.
  - Added the required column `original_url` to the `previews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "previews" DROP COLUMN "original_image",
ADD COLUMN     "original_url" TEXT NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "trainings" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
