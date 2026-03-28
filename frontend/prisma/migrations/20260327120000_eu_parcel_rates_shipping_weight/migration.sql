-- AlterTable
ALTER TABLE "Product" ADD COLUMN "shippingWeightKg" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ShippingSettings" ADD COLUMN "euRegisteredParcelRates" JSONB;
