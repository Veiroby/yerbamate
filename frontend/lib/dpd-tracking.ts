import { prisma } from "@/lib/db";

export type DpdTrackingInfo = {
  sentAt?: Date;
  deliveredAt?: Date;
  lastStatus?: string;
  lastStatusAt?: Date;
};

// Normalized subset of DPD tracking event
type DpdEvent = {
  statusCode: string;
  statusText: string;
  timestamp: string;
};

// Fetch tracking information from DPD for a single shipment.
// The exact URL / auth headers are provided via environment variables so they can be configured
// without code changes once you have production credentials.
async function fetchDpdEvents(trackingNumber: string): Promise<DpdEvent[]> {
  const baseUrl = process.env.DPD_TRACKING_URL;
  const username = process.env.DPD_USERNAME;
  const password = process.env.DPD_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.warn("[dpd-tracking] Missing DPD_TRACKING_URL / DPD_USERNAME / DPD_PASSWORD env vars");
    return [];
  }

  const url = `${baseUrl}?parcelNumber=${encodeURIComponent(trackingNumber)}`;

  const authHeader = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("[dpd-tracking] Failed to fetch tracking", res.status, await res.text());
    return [];
  }

  const data = await res.json();

  // Shape of the DPD response can vary by region; we try a few sensible defaults and
  // let you tighten this once you know the exact API.
  const events: any[] =
    data?.parcels?.[0]?.events ??
    data?.events ??
    [];

  return events
    .map((e) => ({
      statusCode: String(e.statusCode ?? e.code ?? ""),
      statusText: String(e.statusText ?? e.description ?? ""),
      timestamp: String(e.timestamp ?? e.eventTime ?? e.date ?? ""),
    }))
    .filter((e) => e.timestamp);
}

// Map raw DPD events to our normalized milestones.
function mapEventsToTrackingInfo(events: DpdEvent[]): DpdTrackingInfo {
  if (!events.length) {
    return {};
  }

  // Sort by time ascending
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let sentAt: Date | undefined;
  let deliveredAt: Date | undefined;

  for (const e of sorted) {
    const t = new Date(e.timestamp);
    const code = e.statusCode.toUpperCase();
    const text = e.statusText.toLowerCase();

    // Heuristic mapping – adjust when you know your concrete DPD statuses
    if (
      !sentAt &&
      (code.includes("DEP") || text.includes("in transit") || text.includes("departed"))
    ) {
      sentAt = t;
    }

    if (
      !deliveredAt &&
      (code.includes("DELIVERED") || text.includes("delivered") || text.includes("delivered to"))
    ) {
      deliveredAt = t;
    }
  }

  const last = sorted[sorted.length - 1];

  return {
    sentAt,
    deliveredAt,
    lastStatus: last.statusText || last.statusCode,
    lastStatusAt: new Date(last.timestamp),
  };
}

// Public helper: refresh tracking info for a single order using its tracking number.
export async function updateOrderFromDpdTracking(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      dpdTrackingNumber: true,
    },
  });

  if (!order?.dpdTrackingNumber) {
    console.warn("[dpd-tracking] Order has no dpdTrackingNumber", orderId);
    return;
  }

  const events = await fetchDpdEvents(order.dpdTrackingNumber);
  const info = mapEventsToTrackingInfo(events);

  if (!Object.keys(info).length) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      dpdSentAt: info.sentAt ?? undefined,
      dpdDeliveredAt: info.deliveredAt ?? undefined,
      dpdLastStatus: info.lastStatus ?? undefined,
      dpdLastStatusAt: info.lastStatusAt ?? undefined,
    },
  });
}

