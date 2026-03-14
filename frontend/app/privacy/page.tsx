import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

export const metadata = {
  title: "Privacy policy – YerbaTea",
  description: "Privacy policy for YerbaTea.",
};

export default async function PrivacyPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="heading-page mb-8">Privacy policy</h1>
        <div className="prose max-w-none text-sm prose-p:text-[#606C38] prose-headings:text-[#283618]">
          <p className="text-[#606C38]">
            This privacy policy explains how SIA YerbaTea (registration no. 50203504501,
            registered address: Ieriķu iela 66-112, Rīga, LV-1084) collects, uses,
            and protects your personal data. We process data in accordance with the
            General Data Protection Regulation (EU 2016/679) and the Latvian Personal
            Data Processing Law.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">1. Data controller</h2>
          <p className="mt-2 text-[#606C38]">
            The data controller is SIA YerbaTea. For data protection enquiries or to
            exercise your rights, contact us via the details on our Contact page or
            by writing to our registered address.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">2. Purposes and legal basis</h2>
          <p className="mt-2 text-[#606C38]">
            We process personal data for: (a) <strong>Order fulfilment</strong> — name,
            email, delivery address, and payment-related data — on the legal basis of
            contract performance; (b) <strong>Customer support and enquiries</strong> —
            contact details and message content — on the basis of contract or our
            legitimate interest in responding to you; (c) <strong>Newsletter and
            marketing</strong> — email address — on the basis of your consent; (d)
            <strong> Anonymous usage statistics</strong> — where we use non-identifying
            data to improve our services.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">3. Recipients and transfers</h2>
          <p className="mt-2 text-[#606C38]">
            We may share data with: payment service providers (e.g. Stripe), delivery
            partners (e.g. DPD) for shipment, and IT or hosting providers acting on
            our instructions. We do not sell your data. Transfers outside the EEA
            (if any) are carried out with appropriate safeguards (e.g. adequacy
            decisions or standard contractual clauses).
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">4. Retention</h2>
          <p className="mt-2 text-[#606C38]">
            We keep personal data only as long as necessary: for example, order and
            accounting data for the periods required by Latvian law; contact and
            support data for the duration of the relationship and any applicable
            limitation period; newsletter data until you unsubscribe or withdraw
            consent.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">5. Your rights</h2>
          <p className="mt-2 text-[#606C38]">
            You have the right to: <strong>access</strong> your data; <strong>rectify</strong> inaccurate
            data; <strong>erase</strong> data (where applicable); <strong>restrict</strong> processing;
            <strong> data portability</strong> (where applicable); <strong>object</strong> to processing
            based on legitimate interest; <strong>withdraw consent</strong> at any time
            (e.g. for newsletter). We will respond to your request without undue delay
            and in any event within <strong>30 days</strong> as required by applicable law. You may
            also <strong>lodge a complaint</strong> with the Data State Inspectorate of Latvia
            (Datu valsts inspekcija), Blaumaṇa iela 11/13, Rīga, LV-1011,{" "}
            <a href="https://www.dvi.gov.lv/en" className="text-emerald-700 underline">www.dvi.gov.lv</a>.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">6. Children</h2>
          <p className="mt-2 text-[#606C38]">
            Our services are not directed at children. For information society
            services, Latvian law allows children aged 13 and over to give consent
            themselves in certain cases; we do not knowingly collect data from
            younger users without parental consent.
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
