/*
  Warnings:

  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "admin_created_at" TIMESTAMP(3),
ADD COLUMN     "admin_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "admin_role" VARCHAR(20),
ADD COLUMN     "admin_updated_at" TIMESTAMP(3),
ADD COLUMN     "last_admin_login" TIMESTAMP(3),
ADD COLUMN     "user_type" TEXT DEFAULT 'user';

-- DropTable
DROP TABLE "public"."admins";

-- AddForeignKey
ALTER TABLE "public"."admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
