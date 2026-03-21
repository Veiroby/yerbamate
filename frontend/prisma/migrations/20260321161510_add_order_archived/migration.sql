-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_archived_idx" ON "Order"("archived");
