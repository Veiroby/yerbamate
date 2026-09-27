-- Keep stock, abandoned carts, and admin notices in step with order status.

ALTER TABLE "Order" ADD COLUMN "inventoryDeductedAt" TIMESTAMP(3);

ALTER TABLE "InventoryAdjustment" ALTER COLUMN "actorId" DROP NOT NULL;

ALTER TABLE "InventoryAdjustment" DROP CONSTRAINT "InventoryAdjustment_actorId_fkey";

ALTER TABLE "InventoryAdjustment"
ADD CONSTRAINT "InventoryAdjustment_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNotification_userId_createdAt_idx" ON "AdminNotification"("userId", "createdAt");

CREATE INDEX "AdminNotification_userId_readAt_idx" ON "AdminNotification"("userId", "readAt");

ALTER TABLE "AdminNotification"
ADD CONSTRAINT "AdminNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION shop_adjust_order_stock(p_order_id text, p_sign int, p_reason text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  item record;
  v_after int;
BEGIN
  FOR item IN
    SELECT oi.quantity, ii.id
    FROM "OrderItem" oi
    JOIN "InventoryItem" ii ON ii.sku = 'default-' || oi."productId"
    WHERE oi."orderId" = p_order_id
      AND oi."productId" IS NOT NULL
  LOOP
    UPDATE "InventoryItem"
       SET quantity = quantity + (p_sign * item.quantity),
           "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = item.id
    RETURNING quantity INTO v_after;

    INSERT INTO "InventoryAdjustment" (
      id, "inventoryItemId", delta, "quantityAfter", reason, "actorId", "createdAt"
    ) VALUES (
      substr(md5(random()::text || clock_timestamp()::text || item.id || p_order_id), 1, 25),
      item.id,
      p_sign * item.quantity,
      v_after,
      p_reason,
      NULL,
      CURRENT_TIMESTAMP
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION shop_order_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  paid_new boolean;
  paid_old boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."inventoryDeductedAt" IS NOT NULL THEN
      PERFORM shop_adjust_order_stock(OLD.id, 1, 'order_deleted:' || OLD.id);
    END IF;
    RETURN OLD;
  END IF;

  paid_new := NEW.status::text IN ('PAID', 'PROCESSING', 'SHIPPED');
  paid_old := TG_OP = 'UPDATE' AND OLD.status::text IN ('PAID', 'PROCESSING', 'SHIPPED');

  IF paid_new AND NOT paid_old AND NEW."inventoryDeductedAt" IS NULL
     AND EXISTS (
       SELECT 1 FROM "OrderItem" oi
       WHERE oi."orderId" = NEW.id AND oi."productId" IS NOT NULL
     ) THEN
    PERFORM shop_adjust_order_stock(NEW.id, -1, 'order_paid:' || NEW.id);
    NEW."inventoryDeductedAt" := CURRENT_TIMESTAMP;
  ELSIF NEW.status::text IN ('CANCELLED', 'REFUNDED') AND NEW."inventoryDeductedAt" IS NOT NULL THEN
    PERFORM shop_adjust_order_stock(NEW.id, 1, 'order_reversed:' || NEW.id);
    NEW."inventoryDeductedAt" := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION shop_order_after_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_title text;
  v_body text;
  v_order_id text;
  v_session text;
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  v_order_id := NEW.id;
  v_session := NEW."sessionId";
  v_status := NEW.status::text;

  IF v_session IS NOT NULL AND v_status IN ('PENDING', 'REQUIRES_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED') THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE "AbandonedCartRecovery"
         SET status = 'CONVERTED',
             "convertedAt" = COALESCE("convertedAt", CURRENT_TIMESTAMP),
             "nextReminderAt" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
       WHERE "sessionId" = v_session
         AND status::text IN ('ACTIVE', 'ABANDONED', 'RECOVERED');
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_title := 'New order';
    v_body := COALESCE(NEW."orderNumber", 'Order');
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_title := 'Order updated';
    v_body := COALESCE(NEW."orderNumber", 'Order') || ' is now ' || v_status;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO "AdminNotification" (id, "userId", title, body, href, "createdAt")
  SELECT
    substr(md5(random()::text || clock_timestamp()::text || u.id || v_order_id || v_title), 1, 25),
    u.id,
    v_title,
    v_body,
    '/admin/orders/' || v_order_id,
    CURRENT_TIMESTAMP
  FROM "User" u
  WHERE u."isAdmin" = true
    AND NOT EXISTS (
      SELECT 1
      FROM "AdminNotification" n
      WHERE n."userId" = u.id
        AND n.href = '/admin/orders/' || v_order_id
        AND n.title = v_title
        AND n."readAt" IS NULL
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_order_before_write ON "Order";
CREATE TRIGGER shop_order_before_write
BEFORE INSERT OR UPDATE OR DELETE ON "Order"
FOR EACH ROW EXECUTE FUNCTION shop_order_before_write();

DROP TRIGGER IF EXISTS shop_order_after_write ON "Order";
CREATE TRIGGER shop_order_after_write
AFTER INSERT OR UPDATE ON "Order"
FOR EACH ROW EXECUTE FUNCTION shop_order_after_write();
