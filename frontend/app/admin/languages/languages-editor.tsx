"use client";

import { useState, useEffect } from "react";
import { saveTranslationOverride, resetTranslationOverride } from "./languages-actions";

type Row = {
  key: string;
  enDefault: string;
  lvDefault: string;
  enOverride?: string;
  lvOverride?: string;
};

type Props = {
  rows: Row[];
};

export function LanguagesEditor({ rows }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [localEn, setLocalEn] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.key, r.enOverride ?? r.enDefault]),
    ),
  );
  const [localLv, setLocalLv] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.key, r.lvOverride ?? r.lvDefault]),
    ),
  );

  useEffect(() => {
    setLocalEn(
      Object.fromEntries(
        rows.map((r) => [r.key, r.enOverride ?? r.enDefault]),
      ),
    );
    setLocalLv(
      Object.fromEntries(
        rows.map((r) => [r.key, r.lvOverride ?? r.lvDefault]),
      ),
    );
  }, [rows]);

  const handleSave = async (key: string, locale: "en" | "lv") => {
    setSaving(`${key}-${locale}`);
    const value = locale === "en" ? localEn[key] : localLv[key];
    await saveTranslationOverride(key, locale, value ?? "");
    setSaving(null);
  };

  const handleReset = async (key: string, locale: "en" | "lv") => {
    setSaving(`reset-${key}-${locale}`);
    await resetTranslationOverride(key, locale);
    const defaultVal =
      locale === "en"
        ? rows.find((r) => r.key === key)?.enDefault ?? ""
        : rows.find((r) => r.key === key)?.lvDefault ?? "";
    if (locale === "en") setLocalEn((prev) => ({ ...prev, [key]: defaultVal }));
    else setLocalLv((prev) => ({ ...prev, [key]: defaultVal }));
    setSaving(null);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
          <thead>
            <tr className="bg-zinc-50">
              <th className="px-4 py-3 font-medium text-zinc-700">Key</th>
              <th className="px-4 py-3 font-medium text-zinc-700">EN</th>
              <th className="px-4 py-3 font-medium text-zinc-700">LV</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-zinc-50/50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-600">
                  {row.key}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={localEn[row.key] ?? row.enDefault}
                    onChange={(e) =>
                      setLocalEn((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-zinc-900"
                    placeholder={row.enDefault}
                  />
                  {row.enOverride !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleReset(row.key, "en")}
                      disabled={saving !== null}
                      className="mt-1 text-xs text-zinc-500 hover:text-red-600"
                    >
                      Reset to default
                    </button>
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={localLv[row.key] ?? row.lvDefault}
                    onChange={(e) =>
                      setLocalLv((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-zinc-900"
                    placeholder={row.lvDefault}
                  />
                  {row.lvOverride !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleReset(row.key, "lv")}
                      disabled={saving !== null}
                      className="mt-1 text-xs text-zinc-500 hover:text-red-600"
                    >
                      Reset to default
                    </button>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    type="button"
                    onClick={() => handleSave(row.key, "en")}
                    disabled={saving !== null}
                    className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Save EN
                  </button>
                  <span className="mx-1 text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSave(row.key, "lv")}
                    disabled={saving !== null}
                    className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Save LV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
