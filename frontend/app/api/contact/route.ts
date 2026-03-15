import { NextResponse } from "next/server";
import { sendEmail, isEmailConfigured } from "@/lib/email";

const CONTACT_TO = "info@yerbatea.lv";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s ?? "").trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Contact form is not configured." },
      { status: 503 }
    );
  }

  let body: { name?: string; email?: string; message?: string; orderNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const orderNumber =
    typeof body.orderNumber === "string" ? body.orderNumber.trim() : undefined;

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Contact form submission</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
  <h1 style="font-size: 1.25rem; margin: 0 0 16px;">New contact form message</h1>
  <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
  ${orderNumber ? `<p style="margin: 0 0 8px;"><strong>Order number:</strong> ${escapeHtml(orderNumber)}</p>` : ""}
  <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
  <p style="margin: 0 0 16px; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
  <p style="margin: 0; color: #71717a; font-size: 0.875rem;">Reply to this email to respond to the customer.</p>
</body>
</html>`;

  const result = await sendEmail({
    to: CONTACT_TO,
    subject: `Contact form: ${escapeHtml(name)}`,
    html,
    replyTo: email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send message." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
