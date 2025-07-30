/*
  Warnings:

  - You are about to drop the `supplements` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "has_consultation" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "supplements";

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "form_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "price" DECIMAL(10,2) NOT NULL,
    "is_first" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "meeting_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultations_user_id_idx" ON "consultations"("user_id");

-- CreateIndex
CREATE INDEX "consultations_date_idx" ON "consultations"("date");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
