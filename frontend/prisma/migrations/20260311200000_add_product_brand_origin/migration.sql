-- AlterTable
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;
ALTER TABLE "Product" ADD COLUMN "origin" TEXT;

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_origin_idx" ON "Product"("origin");
