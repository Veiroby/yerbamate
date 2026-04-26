import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_LABELS } from "@/lib/email-template-registry";
import { writeAuditLog } from "@/lib/admin-audit";
import { isEmailConfigured, sendEmail } from "@/lib/email";

function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(variables)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

export async function GET() {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const templates = await prisma.emailTemplate.findMany({
    where: { key: { in: [...EMAIL_TEMPLATE_KEYS] } },
    orderBy: { key: "asc" },
  });

  const byKey = new Map(templates.map((t) => [t.key, t]));
  const result = EMAIL_TEMPLATE_KEYS.map((key) => {
    const t = byKey.get(key);
    return {
      key,
      name: t?.name ?? EMAIL_TEMPLATE_LABELS[key],
      subject: t?.subject ?? "",
      html: t?.html ?? "",
      designJson: t?.designJson ?? null,
      updatedAt: t?.updatedAt ?? null,
    };
  });

  return NextResponse.json({ templates: result });
}

export async function PUT(request: Request) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const key = String(body.key ?? "");
  if (!EMAIL_TEMPLATE_KEYS.includes(key as any)) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
  }

  const name = String(body.name ?? EMAIL_TEMPLATE_LABELS[key as keyof typeof EMAIL_TEMPLATE_LABELS]).trim();
  const subject = body.subject == null ? null : String(body.subject);
  const html = body.html == null ? null : String(body.html);
  const designJson = body.designJson ?? null;

  const saved = await prisma.emailTemplate.upsert({
    where: { key },
    update: {
      name: name || EMAIL_TEMPLATE_LABELS[key as keyof typeof EMAIL_TEMPLATE_LABELS],
      subject: subject || null,
      html: html || null,
      designJson: designJson ?? null,
    },
    create: {
      key,
      name: name || EMAIL_TEMPLATE_LABELS[key as keyof typeof EMAIL_TEMPLATE_LABELS],
      subject: subject || null,
      html: html || null,
      designJson: designJson ?? null,
    },
  });

  await writeAuditLog(g.user.id, "email_template.updated", "EmailTemplate", saved.id, {
    key: saved.key,
  });

  return NextResponse.json({ ok: true, template: saved });
}

export async function POST(request: Request) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const key = String(body.key ?? "");
  if (!EMAIL_TEMPLATE_KEYS.includes(key as any)) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
  }

  const html = String(body.html ?? "").trim();
  if (!html) return NextResponse.json({ error: "Template HTML is empty" }, { status: 400 });
  const subjectRaw = String(body.subject ?? "").trim() || `Template test: ${EMAIL_TEMPLATE_LABELS[key as keyof typeof EMAIL_TEMPLATE_LABELS]}`;
  const to = String(body.to ?? g.user.email).trim().toLowerCase();
  if (!to) return NextResponse.json({ error: "No recipient email" }, { status: 400 });

  const sampleVars: Record<string, string> = {
    orderNumber: "INV-TEST-1234",
    total: "€39.99",
    currency: "EUR",
    customerEmail: to,
    customerName: "Test Customer",
    cartTotal: "€55.00",
    cartUrl: `${process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000"}/cart`,
    resetUrl: `${process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000"}/account/reset-password?token=test`,
    siteUrl: process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000",
  };
  const renderedHtml = applyTemplateVariables(html, sampleVars);
  const renderedSubject = applyTemplateVariables(subjectRaw, sampleVars);

  const result = await sendEmail({
    to,
    subject: renderedSubject,
    html: renderedHtml,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send test email" }, { status: 500 });
  }

  await writeAuditLog(g.user.id, "email_template.test_sent", "EmailTemplate", null, {
    key,
    to,
  });
  return NextResponse.json({ ok: true, to });
}
