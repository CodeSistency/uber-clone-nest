/*
  Warnings:

  - You are about to drop the column `car_image_url` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `car_model` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `car_seats` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `license_plate` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_type_id` on the `drivers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."drivers" DROP CONSTRAINT "drivers_vehicle_type_id_fkey";

-- DropIndex
DROP INDEX "public"."drivers_license_plate_key";

-- AlterTable
ALTER TABLE "public"."driver_reports" ADD COLUMN     "vehicle_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."drivers" DROP COLUMN "car_image_url",
DROP COLUMN "car_model",
DROP COLUMN "car_seats",
DROP COLUMN "license_plate",
DROP COLUMN "vehicle_type_id",
ADD COLUMN     "address" VARCHAR(255),
ADD COLUMN     "average_rating" DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN     "bank_account_number" VARCHAR(50),
ADD COLUMN     "bank_name" VARCHAR(100),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "gender" VARCHAR(20),
ADD COLUMN     "last_active" TIMESTAMP(3),
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "last_status_change" TIMESTAMP(3),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "postal_code" VARCHAR(20),
ADD COLUMN     "preferred_work_zones" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "status_changed_by" INTEGER,
ADD COLUMN     "suspension_end_date" TIMESTAMP(3),
ADD COLUMN     "suspension_reason" TEXT,
ADD COLUMN     "tax_id" VARCHAR(20),
ADD COLUMN     "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "total_rides" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "work_schedule" JSONB;

-- AlterTable
ALTER TABLE "public"."rides" ADD COLUMN     "vehicle_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "color" VARCHAR(30),
    "licensePlate" VARCHAR(20) NOT NULL,
    "vin" VARCHAR(17),
    "seatingCapacity" INTEGER NOT NULL DEFAULT 4,
    "has_ac" BOOLEAN NOT NULL DEFAULT true,
    "has_gps" BOOLEAN NOT NULL DEFAULT true,
    "fuelType" VARCHAR(20) NOT NULL DEFAULT 'gasoline',
    "insurance_provider" VARCHAR(100),
    "insurance_policy_number" VARCHAR(50),
    "insurance_expiry_date" TIMESTAMP(3),
    "front_image_url" TEXT,
    "side_image_url" TEXT,
    "back_image_url" TEXT,
    "interior_image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_documents" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMP(3),
    "verified_by" INTEGER,
    "rejection_reason" TEXT,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_change_history" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "changed_by" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_payment_methods" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "methodType" VARCHAR(20) NOT NULL,
    "account_number" VARCHAR(50),
    "account_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "routing_number" VARCHAR(20),
    "swift_code" VARCHAR(20),
    "wallet_address" VARCHAR(100),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_payments" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "paymentType" VARCHAR(20) NOT NULL,
    "referenceType" VARCHAR(20) NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "description" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "transaction_id" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "coordinates" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_work_zones" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "driver_work_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_verification_history" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "previous_status" VARCHAR(20),
    "new_status" VARCHAR(20) NOT NULL,
    "change_reason" TEXT NOT NULL,
    "additional_notes" TEXT,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_verification_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "public"."vehicles"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "public"."vehicles"("vin");

-- CreateIndex
CREATE INDEX "driver_payments_driver_id_created_at_idx" ON "public"."driver_payments"("driver_id", "created_at");

-- CreateIndex
CREATE INDEX "driver_payments_status_created_at_idx" ON "public"."driver_payments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "driver_work_zones_driver_id_zone_id_key" ON "public"."driver_work_zones"("driver_id", "zone_id");

-- CreateIndex
CREATE INDEX "driver_verification_history_driver_id_changed_at_idx" ON "public"."driver_verification_history"("driver_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "public"."drivers"("email");

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_change_history" ADD CONSTRAINT "vehicle_change_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_change_history" ADD CONSTRAINT "vehicle_change_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payment_methods" ADD CONSTRAINT "driver_payment_methods_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payments" ADD CONSTRAINT "driver_payments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payments" ADD CONSTRAINT "driver_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."driver_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_work_zones" ADD CONSTRAINT "driver_work_zones_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_work_zones" ADD CONSTRAINT "driver_work_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."work_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_verification_history" ADD CONSTRAINT "driver_verification_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
