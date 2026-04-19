import { prisma } from "@/lib/db";
import { InventoryForm } from "./inventory-form";
import { removeFromStockAction, saveInventoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, barcode: true },
  });

  const variants = await prisma.variant.findMany({
    include: { inventoryItems: true },
  });

  const stockByProductId = new Map<string, number>();
  for (const v of variants) {
    const total = v.inventoryItems.reduce((s, i) => s + i.quantity, 0);
    stockByProductId.set(
      v.productId,
      (stockByProductId.get(v.productId) ?? 0) + total,
    );
  }

  const productIdsWithStock = Array.from(stockByProductId.entries())
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => {
      const nameA = products.find((p) => p.id === a[0])?.name ?? "";
      const nameB = products.find((p) => p.id === b[0])?.name ?? "";
      return nameA.localeCompare(nameB);
    });

  const [adjustments, inventoryRows] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { email: true } },
        inventoryItem: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        variant: {
          include: { product: { select: { price: true, currency: true } } },
        },
      },
    }),
  ]);

  let inventoryValue = 0;
  let valueCurrency = "EUR";
  for (const row of inventoryRows) {
    const p = row.variant?.product;
    if (!p) continue;
    const unit = Number(row.variant?.priceOverride ?? p.price);
    inventoryValue += unit * row.quantity;
    valueCurrency = p.currency ?? valueCurrency;
  }

  const fmtMoney = (n: number, c: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Inventory value (estimate)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Sum of (unit price or variant override) × quantity for in-stock rows. Mixed currencies are summed
          naively.
        </p>
        <p className="mt-3 text-2xl font-semibold text-zinc-900">{fmtMoney(inventoryValue, valueCurrency)}</p>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Adjust inventory
        </h2>
        <InventoryForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
          }))}
        />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Current stock (synced with storefront)
        </h2>
        <div className="space-y-2 text-sm">
          {productIdsWithStock.map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId);
            return (
              <div
                key={`${productId}-${quantity}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2"
              >
                <p className="min-w-0 flex-1 font-medium text-zinc-900">
                  {product?.name ?? productId}
                </p>
                <form
                  action={saveInventoryAction}
                  className="flex items-center gap-2 shrink-0"
                >
                  <input type="hidden" name="productId" value={productId} />
                  <label className="sr-only">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    defaultValue={quantity}
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Save
                  </button>
                </form>
                <form action={removeFromStockAction} className="shrink-0">
                  <input type="hidden" name="productId" value={productId} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </form>
              </div>
            );
          })}
          {productIdsWithStock.length === 0 && (
            <p className="text-sm text-zinc-500">No inventory records yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Recent stock adjustments</h2>
        {adjustments.length === 0 ? (
          <p className="text-sm text-zinc-500">No adjustments logged yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm">
            {adjustments.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-zinc-600">
                  {a.createdAt.toLocaleString()} · {a.actor.email}
                </span>
                <span className="font-medium text-zinc-900">
                  {a.inventoryItem.variant?.product?.name ?? a.inventoryItem.sku}{" "}
                  <span className={a.delta >= 0 ? "text-emerald-700" : "text-red-600"}>
                    {a.delta >= 0 ? "+" : ""}
                    {a.delta}
                  </span>{" "}
                  → {a.quantityAfter}
                </span>
                {a.reason ? <span className="w-full text-xs text-zinc-400">{a.reason}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
