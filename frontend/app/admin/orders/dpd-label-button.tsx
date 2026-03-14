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
      console.log("[DPD Label] Input length:", labelPdf.length);
      console.log("[DPD Label] First 100 chars:", labelPdf.substring(0, 100));
      
      // Clean up base64 string
      let cleanBase64 = labelPdf;
      
      // Remove data URL prefix if present (handles both proper and corrupted formats)
      if (cleanBase64.includes("base64,")) {
        cleanBase64 = cleanBase64.split("base64,")[1] || cleanBase64;
      } else if (cleanBase64.startsWith("data")) {
        // Handle corrupted data URL like "dataapplication/pdfbase64..."
        const match = cleanBase64.match(/base64(.+)/i);
        if (match) {
          cleanBase64 = match[1];
        }
      }
      
      // Remove all whitespace and newlines
      cleanBase64 = cleanBase64.replace(/[\s\r\n]/g, "");
      
      // Remove any quotes that might have been added
      cleanBase64 = cleanBase64.replace(/^["']|["']$/g, "");
      
      // Handle URL-safe base64 (replace - with + and _ with /)
      cleanBase64 = cleanBase64.replace(/-/g, "+").replace(/_/g, "/");
      
      // Pad if necessary
      while (cleanBase64.length % 4 !== 0) {
        cleanBase64 += "=";
      }
      
      console.log("[DPD Label] Cleaned length:", cleanBase64.length);
      console.log("[DPD Label] First 100 chars after clean:", cleanBase64.substring(0, 100));

      // Check if it's a text-based placeholder label
      let isTextLabel = false;
      try {
        const decoded = atob(cleanBase64.substring(0, 100));
        isTextLabel = decoded.startsWith("DPD SHIPPING LABEL");
      } catch (e) {
        console.warn("[DPD Label] Error checking if text label:", e);
        isTextLabel = false;
      }

      if (isTextLabel) {
        const labelContent = atob(cleanBase64);
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
        // It's a PDF - convert base64 to binary and download
        console.log("[DPD Label] Decoding as PDF...");
        const binaryString = atob(cleanBase64);
        console.log("[DPD Label] Binary length:", binaryString.length);
        
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        console.log("[DPD Label] Blob size:", blob.size);
        
        // Create download link and trigger it
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `DPD-Label-${orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      console.error("[DPD Label] Error opening label:", err);
      console.error("[DPD Label] Input data (first 200):", labelPdf.substring(0, 200));
      alert("Failed to open label: " + (err instanceof Error ? err.message : "Unknown error"));
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
