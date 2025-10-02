/*
  Warnings:

  - You are about to drop the `referral_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referral_rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referral_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referrals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."referral_codes" DROP CONSTRAINT "referral_codes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."referral_transactions" DROP CONSTRAINT "referral_transactions_referral_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."referrals" DROP CONSTRAINT "referrals_referee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."referrals" DROP CONSTRAINT "referrals_referral_code_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."referrals" DROP CONSTRAINT "referrals_referrer_id_fkey";

-- DropIndex
DROP INDEX "public"."tier_vehicle_types_tier_id_is_active_idx";

-- DropIndex
DROP INDEX "public"."tier_vehicle_types_vehicle_type_id_is_active_idx";

-- AlterTable
ALTER TABLE "public"."drivers" ADD COLUMN     "vehicle_type_id" INTEGER;

-- DropTable
DROP TABLE "public"."referral_codes";

-- DropTable
DROP TABLE "public"."referral_rewards";

-- DropTable
DROP TABLE "public"."referral_transactions";

-- DropTable
DROP TABLE "public"."referrals";

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
