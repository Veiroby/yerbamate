import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { isValidLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Shipping policy – YerbaTea",
  description: "Shipping and delivery policy for YerbaTea.",
};

export default async function ShippingPolicyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="heading-page mb-8">Shipping policy</h1>
        <div className="prose max-w-none text-sm prose-p:text-[#606C38] prose-headings:text-[#283618]">
          <p className="text-[#606C38]">
            This shipping and delivery policy applies to orders placed with SIA
            YerbaTea (registration no. 50203504501) and is part of the information
            we provide to you as a consumer under Latvian and EU distance-selling
            rules.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">1. Delivery areas and methods</h2>
          <p className="mt-2 text-[#606C38]">
            We ship to the countries and by the methods offered at checkout. These
            include delivery within Latvia, Estonia, and Lithuania (e.g. via DPD
            parcel machines (pickup points) or courier where available), and may
            include other destinations. Exact options, delivery costs, and any free
            shipping threshold (e.g. for orders above a certain amount) are shown
            at checkout and may vary by country and order value.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">2. Dispatch and delivery times</h2>
          <p className="mt-2 text-[#606C38]">
            We aim to dispatch orders within a few business days of confirmation
            of payment. You will receive order confirmation and, where available,
            tracking information by email. Delivery times are <strong>estimates</strong> only:
            typically 1–3 business days within the Baltics for parcel machine or
            courier, and longer for other regions. We are not responsible for
            delays caused by the carrier, customs, or other circumstances outside
            our control.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">3. Delivery address and receipt</h2>
          <p className="mt-2 text-[#606C38]">
            You must provide an accurate delivery address (or select a valid DPD
            pickup point where that option is used). It is your responsibility to
            receive the goods or to arrange collection from a parcel machine within
            the period allowed by the carrier. Upon delivery, please check the
            parcel and <strong>note any visible damage or shortage on the delivery document</strong> or
            with the carrier, as this may be required to support a claim.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">4. Risk and ownership</h2>
          <p className="mt-2 text-[#606C38]">
            Risk of loss or damage to the goods passes to you when the goods are
            delivered to you or to a person authorised to receive them (e.g. at a
            parcel machine when you or your representative collect the parcel).
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">5. Lost or damaged parcels</h2>
          <p className="mt-2 text-[#606C38]">
            If a parcel is lost or damaged in transit, please contact us with your
            order number and details as soon as possible. We will work with the
            carrier to resolve the issue. Your statutory rights (including the
            legal guarantee of conformity and the right of withdrawal where
            applicable) remain unaffected; see our{" "}
            <a href={`${prefix}/terms`} className="text-emerald-700 underline">Terms and conditions</a>.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">6. Returns and refunds</h2>
          <p className="mt-2 text-[#606C38]">
            For returns under the 14-day withdrawal right or for non-conforming
            goods, the cost of returning the goods is generally borne by you
            unless we have agreed otherwise or failed to inform you of this, as set
            out in our Terms and conditions. Refunds will be made in accordance
            with those terms.
          </p>

          <p className="mt-8 text-stone-500">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
