/*
  Migration: Remove Clerk integration and add profile fields
  This migration handles existing data by mapping clerk_ids to user_ids
*/

-- Add new columns as nullable first
ALTER TABLE "public"."chat_messages" ADD COLUMN "sender_id" INTEGER;
ALTER TABLE "public"."delivery_orders" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "public"."emergency_contacts" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "public"."notification_preferences" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "public"."notifications" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "public"."push_tokens" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "public"."ratings" ADD COLUMN "rated_by_user_id" INTEGER;
ALTER TABLE "public"."ratings" ADD COLUMN "rated_user_id" INTEGER;
ALTER TABLE "public"."stores" ADD COLUMN "owner_id" INTEGER;
ALTER TABLE "public"."wallets" ADD COLUMN "user_id" INTEGER;

-- Map existing clerk_ids to user_ids
UPDATE "public"."chat_messages" SET "sender_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."chat_messages"."sender_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."delivery_orders" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."delivery_orders"."user_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."emergency_contacts" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."emergency_contacts"."user_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."notification_preferences" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."notification_preferences"."user_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."notifications" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."notifications"."user_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."push_tokens" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."push_tokens"."user_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."ratings" SET "rated_by_user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."ratings"."rated_by_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."ratings" SET "rated_user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."ratings"."rated_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."stores" SET "owner_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."stores"."owner_clerk_id" = "public"."users"."clerk_id";

UPDATE "public"."wallets" SET "user_id" = "public"."users"."id"
FROM "public"."users" WHERE "public"."wallets"."user_clerk_id" = "public"."users"."clerk_id";

-- Drop all foreign key constraints
ALTER TABLE "public"."chat_messages" DROP CONSTRAINT "chat_messages_sender_clerk_id_fkey";
ALTER TABLE "public"."delivery_orders" DROP CONSTRAINT "delivery_orders_user_clerk_id_fkey";
ALTER TABLE "public"."emergency_contacts" DROP CONSTRAINT "emergency_contacts_user_clerk_id_fkey";
ALTER TABLE "public"."notification_preferences" DROP CONSTRAINT "notification_preferences_user_clerk_id_fkey";
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_user_clerk_id_fkey";
ALTER TABLE "public"."push_tokens" DROP CONSTRAINT "push_tokens_user_clerk_id_fkey";
ALTER TABLE "public"."ratings" DROP CONSTRAINT "ratings_rated_by_clerk_id_fkey";
ALTER TABLE "public"."ratings" DROP CONSTRAINT "ratings_rated_clerk_id_fkey";
ALTER TABLE "public"."wallets" DROP CONSTRAINT "wallets_user_clerk_id_fkey";

-- Drop indexes
DROP INDEX "public"."notification_preferences_user_clerk_id_key";
DROP INDEX "public"."notifications_user_clerk_id_created_at_idx";
DROP INDEX "public"."push_tokens_user_clerk_id_is_active_idx";
DROP INDEX "public"."users_clerk_id_key";
DROP INDEX "public"."wallets_user_clerk_id_key";

-- Make columns NOT NULL after populating data
ALTER TABLE "public"."chat_messages" ALTER COLUMN "sender_id" SET NOT NULL;
ALTER TABLE "public"."delivery_orders" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."emergency_contacts" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."notification_preferences" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."notifications" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."push_tokens" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."ratings" ALTER COLUMN "rated_by_user_id" SET NOT NULL;
ALTER TABLE "public"."wallets" ALTER COLUMN "user_id" SET NOT NULL;

-- Drop old columns and add new profile columns
ALTER TABLE "public"."chat_messages" DROP COLUMN "sender_clerk_id";
ALTER TABLE "public"."delivery_orders" DROP COLUMN "user_clerk_id";
ALTER TABLE "public"."emergency_contacts" DROP COLUMN "user_clerk_id";
ALTER TABLE "public"."notification_preferences" DROP COLUMN "user_clerk_id";
ALTER TABLE "public"."notifications" DROP COLUMN "user_clerk_id";
ALTER TABLE "public"."push_tokens" DROP COLUMN "user_clerk_id";
ALTER TABLE "public"."ratings" DROP COLUMN "rated_by_clerk_id", DROP COLUMN "rated_clerk_id";
ALTER TABLE "public"."stores" DROP COLUMN "owner_clerk_id";
ALTER TABLE "public"."wallets" DROP COLUMN "user_clerk_id";

-- Add profile fields to users table and drop clerk_id
ALTER TABLE "public"."users" DROP COLUMN "clerk_id",
ADD COLUMN "phone" VARCHAR(20),
ADD COLUMN "date_of_birth" TIMESTAMP(3),
ADD COLUMN "gender" VARCHAR(20),
ADD COLUMN "profile_image" TEXT,
ADD COLUMN "address" VARCHAR(255),
ADD COLUMN "city" VARCHAR(100),
ADD COLUMN "state" VARCHAR(100),
ADD COLUMN "country" VARCHAR(100),
ADD COLUMN "postal_code" VARCHAR(20),
ADD COLUMN "preferred_language" VARCHAR(10) DEFAULT 'es',
ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Caracas',
ADD COLUMN "currency" VARCHAR(10) DEFAULT 'USD',
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "identity_verified" BOOLEAN NOT NULL DEFAULT false;

-- Create new indexes
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "public"."notification_preferences"("user_id");
CREATE INDEX "notifications_user_id_created_at_idx" ON "public"."notifications"("user_id", "created_at");
CREATE INDEX "push_tokens_user_id_is_active_idx" ON "public"."push_tokens"("user_id", "is_active");
CREATE UNIQUE INDEX "wallets_user_id_key" ON "public"."wallets"("user_id");

-- Add new foreign key constraints
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_rated_by_user_id_fkey" FOREIGN KEY ("rated_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
