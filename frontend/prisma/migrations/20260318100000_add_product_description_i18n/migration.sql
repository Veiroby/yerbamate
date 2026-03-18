-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionEn" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionLv" TEXT;

-- Migrate existing description into descriptionEn (English)
UPDATE "Product" SET "descriptionEn" = "description" WHERE "descriptionEn" IS NULL;

