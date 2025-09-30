/*
  Warnings:

  - Added the required column `paymentMethod` to the `payment_references` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."payment_references" ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "is_partial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" VARCHAR(20) NOT NULL;

-- CreateTable
CREATE TABLE "public"."payment_groups" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "serviceType" VARCHAR(20) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "remaining_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'incomplete',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_groups_user_id_idx" ON "public"."payment_groups"("user_id");

-- CreateIndex
CREATE INDEX "payment_groups_serviceType_service_id_idx" ON "public"."payment_groups"("serviceType", "service_id");

-- CreateIndex
CREATE INDEX "payment_groups_status_idx" ON "public"."payment_groups"("status");

-- CreateIndex
CREATE INDEX "payment_groups_expires_at_idx" ON "public"."payment_groups"("expires_at");

-- CreateIndex
CREATE INDEX "payment_references_serviceType_service_id_is_partial_idx" ON "public"."payment_references"("serviceType", "service_id", "is_partial");

-- CreateIndex
CREATE INDEX "payment_references_group_id_idx" ON "public"."payment_references"("group_id");

-- AddForeignKey
ALTER TABLE "public"."payment_references" ADD CONSTRAINT "payment_references_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."payment_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_groups" ADD CONSTRAINT "payment_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
