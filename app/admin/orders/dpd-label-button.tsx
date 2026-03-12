"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  orderNumber: string;
  hasLabel: boolean;
  trackingNumber?: string | null;
};

export function DpdLabelButton({ orderId, orderNumber, hasLabel: initialHasLabel, trackingNumber: initialTrackingNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const [hasLabel, setHasLabel] = useState(initialHasLabel);
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [error, setError] = useState<string | null>(null);

  const generateLabel = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dpd-label`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate label");
        return;
      }

      setHasLabel(true);
      setTrackingNumber(data.trackingNumber);
    } catch {
      setError("Failed to generate label");
    } finally {
      setLoading(false);
    }
  };

  const viewLabel = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dpd-label`);
      const data = await res.json();

      if (!res.ok || !data.labelPdf) {
        alert("Label not available");
        return;
      }

      // Check if it's a simple text label (placeholder) or actual PDF
      const labelContent = atob(data.labelPdf);
      const isTextLabel = labelContent.startsWith("DPD SHIPPING LABEL");

      if (isTextLabel) {
        // Open text label in new window for printing
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>DPD Label - ${orderNumber}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  padding: 20px;
                  max-width: 400px;
                  margin: 0 auto;
                }
                pre {
                  white-space: pre-wrap;
                  font-size: 12px;
                  line-height: 1.5;
                  border: 2px solid #000;
                  padding: 20px;
                  background: #fff;
                }
                .print-btn {
                  display: block;
                  width: 100%;
                  padding: 10px;
                  margin-bottom: 20px;
                  background: #059669;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .print-btn:hover {
                  background: #047857;
                }
                @media print {
                  .print-btn { display: none; }
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <button class="print-btn" onclick="window.print()">Print Label</button>
              <pre>${labelContent}</pre>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        // Open actual PDF
        const blob = new Blob([Uint8Array.from(atob(data.labelPdf), c => c.charCodeAt(0))], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch {
      alert("Failed to load label");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {hasLabel ? (
        <>
          <button
            type="button"
            onClick={viewLabel}
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          >
            View Label
          </button>
          {trackingNumber && (
            <span className="text-xs text-zinc-500">
              {trackingNumber}
            </span>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={generateLabel}
          disabled={loading}
          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate DPD Label"}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
