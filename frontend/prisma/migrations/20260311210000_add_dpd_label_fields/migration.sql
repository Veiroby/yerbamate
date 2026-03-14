-- AlterTable
ALTER TABLE "Order" ADD COLUMN "dpdShipmentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "dpdTrackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "dpdLabelPdf" TEXT;
ALTER TABLE "Order" ADD COLUMN "dpdLabelCreatedAt" TIMESTAMP(3);
