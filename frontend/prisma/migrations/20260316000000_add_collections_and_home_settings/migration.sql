-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInCollection" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInCollection_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homeNewArrivalsCollectionId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homeTopSellingCollectionId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homePromoProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInCollection_collectionId_productId_key" ON "ProductInCollection"("collectionId", "productId");

-- CreateIndex
CREATE INDEX "ProductInCollection_collectionId_idx" ON "ProductInCollection"("collectionId");

-- CreateIndex
CREATE INDEX "ProductInCollection_productId_idx" ON "ProductInCollection"("productId");

-- AddForeignKey
ALTER TABLE "ProductInCollection" ADD CONSTRAINT "ProductInCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInCollection" ADD CONSTRAINT "ProductInCollection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
