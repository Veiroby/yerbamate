-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_key_locale_key" ON "Translation"("key", "locale");
