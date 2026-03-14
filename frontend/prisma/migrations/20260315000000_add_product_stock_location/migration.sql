-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockLocation" TEXT DEFAULT 'instock';
