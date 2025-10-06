-- CreateEnum
CREATE TYPE "public"."RideStatus" AS ENUM ('PENDING', 'DRIVER_CONFIRMED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DriverStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('TIME_RANGE', 'DAY_OF_WEEK', 'DATE_SPECIFIC', 'SEASONAL');

-- CreateEnum
CREATE TYPE "public"."ZoneType" AS ENUM ('REGULAR', 'PREMIUM', 'RESTRICTED');

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

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "color" VARCHAR(30),
    "licensePlate" VARCHAR(20) NOT NULL,
    "vin" VARCHAR(17),
    "seatingCapacity" INTEGER NOT NULL DEFAULT 4,
    "has_ac" BOOLEAN NOT NULL DEFAULT true,
    "has_gps" BOOLEAN NOT NULL DEFAULT true,
    "fuelType" VARCHAR(20) NOT NULL DEFAULT 'gasoline',
    "insurance_provider" VARCHAR(100),
    "insurance_policy_number" VARCHAR(50),
    "insurance_expiry_date" TIMESTAMP(3),
    "front_image_url" TEXT,
    "side_image_url" TEXT,
    "back_image_url" TEXT,
    "interior_image_url" TEXT,
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_documents" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "verified_by" INTEGER,
    "rejection_reason" TEXT,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_change_history" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "changed_by" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255),
    "refreshToken" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "deleted_reason" TEXT,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" VARCHAR(20),
    "date_of_birth" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "profile_image" TEXT,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "preferred_language" VARCHAR(10) DEFAULT 'es',
    "timezone" VARCHAR(50) DEFAULT 'America/Caracas',
    "currency" VARCHAR(10) DEFAULT 'USD',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "identity_verified" BOOLEAN NOT NULL DEFAULT false,
    "dni_number" VARCHAR(20),
    "identity_verified_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_role" VARCHAR(20),
    "admin_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_admin_login" TIMESTAMP(3),
    "admin_created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "admin_updated_at" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drivers" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "profile_image_url" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "status" "public"."DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "can_do_deliveries" BOOLEAN NOT NULL DEFAULT false,
    "car_seats" INTEGER NOT NULL DEFAULT 4,
    "current_latitude" DECIMAL(9,6),
    "current_longitude" DECIMAL(9,6),
    "last_location_update" TIMESTAMP(3),
    "location_accuracy" DECIMAL(5,2),
    "is_location_active" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_number" VARCHAR(50),
    "bank_name" VARCHAR(100),
    "tax_id" VARCHAR(20),
    "average_rating" DECIMAL(3,2) DEFAULT 0.00,
    "total_rides" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "suspension_reason" TEXT,
    "suspension_end_date" TIMESTAMP(3),
    "last_status_change" TIMESTAMP(3),
    "status_changed_by" INTEGER,
    "vehicle_type_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "last_active" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_schedules" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,

    CONSTRAINT "driver_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_work_zone_preferences" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "zoneId" TEXT NOT NULL,

    CONSTRAINT "driver_work_zone_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_documents" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."ride_tiers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "base_fare" DECIMAL(10,2) NOT NULL,
    "per_minute_rate" DECIMAL(10,2) NOT NULL,
    "per_km_rate" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "tierMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "surgeMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "demandMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "luxuryMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "comfortMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "minPassengers" INTEGER NOT NULL DEFAULT 1,
    "maxPassengers" INTEGER NOT NULL DEFAULT 4,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ride_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tier_vehicle_types" (
    "id" SERIAL NOT NULL,
    "tier_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."temporal_pricing_rules" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "rule_type" "public"."RuleType" NOT NULL DEFAULT 'TIME_RANGE',
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "days_of_week" JSONB,
    "specific_dates" JSONB,
    "date_ranges" JSONB,
    "multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "country_id" INTEGER,
    "state_id" INTEGER,
    "city_id" INTEGER,
    "zone_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_apply" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporal_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "category" VARCHAR(50) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_enable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flag_targetings" (
    "id" SERIAL NOT NULL,
    "feature_flag_id" INTEGER NOT NULL,
    "config" JSONB,
    "user_roles" JSONB,
    "user_ids" JSONB,
    "environments" JSONB,

    CONSTRAINT "feature_flag_targetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_configs" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "default_value" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_restart" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "service" VARCHAR(50) NOT NULL,
    "environment" VARCHAR(20) NOT NULL,
    "keyType" VARCHAR(30) NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyHash" VARCHAR(128),
    "description" VARCHAR(255),
    "expiresAt" TIMESTAMP(3),
    "lastRotated" TIMESTAMP(3),
    "rotationPolicy" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" VARCHAR(20) NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(100),
    "updatedBy" VARCHAR(100),
    "tags" JSONB,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_key_audits" (
    "id" SERIAL NOT NULL,
    "api_key_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "performedBy" VARCHAR(100),
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),

    CONSTRAINT "api_key_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integration_status" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR(50) NOT NULL,
    "environment" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER,
    "errorMessage" TEXT,
    "version" VARCHAR(50),
    "uptimePercentage" DECIMAL(5,2) DEFAULT 100.0,
    "errorRate" DECIMAL(5,2) DEFAULT 0.0,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertThreshold" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "integration_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rides" (
    "ride_id" SERIAL NOT NULL,
    "origin_address" VARCHAR(255) NOT NULL,
    "destination_address" VARCHAR(255) NOT NULL,
    "origin_latitude" DECIMAL(9,6) NOT NULL,
    "origin_longitude" DECIMAL(9,6) NOT NULL,
    "destination_latitude" DECIMAL(9,6) NOT NULL,
    "destination_longitude" DECIMAL(9,6) NOT NULL,
    "ride_time" INTEGER NOT NULL,
    "fare_price" DECIMAL(10,2) NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "public"."RideStatus" NOT NULL DEFAULT 'PENDING',
    "driver_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "tier_id" INTEGER,
    "vehicle_id" INTEGER,
    "requested_vehicle_type_id" INTEGER,
    "scheduled_for" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "cancellation_reason" TEXT,
    "cancellation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("ride_id")
);

-- CreateTable
CREATE TABLE "public"."stores" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "category" VARCHAR(50),
    "cuisine_type" VARCHAR(50),
    "logo_url" TEXT,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "category" VARCHAR(50),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_orders" (
    "order_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "courier_id" INTEGER,
    "delivery_address" VARCHAR(255) NOT NULL,
    "delivery_latitude" DECIMAL(9,6) NOT NULL,
    "delivery_longitude" DECIMAL(9,6) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "delivery_fee" DECIMAL(10,2) NOT NULL,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_delivery_time" TIMESTAMP(3),
    "actual_delivery_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_purchase" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotions" (
    "id" SERIAL NOT NULL,
    "promo_code" VARCHAR(50) NOT NULL,
    "discount_percentage" DECIMAL(5,2),
    "discount_amount" DECIMAL(10,2),
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP(3),
    "blocked_by" INTEGER,
    "block_reason" TEXT,
    "unblocked_at" TIMESTAMP(3),
    "unblocked_by" INTEGER,
    "unblock_reason" TEXT,
    "daily_limit_used" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "daily_limit_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transaction_type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "external_id" VARCHAR(100),
    "source" VARCHAR(50),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "processed_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ratings" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER,
    "order_id" INTEGER,
    "store_id" INTEGER,
    "rated_by_user_id" INTEGER NOT NULL,
    "rated_user_id" INTEGER,
    "rating_value" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergency_contacts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "contact_name" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER,
    "order_id" INTEGER,
    "errand_id" INTEGER,
    "parcel_id" INTEGER,
    "sender_id" INTEGER NOT NULL,
    "message_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ride_updates" BOOLEAN NOT NULL DEFAULT true,
    "driver_messages" BOOLEAN NOT NULL DEFAULT true,
    "promotional" BOOLEAN NOT NULL DEFAULT false,
    "emergency_alerts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."push_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "device_type" VARCHAR(20),
    "device_id" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "push_sent_at" TIMESTAMP(3),
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "sms_sent_at" TIMESTAMP(3),
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" VARCHAR(50),
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_references" (
    "id" SERIAL NOT NULL,
    "referenceNumber" VARCHAR(20) NOT NULL,
    "bankCode" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VES',
    "user_id" INTEGER NOT NULL,
    "serviceType" VARCHAR(20) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "paymentMethod" VARCHAR(20) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "group_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_groups" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "serviceType" VARCHAR(20) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "remaining_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'incomplete',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_transactions" (
    "id" SERIAL NOT NULL,
    "payment_reference_id" INTEGER NOT NULL,
    "bankTransactionId" VARCHAR(100) NOT NULL,
    "bank_response" JSONB NOT NULL,
    "confirmedAmount" DECIMAL(10,2) NOT NULL,
    "confirmation_timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."errands" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "description" VARCHAR(300) NOT NULL,
    "itemsList" TEXT,
    "pickupAddress" VARCHAR(255) NOT NULL,
    "pickupLat" DECIMAL(9,6) NOT NULL,
    "pickupLng" DECIMAL(9,6) NOT NULL,
    "dropoffAddress" VARCHAR(255) NOT NULL,
    "dropoffLat" DECIMAL(9,6) NOT NULL,
    "dropoffLng" DECIMAL(9,6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'requested',
    "itemsCost" DECIMAL(10,2),
    "serviceFee" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "shoppingNotes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "errands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcels" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "pickupAddress" VARCHAR(255) NOT NULL,
    "pickupLat" DECIMAL(9,6) NOT NULL,
    "pickupLng" DECIMAL(9,6) NOT NULL,
    "dropoffAddress" VARCHAR(255) NOT NULL,
    "dropoffLat" DECIMAL(9,6) NOT NULL,
    "dropoffLng" DECIMAL(9,6) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2),
    "dimensions" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'requested',
    "serviceFee" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "proof_of_pickup" TEXT,
    "proof_of_delivery" TEXT,
    "recipient_name" TEXT,
    "recipient_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_items" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" VARCHAR(255),

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_reports" (
    "id" SERIAL NOT NULL,
    "ride_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "report_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "estimated_delay" INTEGER,
    "requires_cancellation" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'reported',
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

-- CreateTable
CREATE TABLE "public"."driver_payment_methods" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "methodType" VARCHAR(20) NOT NULL,
    "account_number" VARCHAR(50),
    "account_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "routing_number" VARCHAR(20),
    "swift_code" VARCHAR(20),
    "wallet_address" VARCHAR(100),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_payments" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "paymentType" VARCHAR(20) NOT NULL,
    "referenceType" VARCHAR(20) NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "description" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "transaction_id" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "coordinates" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_work_zones" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "driver_work_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_verification_history" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "previous_status" VARCHAR(20),
    "new_status" VARCHAR(20) NOT NULL,
    "change_reason" TEXT NOT NULL,
    "additional_notes" TEXT,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_verification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "iso_code_2" VARCHAR(2) NOT NULL,
    "iso_code_3" VARCHAR(3),
    "numeric_code" INTEGER,
    "phone_code" VARCHAR(10),
    "currency_code" VARCHAR(3) NOT NULL,
    "currency_name" VARCHAR(50),
    "currency_symbol" VARCHAR(5),
    "timezone" VARCHAR(50) NOT NULL,
    "continent" VARCHAR(20) NOT NULL,
    "region" VARCHAR(50),
    "subregion" VARCHAR(50),
    "vat_rate" DECIMAL(5,2),
    "corporate_tax_rate" DECIMAL(5,2),
    "income_tax_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_verification" BOOLEAN NOT NULL DEFAULT false,
    "supported_languages" JSONB,
    "legal_requirements" JSONB,
    "business_hours" JSONB,
    "public_holidays" JSONB,
    "time_restrictions" JSONB,
    "regional_settings" JSONB,
    "pricing_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "flag" TEXT,
    "capital" VARCHAR(100),
    "population" BIGINT,
    "area_km2" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."states" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "country_id" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pricing_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "service_fee" DECIMAL(5,2),
    "state_business_hours" JSONB,
    "state_holidays" JSONB,
    "local_restrictions" JSONB,
    "state_settings" JSONB,
    "capital" VARCHAR(100),
    "population" BIGINT,
    "area_km2" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "state_id" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "timezone" VARCHAR(50),
    "boundaries" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pricing_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "service_fee" DECIMAL(5,2),
    "service_radius" INTEGER NOT NULL DEFAULT 50,
    "restricted_areas" JSONB,
    "premium_zones" JSONB,
    "city_business_hours" JSONB,
    "city_holidays" JSONB,
    "municipal_laws" JSONB,
    "city_settings" JSONB,
    "population" BIGINT,
    "area_km2" DECIMAL(10,2),
    "elevation" INTEGER,
    "postal_codes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "city_id" INTEGER NOT NULL,
    "zone_type" "public"."ZoneType" NOT NULL DEFAULT 'REGULAR',
    "boundaries" JSONB NOT NULL,
    "center_lat" DECIMAL(9,6) NOT NULL,
    "center_lng" DECIMAL(9,6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pricing_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "max_drivers" INTEGER,
    "min_drivers" INTEGER,
    "peak_hours" JSONB,
    "demand_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" SERIAL NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "referee_id" INTEGER NOT NULL,
    "referral_code_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "converted_at" TIMESTAMP(3),
    "reward_amount" DECIMAL(10,2),
    "reward_type" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_rewards" (
    "id" SERIAL NOT NULL,
    "tier" VARCHAR(20) NOT NULL,
    "min_referrals" INTEGER NOT NULL DEFAULT 0,
    "max_referrals" INTEGER,
    "rewardType" VARCHAR(30) NOT NULL,
    "reward_amount" DECIMAL(10,2) NOT NULL,
    "conditions" JSONB,
    "validity_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_transactions" (
    "id" SERIAL NOT NULL,
    "referral_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "transaction_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "referral_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_rates" (
    "id" TEXT NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "compra" DOUBLE PRECISION,
    "venta" DOUBLE PRECISION,
    "source" VARCHAR(100) NOT NULL,
    "casa" VARCHAR(50),
    "fecha_actualizacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" VARCHAR(100) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "request_id" VARCHAR(100),
    "reason" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletId" INTEGER,

    CONSTRAINT "wallet_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_rate_limits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "operation" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45),
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_until" TIMESTAMP(3),
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dniNumber" VARCHAR(20) NOT NULL,
    "front_photo_url" TEXT NOT NULL,
    "back_photo_url" TEXT NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "verified_by" INTEGER,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserToWalletAuditLog" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToWalletAuditLog_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "vehicle_types_isActive_idx" ON "public"."vehicle_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "public"."vehicles"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "public"."vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_driver_id_is_default_idx" ON "public"."vehicles"("driver_id", "is_default");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_id_status_idx" ON "public"."vehicles"("vehicle_type_id", "status");

-- CreateIndex
CREATE INDEX "vehicles_status_verification_status_idx" ON "public"."vehicles"("status", "verification_status");

-- CreateIndex
CREATE INDEX "vehicles_verification_status_idx" ON "public"."vehicles"("verification_status");

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicle_id_verification_status_idx" ON "public"."vehicle_documents"("vehicle_id", "verification_status");

-- CreateIndex
CREATE INDEX "vehicle_change_history_vehicle_id_changed_at_idx" ON "public"."vehicle_change_history"("vehicle_id", "changed_at");

-- CreateIndex
CREATE INDEX "vehicle_change_history_driver_id_changed_at_idx" ON "public"."vehicle_change_history"("driver_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "public"."users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "public"."admins"("user_id");

-- CreateIndex
CREATE INDEX "admins_user_id_idx" ON "public"."admins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "public"."drivers"("email");

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
CREATE INDEX "drivers_current_latitude_current_longitude_idx" ON "public"."drivers"("current_latitude", "current_longitude");

-- CreateIndex
CREATE INDEX "driver_schedules_driverId_dayOfWeek_idx" ON "public"."driver_schedules"("driverId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "driver_schedules_driverId_dayOfWeek_key" ON "public"."driver_schedules"("driverId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "driver_work_zone_preferences_driverId_idx" ON "public"."driver_work_zone_preferences"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_work_zone_preferences_driverId_zoneId_key" ON "public"."driver_work_zone_preferences"("driverId", "zoneId");

-- CreateIndex
CREATE INDEX "driver_documents_driver_id_verification_status_idx" ON "public"."driver_documents"("driver_id", "verification_status");

-- CreateIndex
CREATE INDEX "driver_location_history_driver_id_timestamp_idx" ON "public"."driver_location_history"("driver_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "driver_location_history_ride_id_idx" ON "public"."driver_location_history"("ride_id");

-- CreateIndex
CREATE INDEX "ride_tiers_is_active_priority_idx" ON "public"."ride_tiers"("is_active", "priority");

-- CreateIndex
CREATE INDEX "tier_vehicle_types_tier_id_vehicle_type_id_is_active_idx" ON "public"."tier_vehicle_types"("tier_id", "vehicle_type_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tier_vehicle_types_tier_id_vehicle_type_id_key" ON "public"."tier_vehicle_types"("tier_id", "vehicle_type_id");

-- CreateIndex
CREATE INDEX "temporal_pricing_rules_rule_type_is_active_idx" ON "public"."temporal_pricing_rules"("rule_type", "is_active");

-- CreateIndex
CREATE INDEX "temporal_pricing_rules_country_id_state_id_city_id_zone_id_idx" ON "public"."temporal_pricing_rules"("country_id", "state_id", "city_id", "zone_id");

-- CreateIndex
CREATE INDEX "temporal_pricing_rules_priority_idx" ON "public"."temporal_pricing_rules"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "public"."feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_is_active_idx" ON "public"."feature_flags"("key", "is_active");

-- CreateIndex
CREATE INDEX "feature_flags_category_is_enabled_idx" ON "public"."feature_flags"("category", "is_enabled");

-- CreateIndex
CREATE INDEX "feature_flags_is_enabled_rollout_percentage_idx" ON "public"."feature_flags"("is_enabled", "rollout_percentage");

-- CreateIndex
CREATE INDEX "feature_flag_targetings_feature_flag_id_idx" ON "public"."feature_flag_targetings"("feature_flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "public"."system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_is_active_idx" ON "public"."system_configs"("category", "is_active");

-- CreateIndex
CREATE INDEX "system_configs_key_is_active_idx" ON "public"."system_configs"("key", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_key_key" ON "public"."notification_templates"("key");

-- CreateIndex
CREATE INDEX "notification_templates_type_category_is_active_idx" ON "public"."notification_templates"("type", "category", "is_active");

-- CreateIndex
CREATE INDEX "notification_templates_key_is_active_idx" ON "public"."notification_templates"("key", "is_active");

-- CreateIndex
CREATE INDEX "api_keys_service_environment_isActive_idx" ON "public"."api_keys"("service", "environment", "isActive");

-- CreateIndex
CREATE INDEX "api_keys_service_isPrimary_idx" ON "public"."api_keys"("service", "isPrimary");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "public"."api_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "api_keys_lastUsed_idx" ON "public"."api_keys"("lastUsed");

-- CreateIndex
CREATE INDEX "api_keys_tags_idx" ON "public"."api_keys"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_service_environment_keyType_isPrimary_key" ON "public"."api_keys"("service", "environment", "keyType", "isPrimary");

-- CreateIndex
CREATE INDEX "api_key_audits_api_key_id_performedAt_idx" ON "public"."api_key_audits"("api_key_id", "performedAt" DESC);

-- CreateIndex
CREATE INDEX "api_key_audits_action_performedAt_idx" ON "public"."api_key_audits"("action", "performedAt");

-- CreateIndex
CREATE INDEX "integration_status_status_lastChecked_idx" ON "public"."integration_status"("status", "lastChecked" DESC);

-- CreateIndex
CREATE INDEX "integration_status_alertEnabled_lastChecked_idx" ON "public"."integration_status"("alertEnabled", "lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "integration_status_service_environment_key" ON "public"."integration_status"("service", "environment");

-- CreateIndex
CREATE INDEX "rides_user_id_status_created_at_idx" ON "public"."rides"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rides_driver_id_status_idx" ON "public"."rides"("driver_id", "status");

-- CreateIndex
CREATE INDEX "rides_origin_latitude_origin_longitude_idx" ON "public"."rides"("origin_latitude", "origin_longitude");

-- CreateIndex
CREATE INDEX "stores_owner_id_is_open_idx" ON "public"."stores"("owner_id", "is_open");

-- CreateIndex
CREATE INDEX "stores_latitude_longitude_idx" ON "public"."stores"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "products_store_id_is_available_price_idx" ON "public"."products"("store_id", "is_available", "price");

-- CreateIndex
CREATE INDEX "delivery_orders_user_id_status_idx" ON "public"."delivery_orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "delivery_orders_store_id_payment_status_idx" ON "public"."delivery_orders"("store_id", "payment_status");

-- CreateIndex
CREATE INDEX "delivery_orders_delivery_latitude_delivery_longitude_idx" ON "public"."delivery_orders"("delivery_latitude", "delivery_longitude");

-- CreateIndex
CREATE INDEX "order_items_order_id_product_id_idx" ON "public"."order_items"("order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_promo_code_key" ON "public"."promotions"("promo_code");

-- CreateIndex
CREATE INDEX "promotions_promo_code_is_active_idx" ON "public"."promotions"("promo_code", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "public"."wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_is_blocked_idx" ON "public"."wallets"("is_blocked");

-- CreateIndex
CREATE INDEX "wallets_daily_limit_reset_at_idx" ON "public"."wallets"("daily_limit_reset_at");

-- CreateIndex
CREATE INDEX "wallets_user_id_is_blocked_idx" ON "public"."wallets"("user_id", "is_blocked");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "public"."wallet_transactions"("wallet_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_transactions_transaction_type_status_idx" ON "public"."wallet_transactions"("transaction_type", "status");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "public"."wallet_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "public"."wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "public"."wallet_transactions"("status");

-- CreateIndex
CREATE INDEX "ratings_rated_by_user_id_created_at_idx" ON "public"."ratings"("rated_by_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ratings_rated_user_id_rating_value_idx" ON "public"."ratings"("rated_user_id", "rating_value");

-- CreateIndex
CREATE INDEX "emergency_contacts_user_id_idx" ON "public"."emergency_contacts"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_created_at_idx" ON "public"."chat_messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "public"."notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "public"."notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "public"."push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_is_active_idx" ON "public"."push_tokens"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "push_tokens_token_idx" ON "public"."push_tokens"("token");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "public"."notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_type_created_at_idx" ON "public"."notifications"("type", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_id_timestamp_idx" ON "public"."admin_audit_logs"("admin_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_references_referenceNumber_key" ON "public"."payment_references"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_references_referenceNumber_idx" ON "public"."payment_references"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_references_user_id_status_idx" ON "public"."payment_references"("user_id", "status");

-- CreateIndex
CREATE INDEX "payment_references_serviceType_service_id_idx" ON "public"."payment_references"("serviceType", "service_id");

-- CreateIndex
CREATE INDEX "payment_references_serviceType_service_id_is_partial_idx" ON "public"."payment_references"("serviceType", "service_id", "is_partial");

-- CreateIndex
CREATE INDEX "payment_references_group_id_idx" ON "public"."payment_references"("group_id");

-- CreateIndex
CREATE INDEX "payment_references_expires_at_idx" ON "public"."payment_references"("expires_at" DESC);

-- CreateIndex
CREATE INDEX "payment_groups_user_id_idx" ON "public"."payment_groups"("user_id");

-- CreateIndex
CREATE INDEX "payment_groups_serviceType_service_id_idx" ON "public"."payment_groups"("serviceType", "service_id");

-- CreateIndex
CREATE INDEX "payment_groups_status_idx" ON "public"."payment_groups"("status");

-- CreateIndex
CREATE INDEX "payment_groups_expires_at_idx" ON "public"."payment_groups"("expires_at" DESC);

-- CreateIndex
CREATE INDEX "bank_transactions_payment_reference_id_idx" ON "public"."bank_transactions"("payment_reference_id");

-- CreateIndex
CREATE INDEX "bank_transactions_bankTransactionId_idx" ON "public"."bank_transactions"("bankTransactionId");

-- CreateIndex
CREATE INDEX "errands_user_id_status_idx" ON "public"."errands"("user_id", "status");

-- CreateIndex
CREATE INDEX "errands_pickupLat_pickupLng_idx" ON "public"."errands"("pickupLat", "pickupLng");

-- CreateIndex
CREATE INDEX "parcels_user_id_status_idx" ON "public"."parcels"("user_id", "status");

-- CreateIndex
CREATE INDEX "parcels_pickupLat_pickupLng_idx" ON "public"."parcels"("pickupLat", "pickupLng");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "public"."carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "public"."carts"("user_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "public"."cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "public"."cart_items"("cart_id", "product_id");

-- CreateIndex
CREATE INDEX "driver_reports_ride_id_reported_at_idx" ON "public"."driver_reports"("ride_id", "reported_at" DESC);

-- CreateIndex
CREATE INDEX "driver_reports_driver_id_status_idx" ON "public"."driver_reports"("driver_id", "status");

-- CreateIndex
CREATE INDEX "ride_cancellations_ride_id_cancelled_at_idx" ON "public"."ride_cancellations"("ride_id", "cancelled_at");

-- CreateIndex
CREATE INDEX "driver_payment_methods_driver_id_is_active_idx" ON "public"."driver_payment_methods"("driver_id", "is_active");

-- CreateIndex
CREATE INDEX "driver_payments_driver_id_created_at_idx" ON "public"."driver_payments"("driver_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "driver_payments_status_created_at_idx" ON "public"."driver_payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "work_zones_is_active_idx" ON "public"."work_zones"("is_active");

-- CreateIndex
CREATE INDEX "driver_work_zones_driver_id_status_idx" ON "public"."driver_work_zones"("driver_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "driver_work_zones_driver_id_zone_id_key" ON "public"."driver_work_zones"("driver_id", "zone_id");

-- CreateIndex
CREATE INDEX "driver_verification_history_driver_id_changed_at_idx" ON "public"."driver_verification_history"("driver_id", "changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "public"."countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_2_key" ON "public"."countries"("iso_code_2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_3_key" ON "public"."countries"("iso_code_3");

-- CreateIndex
CREATE UNIQUE INDEX "countries_numeric_code_key" ON "public"."countries"("numeric_code");

-- CreateIndex
CREATE INDEX "countries_is_active_idx" ON "public"."countries"("is_active");

-- CreateIndex
CREATE INDEX "states_country_id_is_active_idx" ON "public"."states"("country_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "states_country_id_code_key" ON "public"."states"("country_id", "code");

-- CreateIndex
CREATE INDEX "cities_state_id_is_active_idx" ON "public"."cities"("state_id", "is_active");

-- CreateIndex
CREATE INDEX "cities_latitude_longitude_idx" ON "public"."cities"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "cities_state_id_name_key" ON "public"."cities"("state_id", "name");

-- CreateIndex
CREATE INDEX "service_zones_city_id_is_active_idx" ON "public"."service_zones"("city_id", "is_active");

-- CreateIndex
CREATE INDEX "service_zones_zone_type_idx" ON "public"."service_zones"("zone_type");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_user_id_idx" ON "public"."referral_codes"("user_id");

-- CreateIndex
CREATE INDEX "referral_codes_is_active_idx" ON "public"."referral_codes"("is_active");

-- CreateIndex
CREATE INDEX "referral_codes_expires_at_idx" ON "public"."referral_codes"("expires_at" DESC);

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "public"."referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "referrals_referee_id_idx" ON "public"."referrals"("referee_id");

-- CreateIndex
CREATE INDEX "referrals_referral_code_id_idx" ON "public"."referrals"("referral_code_id");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "public"."referrals"("status");

-- CreateIndex
CREATE INDEX "referrals_converted_at_idx" ON "public"."referrals"("converted_at");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referrer_id_referee_id_key" ON "public"."referrals"("referrer_id", "referee_id");

-- CreateIndex
CREATE INDEX "referral_rewards_tier_idx" ON "public"."referral_rewards"("tier");

-- CreateIndex
CREATE INDEX "referral_rewards_is_active_idx" ON "public"."referral_rewards"("is_active");

-- CreateIndex
CREATE INDEX "referral_rewards_min_referrals_max_referrals_idx" ON "public"."referral_rewards"("min_referrals", "max_referrals");

-- CreateIndex
CREATE INDEX "referral_transactions_referral_id_idx" ON "public"."referral_transactions"("referral_id");

-- CreateIndex
CREATE INDEX "referral_transactions_user_id_idx" ON "public"."referral_transactions"("user_id");

-- CreateIndex
CREATE INDEX "referral_transactions_status_idx" ON "public"."referral_transactions"("status");

-- CreateIndex
CREATE INDEX "referral_transactions_created_at_idx" ON "public"."referral_transactions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "exchange_rates_currency_created_at_idx" ON "public"."exchange_rates"("currency", "created_at" DESC);

-- CreateIndex
CREATE INDEX "exchange_rates_source_created_at_idx" ON "public"."exchange_rates"("source", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rates_casa_created_at_idx" ON "public"."exchange_rates"("casa", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rates_fecha_actualizacion_idx" ON "public"."exchange_rates"("fecha_actualizacion" DESC);

-- CreateIndex
CREATE INDEX "wallet_audit_logs_admin_id_timestamp_idx" ON "public"."wallet_audit_logs"("admin_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "wallet_audit_logs_action_resource_idx" ON "public"."wallet_audit_logs"("action", "resource");

-- CreateIndex
CREATE INDEX "wallet_audit_logs_resource_id_idx" ON "public"."wallet_audit_logs"("resource_id");

-- CreateIndex
CREATE INDEX "wallet_audit_logs_timestamp_idx" ON "public"."wallet_audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "wallet_audit_logs_ip_address_idx" ON "public"."wallet_audit_logs"("ip_address");

-- CreateIndex
CREATE INDEX "wallet_rate_limits_user_id_operation_attempted_at_idx" ON "public"."wallet_rate_limits"("user_id", "operation", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_rate_limits_operation_attempted_at_idx" ON "public"."wallet_rate_limits"("operation", "attempted_at");

-- CreateIndex
CREATE INDEX "wallet_rate_limits_is_blocked_blocked_until_idx" ON "public"."wallet_rate_limits"("is_blocked", "blocked_until");

-- CreateIndex
CREATE INDEX "wallet_rate_limits_ip_address_attempted_at_idx" ON "public"."wallet_rate_limits"("ip_address", "attempted_at");

-- CreateIndex
CREATE INDEX "verification_codes_user_id_type_idx" ON "public"."verification_codes"("user_id", "type");

-- CreateIndex
CREATE INDEX "verification_codes_code_type_idx" ON "public"."verification_codes"("code", "type");

-- CreateIndex
CREATE INDEX "verification_codes_expires_at_idx" ON "public"."verification_codes"("expires_at" DESC);

-- CreateIndex
CREATE INDEX "identity_verifications_dniNumber_idx" ON "public"."identity_verifications"("dniNumber");

-- CreateIndex
CREATE INDEX "identity_verifications_status_idx" ON "public"."identity_verifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_user_id_key" ON "public"."identity_verifications"("user_id");

-- CreateIndex
CREATE INDEX "_UserToWalletAuditLog_B_index" ON "public"."_UserToWalletAuditLog"("B");

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_change_history" ADD CONSTRAINT "vehicle_change_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_change_history" ADD CONSTRAINT "vehicle_change_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_schedules" ADD CONSTRAINT "driver_schedules_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_work_zone_preferences" ADD CONSTRAINT "driver_work_zone_preferences_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_location_history" ADD CONSTRAINT "driver_location_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_location_history" ADD CONSTRAINT "driver_location_history_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tier_vehicle_types" ADD CONSTRAINT "tier_vehicle_types_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."ride_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tier_vehicle_types" ADD CONSTRAINT "tier_vehicle_types_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feature_flag_targetings" ADD CONSTRAINT "feature_flag_targetings_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_key_audits" ADD CONSTRAINT "api_key_audits_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."ride_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_requested_vehicle_type_id_fkey" FOREIGN KEY ("requested_vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."delivery_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."delivery_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_rated_by_user_id_fkey" FOREIGN KEY ("rated_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."delivery_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_references" ADD CONSTRAINT "payment_references_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_references" ADD CONSTRAINT "payment_references_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."payment_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_groups" ADD CONSTRAINT "payment_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_transactions" ADD CONSTRAINT "bank_transactions_payment_reference_id_fkey" FOREIGN KEY ("payment_reference_id") REFERENCES "public"."payment_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."errands" ADD CONSTRAINT "errands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."errands" ADD CONSTRAINT "errands_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_reports" ADD CONSTRAINT "driver_reports_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_cancellations" ADD CONSTRAINT "ride_cancellations_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("ride_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payment_methods" ADD CONSTRAINT "driver_payment_methods_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payments" ADD CONSTRAINT "driver_payments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_payments" ADD CONSTRAINT "driver_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."driver_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_work_zones" ADD CONSTRAINT "driver_work_zones_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_work_zones" ADD CONSTRAINT "driver_work_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."work_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_verification_history" ADD CONSTRAINT "driver_verification_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_zones" ADD CONSTRAINT "service_zones_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_transactions" ADD CONSTRAINT "referral_transactions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_transactions" ADD CONSTRAINT "referral_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_audit_logs" ADD CONSTRAINT "wallet_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_audit_logs" ADD CONSTRAINT "wallet_audit_logs_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_rate_limits" ADD CONSTRAINT "wallet_rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserToWalletAuditLog" ADD CONSTRAINT "_UserToWalletAuditLog_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserToWalletAuditLog" ADD CONSTRAINT "_UserToWalletAuditLog_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."wallet_audit_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
