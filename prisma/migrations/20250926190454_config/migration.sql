-- AlterTable
ALTER TABLE "public"."cities" ADD COLUMN     "city_business_hours" JSONB,
ADD COLUMN     "city_holidays" JSONB,
ADD COLUMN     "city_settings" JSONB,
ADD COLUMN     "municipal_laws" JSONB;

-- AlterTable
ALTER TABLE "public"."countries" ADD COLUMN     "business_hours" JSONB,
ADD COLUMN     "pricing_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "public_holidays" JSONB,
ADD COLUMN     "regional_settings" JSONB,
ADD COLUMN     "time_restrictions" JSONB;

-- AlterTable
ALTER TABLE "public"."ride_tiers" ADD COLUMN     "comfortMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "demandMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "luxuryMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "maxPassengers" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "minPassengers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "surgeMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "tierMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "public"."states" ADD COLUMN     "local_restrictions" JSONB,
ADD COLUMN     "state_business_hours" JSONB,
ADD COLUMN     "state_holidays" JSONB,
ADD COLUMN     "state_settings" JSONB;

-- CreateTable
CREATE TABLE "public"."temporal_pricing_rules" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "rule_type" VARCHAR(20) NOT NULL DEFAULT 'time_range',
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
    "config" JSONB,
    "rollout_percentage" INTEGER DEFAULT 100,
    "user_roles" JSONB,
    "user_ids" JSONB,
    "environments" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_enable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_by" VARCHAR(100),

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
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
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
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
CREATE UNIQUE INDEX "api_keys_service_environment_keyType_isPrimary_key" ON "public"."api_keys"("service", "environment", "keyType", "isPrimary");

-- CreateIndex
CREATE INDEX "api_key_audits_api_key_id_performedAt_idx" ON "public"."api_key_audits"("api_key_id", "performedAt");

-- CreateIndex
CREATE INDEX "api_key_audits_action_performedAt_idx" ON "public"."api_key_audits"("action", "performedAt");

-- CreateIndex
CREATE INDEX "integration_status_status_lastChecked_idx" ON "public"."integration_status"("status", "lastChecked");

-- CreateIndex
CREATE INDEX "integration_status_alertEnabled_lastChecked_idx" ON "public"."integration_status"("alertEnabled", "lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "integration_status_service_environment_key" ON "public"."integration_status"("service", "environment");

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."temporal_pricing_rules" ADD CONSTRAINT "temporal_pricing_rules_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_key_audits" ADD CONSTRAINT "api_key_audits_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
