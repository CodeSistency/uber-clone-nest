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
    "zone_type" VARCHAR(20) NOT NULL DEFAULT 'regular',
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

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "public"."countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_2_key" ON "public"."countries"("iso_code_2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_3_key" ON "public"."countries"("iso_code_3");

-- CreateIndex
CREATE UNIQUE INDEX "countries_numeric_code_key" ON "public"."countries"("numeric_code");

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

-- AddForeignKey
ALTER TABLE "public"."states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_zones" ADD CONSTRAINT "service_zones_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
