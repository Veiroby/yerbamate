-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isBestseller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "bestsellerRank" INTEGER;
ALTER TABLE "Product" ADD COLUMN "catalogSortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_isBestseller_bestsellerRank_idx" ON "Product"("isBestseller", "bestsellerRank");
