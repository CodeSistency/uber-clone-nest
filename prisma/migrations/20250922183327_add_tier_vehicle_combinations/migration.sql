-- AlterTable
ALTER TABLE "public"."chat_messages" ADD COLUMN     "errand_id" INTEGER,
ADD COLUMN     "parcel_id" INTEGER;

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

-- CreateIndex
CREATE UNIQUE INDEX "tier_vehicle_types_tier_id_vehicle_type_id_key" ON "public"."tier_vehicle_types"("tier_id", "vehicle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "public"."carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "public"."cart_items"("cart_id", "product_id");

-- AddForeignKey
ALTER TABLE "public"."tier_vehicle_types" ADD CONSTRAINT "tier_vehicle_types_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."ride_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tier_vehicle_types" ADD CONSTRAINT "tier_vehicle_types_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."errands" ADD CONSTRAINT "errands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."errands" ADD CONSTRAINT "errands_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
