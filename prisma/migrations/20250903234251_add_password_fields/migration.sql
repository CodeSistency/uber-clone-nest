-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "password_hash" VARCHAR(255),
ALTER COLUMN "clerk_id" DROP NOT NULL;
