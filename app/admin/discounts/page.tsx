export default function AdminDiscountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Discounts & Bundles
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create discount codes and product bundles. (Feature can be wired to
          the data model in a future release.)
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">
          Discount codes
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Add percentage or fixed-amount discounts applied at checkout.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          No discount codes yet. Add a code (e.g. WELCOME10) and set a
          percentage or amount to enable this feature.
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Bundles</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Group products into bundles with a combined price.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          No bundles yet. Create a bundle and add products to offer a combined
          price.
        </div>
      </section>
    </div>
  );
}
