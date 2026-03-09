-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "freeShippingThreshold" DECIMAL(10,2),
    "freeShippingCurrency" TEXT DEFAULT 'EUR',
    "dpdPriceByCountry" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);
