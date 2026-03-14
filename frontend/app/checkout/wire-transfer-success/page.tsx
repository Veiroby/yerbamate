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
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#606C38]/20">
            <svg
              className="h-8 w-8 text-[#606C38]"
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

          <h1 className="heading-page mb-2">Order Received</h1>

          {orderNumber && (
            <p className="mb-6 text-[#606C38]">
              Order number: <strong className="text-[#283618]">{orderNumber}</strong>
            </p>
          )}

          <div className="mb-6 rounded-xl bg-[#606C38]/10 p-6 text-left">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#283618]">
              Wire Transfer Payment Instructions
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#606C38]">Bank</dt>
                <dd className="font-medium text-[#283618]">Swedbank</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#606C38]">IBAN</dt>
                <dd className="font-mono font-medium text-[#283618]">
                  LV30HABA0551057129470
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#606C38]">Beneficiary</dt>
                <dd className="font-medium text-[#283618]">SIA YerbaTea</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#606C38]">Reference</dt>
                <dd className="font-mono font-medium text-[#283618]">
                  {orderNumber || "Your order number"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mb-6 rounded-xl border border-[#DDA15E]/50 bg-[#DDA15E]/15 p-4">
            <p className="text-sm text-[#283618]">
              <strong>Important:</strong> We will ship your order after the
              payment is received. An invoice has been sent to your email.
            </p>
          </div>

          <p className="mb-6 text-sm text-[#606C38]">
            Please include your order number ({orderNumber || "as shown above"})
            as the payment reference to ensure we can process your order quickly.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-[#283618] px-6 py-2 text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#283618]/90"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
