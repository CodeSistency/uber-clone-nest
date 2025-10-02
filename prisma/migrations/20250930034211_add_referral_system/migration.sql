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

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_user_id_idx" ON "public"."referral_codes"("user_id");

-- CreateIndex
CREATE INDEX "referral_codes_is_active_idx" ON "public"."referral_codes"("is_active");

-- CreateIndex
CREATE INDEX "referral_codes_expires_at_idx" ON "public"."referral_codes"("expires_at");

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
CREATE INDEX "referral_transactions_type_idx" ON "public"."referral_transactions"("type");

-- CreateIndex
CREATE INDEX "referral_transactions_status_idx" ON "public"."referral_transactions"("status");

-- CreateIndex
CREATE INDEX "referral_transactions_created_at_idx" ON "public"."referral_transactions"("created_at");

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
