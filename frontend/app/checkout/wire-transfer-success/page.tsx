import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ orderNumber?: string }>;
};

export default async function WireTransferSuccessPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { orderNumber } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
            Order Received
          </h1>

          {orderNumber && (
            <p className="text-zinc-600 mb-6">
              Order number: <strong className="text-zinc-900">{orderNumber}</strong>
            </p>
          )}

          <div className="bg-zinc-50 rounded-xl p-6 text-left mb-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">
              Wire Transfer Payment Instructions
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Bank</dt>
                <dd className="font-medium text-zinc-900">Swedbank</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">IBAN</dt>
                <dd className="font-mono font-medium text-zinc-900">
                  LV30HABA0551057129470
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Beneficiary</dt>
                <dd className="font-medium text-zinc-900">SIA YerbaTea</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Reference</dt>
                <dd className="font-mono font-medium text-zinc-900">
                  {orderNumber || "Your order number"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> We will ship your order after the
              payment is received. An invoice has been sent to your email.
            </p>
          </div>

          <p className="text-sm text-zinc-500 mb-6">
            Please include your order number ({orderNumber || "as shown above"})
            as the payment reference to ensure we can process your order quickly.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
