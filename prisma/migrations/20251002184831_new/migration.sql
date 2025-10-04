-- DropIndex
DROP INDEX IF EXISTS "public"."referral_transactions_type_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."tier_vehicle_types_tier_id_is_active_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."tier_vehicle_types_vehicle_type_id_is_active_idx";

-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "vehicle_type_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_transactions" ADD CONSTRAINT "referral_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
