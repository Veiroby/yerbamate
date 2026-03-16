-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dpdDeliveredAt" TIMESTAMP(3),
ADD COLUMN     "dpdLastStatus" TEXT,
ADD COLUMN     "dpdLastStatusAt" TIMESTAMP(3),
ADD COLUMN     "dpdSentAt" TIMESTAMP(3);
