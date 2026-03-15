-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MAKSEKESKUS';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "maksekeskusTransactionId" TEXT;
