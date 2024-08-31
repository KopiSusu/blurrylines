-- CreateEnum
CREATE TYPE "preview_status" AS ENUM ('PENDING', 'SUCCEED', 'FAILED');

-- CreateEnum
CREATE TYPE "task_statuses" AS ENUM ('UNKNOWN', 'QUEUING', 'TRAINING', 'SUCCESS', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "model_statuses" AS ENUM ('DEPLOYING', 'SERVING');

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "status" "task_statuses" NOT NULL,
    "model_name" TEXT,
    "model_status" "model_statuses",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" TEXT NOT NULL,
    "original_image" TEXT NOT NULL,
    "preview_url" TEXT,
    "prompt" TEXT NOT NULL,
    "status" "preview_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "profile_id" UUID NOT NULL,

    CONSTRAINT "previews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainings_task_id_key" ON "trainings"("task_id");

-- CreateIndex
CREATE INDEX "trainings_task_id_idx" ON "trainings"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "previews_task_id_key" ON "previews"("task_id");

-- CreateIndex
CREATE INDEX "previews_task_id_idx" ON "previews"("task_id");

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previews" ADD CONSTRAINT "previews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
