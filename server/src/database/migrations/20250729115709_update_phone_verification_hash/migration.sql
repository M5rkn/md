/*
  Warnings:

  - You are about to drop the column `code` on the `phone_verifications` table. All the data in the column will be lost.
  - Added the required column `code_hash` to the `phone_verifications` table without a default value. This is not possible if the table is not empty.

*/

-- Очищаем старые записи верификации перед изменением схемы
DELETE FROM "phone_verifications";

-- AlterTable
ALTER TABLE "phone_verifications" DROP COLUMN "code",
ADD COLUMN     "code_hash" TEXT NOT NULL,
ADD COLUMN     "sms_id" TEXT;

-- CreateIndex
CREATE INDEX "phone_verifications_code_hash_idx" ON "phone_verifications"("code_hash");
