import { createHash } from "node:crypto";

/**
 * Mailchimp Marketing API – add subscribers to your audience (list).
 * API key from https://admin.mailchimp.com/account/api/
 * Audience (list) ID from Audience → Settings → Audience name and defaults.
 */

function getMailchimpConfig(): { apiKey: string; audienceId: string; baseUrl: string } | null {
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim();
  if (!apiKey || !audienceId) return null;
  const dc = apiKey.includes("-") ? apiKey.split("-").pop() : "us1";
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
  return { apiKey, audienceId, baseUrl };
}

export function isMailchimpConfigured(): boolean {
  return getMailchimpConfig() !== null;
}

/**
 * Add or update a list member (subscribed). Uses PUT so existing members are updated to subscribed.
 */
export async function addMailchimpSubscriber(options: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const config = getMailchimpConfig();
  if (!config) {
    return { ok: false, error: "Mailchimp not configured" };
  }

  const email = options.email.trim().toLowerCase();
  const subscriberHash = hashEmail(email);

  const body: {
    email_address: string;
    status: "subscribed";
    merge_fields?: { FNAME?: string; LNAME?: string };
  } = {
    email_address: email,
    status: "subscribed",
  };
  if (options.firstName ?? options.lastName) {
    body.merge_fields = {};
    if (options.firstName) body.merge_fields.FNAME = options.firstName;
    if (options.lastName) body.merge_fields.LNAME = options.lastName;
  }

  try {
    const auth = Buffer.from(`anystring:${config.apiKey}`).toString("base64");
    const res = await fetch(
      `${config.baseUrl}/lists/${config.audienceId}/members/${subscriberHash}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(body),
      },
    );

    const raw = await res.text();
    let data: { detail?: string; title?: string } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { detail: raw || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      const payload = data as { detail?: string; title?: string };
      const detail = payload.detail ?? "";
      const msg = detail || payload.title || `HTTP ${res.status}`;
      if (res.status === 400 && (detail.toLowerCase().includes("already") || detail.toLowerCase().includes("exists"))) {
        return { ok: true };
      }
      const isLimitError = /limit|over.?contact|upgrade|plan|subscription/i.test(detail + (payload.title ?? ""));
      console.error(
        "[mailchimp] add subscriber failed",
        res.status,
        isLimitError ? "(Mailchimp plan/contact limit?)" : "",
        msg,
      );
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    console.error("[mailchimp] add subscriber threw", err);
    return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

function hashEmail(email: string): string {
  return createHash("md5").update(email.toLowerCase()).digest("hex");
}
