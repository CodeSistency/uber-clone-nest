-- AlterTable
ALTER TABLE "public"."rides" ADD COLUMN     "cancellation_notes" TEXT,
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" TEXT;

-- AlterTable
ALTER TABLE "public"."wallet_transactions" ADD COLUMN     "reference_id" TEXT,
ADD COLUMN     "reference_type" TEXT;

-- CreateTable
CREATE TABLE "public"."driver_reports" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "report_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "estimated_delay" INTEGER,
    "requires_cancellation" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "admin_notes" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "driver_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ride_cancellations" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER NOT NULL,
    "cancelled_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_processed" BOOLEAN NOT NULL DEFAULT false,
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "cancelled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_cancellations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_cancellations" ADD CONSTRAINT "ride_cancellations_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE CASCADE ON UPDATE CASCADE;
