-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "car_seats" INTEGER NOT NULL DEFAULT 4;

-- CreateIndex
CREATE INDEX "drivers_status_verification_status_idx" ON "public"."drivers"("status", "verification_status");

-- CreateIndex
CREATE INDEX "drivers_status_verification_status_can_do_deliveries_idx" ON "public"."drivers"("status", "verification_status", "can_do_deliveries");

-- CreateIndex
CREATE INDEX "drivers_status_last_location_update_idx" ON "public"."drivers"("status", "last_location_update");

-- CreateIndex
CREATE INDEX "drivers_is_location_active_last_location_update_idx" ON "public"."drivers"("is_location_active", "last_location_update");

-- CreateIndex
CREATE INDEX "drivers_average_rating_total_rides_idx" ON "public"."drivers"("average_rating", "total_rides");

-- CreateIndex
CREATE INDEX "tier_vehicle_types_tier_id_is_active_idx" ON "public"."tier_vehicle_types"("tier_id", "is_active");

-- CreateIndex
CREATE INDEX "tier_vehicle_types_vehicle_type_id_is_active_idx" ON "public"."tier_vehicle_types"("vehicle_type_id", "is_active");

-- CreateIndex
CREATE INDEX "vehicle_types_isActive_idx" ON "public"."vehicle_types"("isActive");

-- CreateIndex
CREATE INDEX "vehicles_driver_id_is_default_idx" ON "public"."vehicles"("driver_id", "is_default");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_id_status_idx" ON "public"."vehicles"("vehicle_type_id", "status");

-- CreateIndex
CREATE INDEX "vehicles_status_verification_status_idx" ON "public"."vehicles"("status", "verification_status");
