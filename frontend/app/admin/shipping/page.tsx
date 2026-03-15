import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getShippingSettings,
  saveShippingSettings,
} from "@/lib/shipping/settings";
import { DPD_BALTIC_COUNTRIES } from "@/lib/shipping/dpd";

export default async function AdminShippingPage() {
  const [zones, settings] = await Promise.all([
    prisma.shippingZone.findMany({
      include: {
        methods: true,
      },
    }),
    getShippingSettings(),
  ]);

  const countryLabels: Record<string, string> = {
    LV: "Latvia",
    EE: "Estonia",
    LT: "Lithuania",
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Shipping settings
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Free shipping threshold and DPD parcel machine price per country.
          Leave free shipping empty to disable.
        </p>
        <form
          action={async (formData) => {
            "use server";
            const thresholdRaw = formData.get("freeShippingThreshold")?.toString()?.trim();
            const freeShippingThreshold =
              thresholdRaw !== undefined && thresholdRaw !== ""
                ? Number.parseFloat(thresholdRaw)
                : null;
            const freeShippingCurrency =
              formData.get("freeShippingCurrency")?.toString()?.trim() || "EUR";
            const dpdPriceByCountry: Record<string, number> = {};
            for (const code of DPD_BALTIC_COUNTRIES) {
              const val = formData.get(`dpdPrice_${code}`)?.toString();
              const num = val ? Number.parseFloat(val) : NaN;
              dpdPriceByCountry[code] = Number.isFinite(num) ? num : 4.99;
            }
            await saveShippingSettings({
              freeShippingThreshold: Number.isFinite(freeShippingThreshold)
                ? freeShippingThreshold
                : null,
              freeShippingCurrency,
              dpdPriceByCountry,
            });
            revalidatePath("/admin/shipping");
            redirect("/admin/shipping?saved=1");
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              Free shipping over (order value)
              <input
                type="number"
                name="freeShippingThreshold"
                step="0.01"
                min="0"
                placeholder="e.g. 50"
                defaultValue={
                  settings.freeShippingThreshold != null
                    ? String(settings.freeShippingThreshold)
                    : ""
                }
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              Currency for threshold
              <input
                type="text"
                name="freeShippingCurrency"
                placeholder="EUR"
                defaultValue={settings.freeShippingCurrency}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-700">
              DPD parcel machine price per country
            </p>
            <div className="flex flex-wrap gap-4">
              {DPD_BALTIC_COUNTRIES.map((code) => (
                <label
                  key={code}
                  className="flex flex-col gap-1 text-xs text-zinc-600"
                >
                  {countryLabels[code] ?? code}
                  <input
                    type="number"
                    name={`dpdPrice_${code}`}
                    step="0.01"
                    min="0"
                    defaultValue={settings.dpdPriceByCountry[code] ?? 4.99}
                    className="w-24 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save settings
          </button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Add shipping zone
        </h2>
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name")?.toString().trim();
            const countriesRaw = formData.get("countries")?.toString() ?? "";
            const countries = countriesRaw
              .split(",")
              .map((c) => c.trim().toUpperCase())
              .filter(Boolean);

            if (!name || countries.length === 0) return;

            await prisma.shippingZone.create({
              data: {
                name,
                countries,
              },
            });
            revalidatePath("/admin/shipping");
            redirect("/admin/shipping?saved=1");
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <input
            name="name"
            placeholder="Zone name"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="countries"
            placeholder="Countries (e.g. US,CA)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save zone
          </button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Zones & methods
        </h2>
        <div className="space-y-4 text-sm">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="space-y-3 rounded-xl border border-zinc-200 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{zone.name}</p>
                  <p className="text-xs text-zinc-500">
                    Countries:{" "}
                    {(zone.countries as unknown as string[]).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    action={async (formData) => {
                      "use server";
                      const zoneId = formData.get("zoneId")?.toString();
                      const name = formData.get("name")?.toString().trim();
                      const countriesRaw = formData.get("countries")?.toString() ?? "";
                      const countries = countriesRaw
                        .split(",")
                        .map((c) => c.trim().toUpperCase())
                        .filter(Boolean);
                      if (!zoneId || !name || countries.length === 0) return;
                      await prisma.shippingZone.update({
                        where: { id: zoneId },
                        data: { name, countries },
                      });
                      revalidatePath("/admin/shipping");
                      redirect("/admin/shipping?saved=1");
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="zoneId" value={zone.id} />
                    <input
                      name="name"
                      placeholder="Zone name"
                      defaultValue={zone.name}
                      className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                    />
                    <input
                      name="countries"
                      placeholder="e.g. US,CA"
                      defaultValue={(zone.countries as unknown as string[]).join(", ")}
                      className="w-28 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600"
                    >
                      Update zone
                    </button>
                  </form>
                  <form
                    action={async (formData) => {
                      "use server";
                      const zoneId = formData.get("zoneId")?.toString();
                      if (!zoneId) return;
                      await prisma.shippingZone.delete({
                        where: { id: zoneId },
                      });
                      revalidatePath("/admin/shipping");
                      redirect("/admin/shipping?saved=1");
                    }}
                    className="inline"
                  >
                    <input type="hidden" name="zoneId" value={zone.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete zone
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {zone.methods.map((method) => {
                  const config = method.rateConfig as unknown as {
                    amount?: number;
                  };
                  return (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2"
                    >
                      <span>
                        {method.name} •{" "}
                        {method.estimatedDays
                          ? `${method.estimatedDays} days`
                          : "N/A"}
                      </span>
                      <span>
                        {(config.amount ?? 5).toFixed(2)} {""}
                      </span>
                    </div>
                  );
                })}
                {zone.methods.length === 0 && (
                  <p className="text-xs text-zinc-500">
                    No methods for this zone yet.
                  </p>
                )}
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const name = formData.get("name")?.toString().trim();
                  const amount = Number.parseFloat(
                    formData.get("amount")?.toString() ?? "0",
                  );
                  const estimatedDaysRaw =
                    formData.get("estimatedDays")?.toString() ?? "";
                  const estimatedDays = estimatedDaysRaw
                    ? Number.parseInt(estimatedDaysRaw, 10)
                    : null;

                  if (!name || !Number.isFinite(amount)) return;

                  await prisma.shippingMethod.create({
                    data: {
                      zoneId: zone.id,
                      name,
                      type: "FLAT",
                      rateConfig: { amount },
                      estimatedDays: estimatedDays ?? undefined,
                    },
                  });
                  revalidatePath("/admin/shipping");
                  redirect("/admin/shipping?saved=1");
                }}
                className="grid gap-2 md:grid-cols-4"
              >
                <input
                  name="name"
                  placeholder="Method name"
                  className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs"
                  required
                />
                <input
                  name="amount"
                  placeholder="Flat amount"
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs"
                  required
                />
                <input
                  name="estimatedDays"
                  placeholder="ETA days"
                  type="number"
                  className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Add method
                </button>
              </form>
            </div>
          ))}
          {zones.length === 0 && (
            <p className="text-sm text-zinc-500">
              No shipping zones configured yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

