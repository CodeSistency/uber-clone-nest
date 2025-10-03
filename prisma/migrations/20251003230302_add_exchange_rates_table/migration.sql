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

-- CreateIndex
CREATE INDEX "exchange_rates_currency_created_at_idx" ON "public"."exchange_rates"("currency", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rates_source_created_at_idx" ON "public"."exchange_rates"("source", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rates_casa_created_at_idx" ON "public"."exchange_rates"("casa", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rates_fecha_actualizacion_idx" ON "public"."exchange_rates"("fecha_actualizacion");
