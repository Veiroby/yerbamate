/**
 * Shared HTML layout and helpers for Resend transactional and marketing emails.
 * Table-based outer structure improves rendering in common email clients.
 */

const BRAND_PRIMARY = "#0d9488";
const BRAND_DEEP = "#134e4a";
const BRAND_ACCENT = "#344e41";
const BG_PAGE = "#f4f1ec";
const TEXT_MUTED = "#57534e";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

export function resolveEmailAssetUrl(url: string | null | undefined, siteOrigin: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = siteOrigin.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

type BrandedLayoutOptions = {
  siteOrigin: string;
  /** Shown in inbox preview (hidden in body) */
  previewText: string;
  /** Optional eyebrow above title */
  eyebrow?: string;
  title: string;
  /** Main inner HTML (trusted / pre-escaped) */
  innerHtml: string;
  /** Primary CTA */
  primaryCta?: { label: string; href: string };
  /** Extra footer line above the standard legal */
  footerNote?: string;
  /** Set false to omit "You subscribed…" line (order emails) */
  showSubscriptionFooter?: boolean;
};

/**
 * YerbaTea branded shell: header bar, card body, footer with store link.
 */
export function brandedEmailLayout(opts: BrandedLayoutOptions): string {
  const {
    siteOrigin,
    previewText,
    eyebrow,
    title,
    innerHtml,
    primaryCta,
    footerNote,
    showSubscriptionFooter = false,
  } = opts;

  const safeOrigin = escapeHtml(siteOrigin);
  const pre = escapeHtml(previewText.slice(0, 140));

  const ctaBlock = primaryCta
    ? `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="border-radius:10px;background:${BRAND_PRIMARY};">
        <a href="${escapeHtml(primaryCta.href)}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${escapeHtml(primaryCta.label)}
        </a>
      </td>
    </tr>
  </table>`
    : "";

  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${TEXT_MUTED};">
        ${escapeHtml(eyebrow)}
      </p>`
    : "";

  const footerSubscription = showSubscriptionFooter
    ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.6;color:${TEXT_MUTED};">
        You received this because you subscribed to YerbaTea updates.
      </p>`
    : "";

  const footerNoteHtml = footerNote
    ? `<p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:${TEXT_MUTED};">${footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG_PAGE};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BG_PAGE};opacity:0;">
    ${pre}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(20,20,20,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND_DEEP} 0%, ${BRAND_ACCENT} 48%, ${BRAND_PRIMARY} 100%);padding:28px 32px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#fafaf9;">
                YerbaTea
              </p>
              <p style="margin:6px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:rgba(250,250,249,0.88);">
                Premium yerba mate &amp; accessories
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1917;">
              ${eyebrowHtml}
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:650;line-height:1.25;letter-spacing:-0.02em;color:#0c0a09;">
                ${escapeHtml(title)}
              </h1>
              ${innerHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.65;color:${TEXT_MUTED};">
              ${footerNoteHtml}
              ${footerSubscription}
              <p style="margin:0 0 8px;font-size:12px;color:${TEXT_MUTED};">
                <a href="${safeOrigin}" style="color:${BRAND_PRIMARY};font-weight:600;text-decoration:none;">Visit the shop</a>
                <span style="color:#d6d3d1;"> · </span>
                <a href="${safeOrigin}/products" style="color:${TEXT_MUTED};text-decoration:underline;">All products</a>
              </p>
              <p style="margin:0;font-size:11px;color:#a8a29e;">
                © ${new Date().getFullYear()} YerbaTea. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Wraps free-form campaign HTML (admin-composed) in the same brand shell. */
export function wrapCampaignContentHtml(options: {
  siteOrigin: string;
  previewText: string;
  title: string;
  bodyHtml: string;
}): string {
  const inner = `
  <div style="font-size:15px;line-height:1.65;color:#44403c;">
    ${options.bodyHtml}
  </div>`;
  return brandedEmailLayout({
    siteOrigin: options.siteOrigin,
    previewText: options.previewText,
    title: options.title,
    innerHtml: inner,
    showSubscriptionFooter: true,
  });
}

export function renderNewsletterWelcomeHtml(options: {
  discountCode: string;
  siteOrigin: string;
}): string {
  const { discountCode, siteOrigin } = options;
  const shopUrl = `${siteOrigin.replace(/\/$/, "")}/products`;

  const inner = `
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#44403c;">
    Thank you for joining our community. Here is your exclusive discount code:
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:14px;background:#f0fdfa;border:2px dashed ${BRAND_PRIMARY};">
    <tr>
      <td align="center" style="padding:22px 16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#5b7a78;">
          Your 10% code
        </p>
        <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:26px;font-weight:700;letter-spacing:0.12em;color:${BRAND_PRIMARY};">
          ${escapeHtml(discountCode)}
        </p>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:#44403c;">
    Use it at checkout for <strong>10% off</strong> your first order. Valid for 30 days, one use.
  </p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
    You will be first to hear about new arrivals, offers, and brewing tips.
  </p>`;

  return brandedEmailLayout({
    siteOrigin,
    previewText: "Your 10% welcome code is inside",
    title: "Welcome to YerbaTea",
    innerHtml: inner,
    primaryCta: { label: "Shop the collection", href: shopUrl },
    showSubscriptionFooter: true,
  });
}

export type NewProductRow = {
  name: string;
  slug: string;
  /** Formatted price with currency symbol */
  priceFormatted: string;
  imageUrl: string | null;
};

export function renderNewArrivalsEmailHtml(options: {
  siteOrigin: string;
  products: NewProductRow[];
  days: number;
}): string {
  const { siteOrigin, products, days } = options;
  const base = siteOrigin.replace(/\/$/, "");

  const rows = products
    .map((p) => {
      const url = `${base}/products/${encodeURIComponent(p.slug)}`;
      const img = p.imageUrl
        ? `<img src="${escapeHtml(p.imageUrl)}" alt="" width="120" height="120" style="display:block;width:120px;height:120px;object-fit:cover;border-radius:10px;border:1px solid #e7e5e4;">`
        : `<div style="width:120px;height:120px;border-radius:10px;background:#f5f5f4;border:1px solid #e7e5e4;"></div>`;

      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-bottom:1px solid #f5f5f4;padding-bottom:20px;">
        <tr>
          <td width="132" valign="top" style="padding-right:12px;">${img}</td>
          <td valign="top" style="font-family:system-ui,-apple-system,sans-serif;">
            <p style="margin:0 0 6px;font-size:16px;font-weight:650;color:#1c1917;">
              <a href="${escapeHtml(url)}" style="color:#1c1917;text-decoration:none;">${escapeHtml(p.name)}</a>
            </p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${BRAND_PRIMARY};">
              ${escapeHtml(p.priceFormatted)}
            </p>
            <a href="${escapeHtml(url)}" style="display:inline-block;font-size:13px;font-weight:600;color:${BRAND_PRIMARY};text-decoration:none;">
              View product →
            </a>
          </td>
        </tr>
      </table>`;
    })
    .join("");

  const inner = `
  <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#44403c;">
    Here is what landed in the shop over the last <strong>${days}</strong> days. Brew something new.
  </p>
  ${rows}`;

  return brandedEmailLayout({
    siteOrigin,
    previewText: `${products.length} new products at YerbaTea`,
    eyebrow: "Fresh arrivals",
    title: "New in store",
    innerHtml: inner,
    primaryCta: { label: "Browse all products", href: `${base}/products` },
    showSubscriptionFooter: true,
  });
}
