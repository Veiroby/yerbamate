import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

export const metadata = {
  title: "Terms and conditions – YerbaTea",
  description: "Terms and conditions for YerbaTea.",
};

export default async function TermsPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 font-serif text-2xl font-semibold tracking-tight">
          Terms and conditions
        </h1>
        <div className="prose prose-stone max-w-none text-sm">
          <p className="text-stone-600">
            These terms and conditions apply to the use of the YerbaTea online store
            and to distance contracts concluded with the seller.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">1. Seller</h2>
          <p className="mt-2 text-stone-600">
            The seller is SIA YerbaTea, registration no. 50203504501, registered
            address: Ieriķu iela 66-112, Rīga, LV-1084, Latvia. You may contact us
            via the details on our Contact page.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">2. Contract and prices</h2>
          <p className="mt-2 text-stone-600">
            By placing an order you make an offer to buy under these terms. We may
            refuse or cancel orders (e.g. for stock, payment, or fraud reasons).
            Prices and availability are as shown at checkout; we will inform you
            of any change before charging. Payment is due as indicated (e.g. at
            checkout via our payment provider). All amounts include VAT where
            applicable under Latvian law.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">3. Delivery</h2>
          <p className="mt-2 text-stone-600">
            Delivery methods, times, and costs are set out in our{" "}
            <a href="/shipping-policy" className="text-emerald-700 underline">Shipping policy</a>.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">4. Right of withdrawal (14 days)</h2>
          <p className="mt-2 text-stone-600">
            As a consumer you have the right to withdraw from the contract without
            giving a reason within <strong>14 calendar days</strong> from the day you (or a third
            party you named) receive the goods. To exercise this right you must
            inform us of your decision by a clear statement (e.g. by email or using
            a withdrawal form if we provide one). Please keep proof of having sent
            the withdrawal within the 14-day period. You must then return the goods
            within 14 days of notifying us. Goods must be returned in the same
            condition as received; you may only handle them as you would in a shop
            to check type, characteristics, and functioning. You are liable for
            any diminished value resulting from use beyond that.
          </p>
          <p className="mt-2 text-stone-600">
            We will refund all payments received from you, including delivery
            costs (except any extra cost you chose for a type of delivery we did
            not offer as standard), within 14 days of receiving your withdrawal
            notice. We may withhold the refund until we receive the goods back or
            you supply proof of return. Refunds will be made by the same means as
            you paid. <strong>Return delivery costs are borne by you</strong> unless we have
            agreed otherwise or failed to inform you of this.
          </p>
          <p className="mt-2 text-stone-600">
            The right of withdrawal does not apply to, among others: goods made to
            your specifications or clearly personalised; sealed goods unsealed
            after delivery for health or hygiene reasons (e.g. certain food or
            consumables); and digital content supplied where you have consented to
            performance beginning before the withdrawal period expires.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">5. Legal guarantee (conformity)</h2>
          <p className="mt-2 text-stone-600">
            Your statutory rights regarding defective goods (legal guarantee of
            conformity) are not affected by these terms. Under Latvian and EU law
            you may be entitled to repair, replacement, price reduction, or
            rescission depending on the circumstances. Contact us with your order
            details if you believe goods are not in conformity.
          </p>

          <h2 className="mt-6 text-base font-semibold text-stone-900">6. Disputes and applicable law</h2>
          <p className="mt-2 text-stone-600">
            These terms are governed by the law of the Republic of Latvia and
            applicable EU law. For consumer disputes you may first contact us in
            writing. You may also refer the matter to the Consumer Rights Protection
            Centre (Patērētāju tiesību aizsardzības centrs, PTAC), Brīvības iela
            55, Rīga, LV-1010,{" "}
            <a href="https://www.ptac.gov.lv/en" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">www.ptac.gov.lv</a>,
            or use the EU Online Dispute Resolution platform:{" "}
            <a href="https://ec.europa.eu/consumers/odr" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
          </p>

          <p className="mt-8 text-stone-500">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
