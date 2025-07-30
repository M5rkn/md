-- CreateTable
CREATE TABLE "consultation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultation_logs_user_id_idx" ON "consultation_logs"("user_id");

-- CreateIndex
CREATE INDEX "consultation_logs_phone_idx" ON "consultation_logs"("phone");

-- CreateIndex
CREATE INDEX "consultation_logs_created_at_idx" ON "consultation_logs"("created_at");

-- AddForeignKey
ALTER TABLE "consultation_logs" ADD CONSTRAINT "consultation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
