"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  orderNumber: string;
  hasLabel: boolean;
  trackingNumber?: string | null;
  shipmentId?: string | null;
};

export function DpdLabelButton({ orderId, orderNumber, hasLabel: initialHasLabel, trackingNumber: initialTrackingNumber, shipmentId }: Props) {
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

      setHasLabel(!!data.labelPdf);
      setTrackingNumber(data.trackingNumber);
      
      if (data.labelPdf) {
        openLabel(data.labelPdf);
      }
    } catch {
      setError("Failed to generate label");
    } finally {
      setLoading(false);
    }
  };

  const fetchLabel = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dpd-label?refetch=true`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch label");
        return;
      }

      if (data.labelPdf) {
        setHasLabel(true);
        openLabel(data.labelPdf);
      } else {
        setError("Label not available from DPD");
      }
    } catch {
      setError("Failed to fetch label");
    } finally {
      setLoading(false);
    }
  };

  const openLabel = (labelPdf: string) => {
    try {
      // Check if it's a text-based placeholder label
      let isTextLabel = false;
      try {
        const decoded = atob(labelPdf.substring(0, 100));
        isTextLabel = decoded.startsWith("DPD SHIPPING LABEL");
      } catch {
        isTextLabel = false;
      }

      if (isTextLabel) {
        const labelContent = atob(labelPdf);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>DPD Label - ${orderNumber}</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
                pre { white-space: pre-wrap; font-size: 12px; line-height: 1.5; border: 2px solid #000; padding: 20px; background: #fff; }
                .print-btn { display: block; width: 100%; padding: 10px; margin-bottom: 20px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
                .print-btn:hover { background: #047857; }
                @media print { .print-btn { display: none; } body { padding: 0; } }
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
        // It's a PDF - convert base64 to binary
        const binaryString = atob(labelPdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Error opening label:", err);
      // Try opening as data URL as fallback
      try {
        const dataUrl = `data:application/pdf;base64,${labelPdf}`;
        window.open(dataUrl, "_blank");
      } catch {
        alert("Failed to open label. The label may be too large for the browser.");
      }
    }
  };

  const viewLabel = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dpd-label`);
      const data = await res.json();

      if (!res.ok || !data.labelPdf) {
        // If no label stored but we have a shipment ID, offer to fetch it
        if (shipmentId || trackingNumber) {
          if (confirm("Label not stored. Try to fetch from DPD?")) {
            fetchLabel();
          }
        } else {
          alert("Label not available");
        }
        return;
      }

      openLabel(data.labelPdf);
    } catch {
      alert("Failed to load label");
    }
  };

  // Has tracking number but no label - shipment was created but label fetch failed
  const needsLabelFetch = !hasLabel && (shipmentId || trackingNumber);

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
      ) : needsLabelFetch ? (
        <>
          <button
            type="button"
            onClick={fetchLabel}
            disabled={loading}
            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
          >
            {loading ? "Fetching..." : "Fetch Label"}
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
