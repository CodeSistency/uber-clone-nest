-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "vehicle_type_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."rides" ADD COLUMN     "requested_vehicle_type_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."vehicle_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(50) NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_requested_vehicle_type_id_fkey" FOREIGN KEY ("requested_vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
