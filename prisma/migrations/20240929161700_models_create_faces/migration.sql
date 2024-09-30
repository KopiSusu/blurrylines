-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "avatar_image_path" TEXT;

-- CreateTable
CREATE TABLE "faces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" TEXT,
    "original_url" TEXT NOT NULL,
    "original_image_path" TEXT NOT NULL,
    "face_url" TEXT,
    "face_image_path" TEXT,
    "width" BIGINT NOT NULL,
    "height" BIGINT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "preview_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_id" UUID NOT NULL,

    CONSTRAINT "faces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faces_task_id_key" ON "faces"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "faces_profile_id_key" ON "faces"("profile_id");

-- CreateIndex
CREATE INDEX "faces_task_id_idx" ON "faces"("task_id");

-- AddForeignKey
ALTER TABLE "faces" ADD CONSTRAINT "faces_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
