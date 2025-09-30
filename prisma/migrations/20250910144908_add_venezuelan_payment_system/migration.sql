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
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_references_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "payment_references_referenceNumber_key" ON "public"."payment_references"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_references_referenceNumber_idx" ON "public"."payment_references"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_references_user_id_status_idx" ON "public"."payment_references"("user_id", "status");

-- CreateIndex
CREATE INDEX "payment_references_serviceType_service_id_idx" ON "public"."payment_references"("serviceType", "service_id");

-- CreateIndex
CREATE INDEX "payment_references_expires_at_idx" ON "public"."payment_references"("expires_at");

-- CreateIndex
CREATE INDEX "bank_transactions_payment_reference_id_idx" ON "public"."bank_transactions"("payment_reference_id");

-- CreateIndex
CREATE INDEX "bank_transactions_bankTransactionId_idx" ON "public"."bank_transactions"("bankTransactionId");

-- AddForeignKey
ALTER TABLE "public"."payment_references" ADD CONSTRAINT "payment_references_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_transactions" ADD CONSTRAINT "bank_transactions_payment_reference_id_fkey" FOREIGN KEY ("payment_reference_id") REFERENCES "public"."payment_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
