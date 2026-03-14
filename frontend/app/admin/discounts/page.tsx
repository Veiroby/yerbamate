"use client";

import { useState, useEffect } from "react";

type DiscountCode = {
  id: string;
  code: string;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: string;
  minOrderValue: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

type BundleOffer = {
  id: string;
  name: string;
  description: string | null;
  minQuantity: number;
  discountPercent: string;
  active: boolean;
  product: { id: string; name: string; slug: string } | null;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "PERCENTAGE" as "FIXED_AMOUNT" | "PERCENTAGE",
    value: "",
    minOrderValue: "",
    maxUses: "",
    expiresAt: "",
  });

  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    minQuantity: "2",
    discountPercent: "",
    productId: "",
  });

  const [discountError, setDiscountError] = useState("");
  const [bundleError, setBundleError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [discountsRes, bundlesRes, productsRes] = await Promise.all([
        fetch("/api/admin/discounts"),
        fetch("/api/admin/bundles"),
        fetch("/api/products"),
      ]);

      if (discountsRes.ok) {
        const data = await discountsRes.json();
        setDiscounts(data.discounts || []);
      }

      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");

    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountForm.code,
          type: discountForm.type,
          value: parseFloat(discountForm.value),
          minOrderValue: discountForm.minOrderValue
            ? parseFloat(discountForm.minOrderValue)
            : null,
          maxUses: discountForm.maxUses
            ? parseInt(discountForm.maxUses)
            : null,
          expiresAt: discountForm.expiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDiscountError(data.error || "Failed to create discount");
        return;
      }

      setDiscountForm({
        code: "",
        type: "PERCENTAGE",
        value: "",
        minOrderValue: "",
        maxUses: "",
        expiresAt: "",
      });
      fetchData();
    } catch {
      setDiscountError("Failed to create discount");
    }
  };

  const handleToggleDiscount = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling discount:", error);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    try {
      await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting discount:", error);
    }
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBundleError("");

    try {
      const res = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bundleForm.name,
          description: bundleForm.description || null,
          minQuantity: parseInt(bundleForm.minQuantity),
          discountPercent: parseFloat(bundleForm.discountPercent),
          productId: bundleForm.productId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setBundleError(data.error || "Failed to create bundle");
        return;
      }

      setBundleForm({
        name: "",
        description: "",
        minQuantity: "2",
        discountPercent: "",
        productId: "",
      });
      fetchData();
    } catch {
      setBundleError("Failed to create bundle");
    }
  };

  const handleToggleBundle = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/bundles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling bundle:", error);
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bundle offer?")) return;

    try {
      await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting bundle:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Discounts & Bundles
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create discount codes and bundle offers for your customers.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Discount Codes</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Create promo codes for fixed EUR amounts or percentage discounts.
        </p>

        <form onSubmit={handleCreateDiscount} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Code
              </label>
              <input
                type="text"
                value={discountForm.code}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME10"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Type
              </label>
              <select
                value={discountForm.type}
                onChange={(e) =>
                  setDiscountForm({
                    ...discountForm,
                    type: e.target.value as "FIXED_AMOUNT" | "PERCENTAGE",
                  })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Value {discountForm.type === "PERCENTAGE" ? "(%)" : "(EUR)"}
              </label>
              <input
                type="number"
                step={discountForm.type === "PERCENTAGE" ? "1" : "0.01"}
                min="0"
                max={discountForm.type === "PERCENTAGE" ? "100" : undefined}
                value={discountForm.value}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, value: e.target.value })
                }
                placeholder={discountForm.type === "PERCENTAGE" ? "10" : "5.00"}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Min Order (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountForm.minOrderValue}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, minOrderValue: e.target.value })
                }
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Max Uses
              </label>
              <input
                type="number"
                min="1"
                value={discountForm.maxUses}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, maxUses: e.target.value })
                }
                placeholder="Unlimited"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Expires At
              </label>
              <input
                type="date"
                value={discountForm.expiresAt}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, expiresAt: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create Discount Code
              </button>
            </div>
          </div>
          {discountError && (
            <p className="text-sm text-red-600">{discountError}</p>
          )}
        </form>

        <div className="mt-6">
          {discounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              No discount codes yet. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-zinc-500">
                    <th className="pb-2 font-medium">Code</th>
                    <th className="pb-2 font-medium">Discount</th>
                    <th className="pb-2 font-medium">Min Order</th>
                    <th className="pb-2 font-medium">Uses</th>
                    <th className="pb-2 font-medium">Expires</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="border-b">
                      <td className="py-3 font-mono font-medium">
                        {discount.code}
                      </td>
                      <td className="py-3">
                        {discount.type === "PERCENTAGE"
                          ? `${parseFloat(discount.value)}%`
                          : `EUR ${parseFloat(discount.value).toFixed(2)}`}
                      </td>
                      <td className="py-3">
                        {discount.minOrderValue
                          ? `EUR ${parseFloat(discount.minOrderValue).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="py-3">
                        {discount.usedCount}
                        {discount.maxUses ? ` / ${discount.maxUses}` : ""}
                      </td>
                      <td className="py-3">
                        {discount.expiresAt
                          ? new Date(discount.expiresAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() =>
                            handleToggleDiscount(discount.id, discount.active)
                          }
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            discount.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {discount.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Bundle Offers</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Create quantity-based discounts like &quot;Buy 2, get 10% off&quot;.
        </p>

        <form onSubmit={handleCreateBundle} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Name
              </label>
              <input
                type="text"
                value={bundleForm.name}
                onChange={(e) =>
                  setBundleForm({ ...bundleForm, name: e.target.value })
                }
                placeholder="Buy 2 Save 10%"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Min Quantity
              </label>
              <input
                type="number"
                min="2"
                value={bundleForm.minQuantity}
                onChange={(e) =>
                  setBundleForm({ ...bundleForm, minQuantity: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={bundleForm.discountPercent}
                onChange={(e) =>
                  setBundleForm({ ...bundleForm, discountPercent: e.target.value })
                }
                placeholder="10"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Product (optional)
              </label>
              <select
                value={bundleForm.productId}
                onChange={(e) =>
                  setBundleForm({ ...bundleForm, productId: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-600">
                Description (optional)
              </label>
              <input
                type="text"
                value={bundleForm.description}
                onChange={(e) =>
                  setBundleForm({ ...bundleForm, description: e.target.value })
                }
                placeholder="Buy more, save more!"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create Bundle Offer
              </button>
            </div>
          </div>
          {bundleError && (
            <p className="text-sm text-red-600">{bundleError}</p>
          )}
        </form>

        <div className="mt-6">
          {bundles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              No bundle offers yet. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-zinc-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Min Qty</th>
                    <th className="pb-2 font-medium">Discount</th>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bundles.map((bundle) => (
                    <tr key={bundle.id} className="border-b">
                      <td className="py-3 font-medium">{bundle.name}</td>
                      <td className="py-3">{bundle.minQuantity}+</td>
                      <td className="py-3">
                        {parseFloat(bundle.discountPercent)}% off
                      </td>
                      <td className="py-3">
                        {bundle.product ? bundle.product.name : "All products"}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() =>
                            handleToggleBundle(bundle.id, bundle.active)
                          }
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            bundle.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {bundle.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteBundle(bundle.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
