import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db";
import { LanguagesEditor } from "./languages-editor";

function loadJsonLocale(locale: string): Record<string, string> {
  const localePath = path.join(process.cwd(), "locales", `${locale}.json`);
  try {
    const raw = fs.readFileSync(localePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, string>;
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

export default async function AdminLanguagesPage() {
  const defaultsEn = loadJsonLocale("en");
  const defaultsLv = loadJsonLocale("lv");
  const keys = Object.keys(defaultsEn).sort();

  const overrides = await prisma.translation.findMany({
    where: { locale: { in: ["en", "lv"] } },
    select: { key: true, locale: true, value: true },
  });

  const overrideMap = new Map<string, Record<string, string>>();
  for (const row of overrides) {
    if (!overrideMap.has(row.key)) overrideMap.set(row.key, {});
    overrideMap.get(row.key)![row.locale] = row.value;
  }

  const rows = keys.map((key) => ({
    key,
    enDefault: defaultsEn[key] ?? "",
    lvDefault: defaultsLv[key] ?? defaultsEn[key] ?? "",
    enOverride: overrideMap.get(key)?.en,
    lvOverride: overrideMap.get(key)?.lv,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Languages
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Override default translation strings per locale. Defaults come from{" "}
          <code className="rounded bg-zinc-100 px-1">locales/en.json</code> and{" "}
          <code className="rounded bg-zinc-100 px-1">locales/lv.json</code>.
          Clear an override to use the default again.
        </p>
      </div>

      <LanguagesEditor rows={rows} />
    </div>
  );
}
