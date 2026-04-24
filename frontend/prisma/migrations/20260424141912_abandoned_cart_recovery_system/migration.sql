-- CreateEnum
CREATE TYPE "AbandonedCartStatus" AS ENUM ('ACTIVE', 'ABANDONED', 'RECOVERED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "AbandonedReminderStage" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- CreateEnum
CREATE TYPE "ReminderSendSource" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateTable
CREATE TABLE "AbandonedCartRecovery" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "customerName" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT true,
    "status" "AbandonedCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "abandonedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "recoveryToken" TEXT,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSentAt" TIMESTAMP(3),
    "nextReminderAt" TIMESTAMP(3),
    "lastReminderStage" "AbandonedReminderStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCartRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCartReminderLog" (
    "id" TEXT NOT NULL,
    "recoveryId" TEXT NOT NULL,
    "stage" "AbandonedReminderStage" NOT NULL,
    "source" "ReminderSendSource" NOT NULL,
    "sentByAdminId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,

    CONSTRAINT "AbandonedCartReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCartSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timeoutMinutes" INTEGER NOT NULL DEFAULT 1440,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "firstDelayHours" INTEGER NOT NULL DEFAULT 24,
    "secondDelayHours" INTEGER NOT NULL DEFAULT 72,
    "thirdDelayHours" INTEGER NOT NULL DEFAULT 168,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "firstSubject" TEXT,
    "secondSubject" TEXT,
    "thirdSubject" TEXT,
    "firstBody" TEXT,
    "secondBody" TEXT,
    "thirdBody" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCartSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCartRecovery_cartId_key" ON "AbandonedCartRecovery"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCartRecovery_sessionId_key" ON "AbandonedCartRecovery"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCartRecovery_recoveryToken_key" ON "AbandonedCartRecovery"("recoveryToken");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_email_idx" ON "AbandonedCartRecovery"("email");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_status_idx" ON "AbandonedCartRecovery"("status");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_lastActivityAt_idx" ON "AbandonedCartRecovery"("lastActivityAt");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_abandonedAt_idx" ON "AbandonedCartRecovery"("abandonedAt");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_nextReminderAt_idx" ON "AbandonedCartRecovery"("nextReminderAt");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_userId_idx" ON "AbandonedCartRecovery"("userId");

-- CreateIndex
CREATE INDEX "AbandonedCartReminderLog_recoveryId_idx" ON "AbandonedCartReminderLog"("recoveryId");

-- CreateIndex
CREATE INDEX "AbandonedCartReminderLog_sentAt_idx" ON "AbandonedCartReminderLog"("sentAt");

-- CreateIndex
CREATE INDEX "AbandonedCartReminderLog_source_idx" ON "AbandonedCartReminderLog"("source");

-- CreateIndex
CREATE INDEX "AbandonedCartReminderLog_stage_idx" ON "AbandonedCartReminderLog"("stage");

-- CreateIndex
CREATE INDEX "AbandonedCartReminderLog_sentByAdminId_idx" ON "AbandonedCartReminderLog"("sentByAdminId");

-- AddForeignKey
ALTER TABLE "AbandonedCartRecovery" ADD CONSTRAINT "AbandonedCartRecovery_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCartRecovery" ADD CONSTRAINT "AbandonedCartRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCartReminderLog" ADD CONSTRAINT "AbandonedCartReminderLog_recoveryId_fkey" FOREIGN KEY ("recoveryId") REFERENCES "AbandonedCartRecovery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCartReminderLog" ADD CONSTRAINT "AbandonedCartReminderLog_sentByAdminId_fkey" FOREIGN KEY ("sentByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default settings row
INSERT INTO "AbandonedCartSettings" ("id", "updatedAt")
VALUES ('default', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Backfill recovery rows for existing carts with session + items
INSERT INTO "AbandonedCartRecovery" (
  "id",
  "cartId",
  "sessionId",
  "userId",
  "email",
  "isGuest",
  "status",
  "lastActivityAt",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('acr_', md5(c."id")) AS "id",
  c."id" AS "cartId",
  c."sessionId",
  c."userId",
  c."email",
  CASE WHEN c."userId" IS NULL THEN true ELSE false END AS "isGuest",
  'ACTIVE'::"AbandonedCartStatus" AS "status",
  c."updatedAt" AS "lastActivityAt",
  c."createdAt",
  c."updatedAt"
FROM "Cart" c
WHERE c."sessionId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "CartItem" ci WHERE ci."cartId" = c."id")
ON CONFLICT ("cartId") DO NOTHING;
