"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PopupSettings = {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  popupTitle: string;
  popupDescription: string;
  popupDiscountCode: string;
  popupDiscountPercent: number;
};

type Props = {
  initialSettings: PopupSettings;
};

export function PopupSettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<PopupSettings>(initialSettings);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        router.push("/admin/email?saved=1");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Failed to save settings");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to save settings");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={settings.popupEnabled}
              onChange={(e) => setSettings({ ...settings, popupEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            Enable Popup
          </label>
          <p className="text-xs text-stone-500">Show the newsletter popup to new visitors</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="delay" className="block text-sm font-medium text-stone-700">
            Delay (seconds)
          </label>
          <input
            id="delay"
            type="number"
            min={1}
            max={60}
            value={settings.popupDelaySeconds}
            onChange={(e) => setSettings({ ...settings, popupDelaySeconds: parseInt(e.target.value) || 10 })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-stone-700">
            Popup Title
          </label>
          <input
            id="title"
            type="text"
            value={settings.popupTitle}
            onChange={(e) => setSettings({ ...settings, popupTitle: e.target.value })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-stone-700">
            Popup Description
          </label>
          <textarea
            id="description"
            rows={2}
            value={settings.popupDescription}
            onChange={(e) => setSettings({ ...settings, popupDescription: e.target.value })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="discountCode" className="block text-sm font-medium text-stone-700">
            Discount Code
          </label>
          <input
            id="discountCode"
            type="text"
            value={settings.popupDiscountCode}
            onChange={(e) => setSettings({ ...settings, popupDiscountCode: e.target.value.toUpperCase() })}
            placeholder="e.g., WELCOME10"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm uppercase focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <p className="text-xs text-stone-500">Leave empty to hide discount offer</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="discountPercent" className="block text-sm font-medium text-stone-700">
            Discount Percentage
          </label>
          <input
            id="discountPercent"
            type="number"
            min={1}
            max={100}
            value={settings.popupDiscountPercent}
            onChange={(e) => setSettings({ ...settings, popupDiscountPercent: parseInt(e.target.value) || 10 })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-teal-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-2xl bg-[#344e41] px-6 py-2 text-sm font-medium text-[#dad7cd] transition hover:bg-[#24352b] disabled:bg-[#4e6a5a]"
      >
        {status === "saving" ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
