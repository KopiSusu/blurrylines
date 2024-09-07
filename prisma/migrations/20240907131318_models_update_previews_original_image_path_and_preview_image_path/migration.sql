/*
  Warnings:

  - Added the required column `original_image_path` to the `previews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "previews" ADD COLUMN     "original_image_path" TEXT NOT NULL,
ADD COLUMN     "preview_image_path" TEXT;
