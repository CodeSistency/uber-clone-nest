/*
  Warnings:

  - Added the required column `minimun_fare` to the `ride_tiers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ride_tiers" ADD COLUMN     "minimun_fare" DECIMAL(10,2) NOT NULL;
