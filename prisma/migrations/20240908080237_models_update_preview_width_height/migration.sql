/*
  Warnings:

  - Added the required column `height` to the `previews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `previews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "previews" ADD COLUMN     "height" BIGINT NOT NULL,
ADD COLUMN     "width" BIGINT NOT NULL;
