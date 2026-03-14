-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weight" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ALTER COLUMN "id" SET DEFAULT 'default';
