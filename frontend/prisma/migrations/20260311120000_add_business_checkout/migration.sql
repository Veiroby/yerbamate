-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'WIRE_TRANSFER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
ALTER TABLE "Order" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Order" ADD COLUMN "companyAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "vatNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "phone" TEXT;
