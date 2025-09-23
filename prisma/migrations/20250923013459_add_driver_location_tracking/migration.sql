-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "current_latitude" DECIMAL(9,6),
ADD COLUMN     "current_longitude" DECIMAL(9,6),
ADD COLUMN     "is_location_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_location_update" TIMESTAMP(3),
ADD COLUMN     "location_accuracy" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "public"."driver_location_history" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "accuracy" DECIMAL(5,2),
    "speed" DECIMAL(5,2),
    "heading" DECIMAL(5,2),
    "altitude" DECIMAL(7,2),
    "ride_id" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(20) NOT NULL DEFAULT 'gps',

    CONSTRAINT "driver_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_location_history_driver_id_timestamp_idx" ON "public"."driver_location_history"("driver_id", "timestamp");

-- CreateIndex
CREATE INDEX "driver_location_history_ride_id_idx" ON "public"."driver_location_history"("ride_id");

-- AddForeignKey
ALTER TABLE "public"."driver_location_history" ADD CONSTRAINT "driver_location_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_location_history" ADD CONSTRAINT "driver_location_history_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE SET NULL ON UPDATE CASCADE;
