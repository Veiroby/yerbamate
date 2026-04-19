import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export async function GET() {
  try {
    const g = await adminApiGuard(false);
    if (!g.ok) return g.response;

    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("[email-campaigns] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const g = await adminApiGuard(true);
    if (!g.ok) return g.response;

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email not configured" }, { status: 400 });
    }

    const body = await request.json();
    const { name, subject, htmlContent, recipients, sendNow, recipientPreset } = body as {
      name?: string;
      subject?: string;
      htmlContent?: string;
      recipients?: string[];
      sendNow?: boolean;
      recipientPreset?: "subscribers" | "users" | "all";
    };

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: "Name, subject, and content are required" }, { status: 400 });
    }

    let toSend: string[] = [];
    if (recipientPreset === "subscribers") {
      const rows = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
      toSend = rows.map((r) => r.email);
    } else if (recipientPreset === "users") {
      const rows = await prisma.user.findMany({ select: { email: true } });
      toSend = rows.map((r) => r.email);
    } else if (recipientPreset === "all") {
      const [subs, users] = await Promise.all([
        prisma.newsletterSubscriber.findMany({ select: { email: true } }),
        prisma.user.findMany({ select: { email: true } }),
      ]);
      toSend = Array.from(new Set([...subs.map((s) => s.email), ...users.map((u) => u.email)]));
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      toSend = recipients;
    } else {
      return NextResponse.json(
        { error: "Select recipients or choose a preset (subscribers, users, or all)" },
        { status: 400 },
      );
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        htmlContent,
      },
    });

    if (sendNow) {
      let sentCount = 0;
      const batchSize = 10;

      for (let i = 0; i < toSend.length; i += batchSize) {
        const batch = toSend.slice(i, i + batchSize);
        const promises = batch.map(async (email: string) => {
          try {
            const result = await sendEmail({
              to: email,
              subject,
              html: htmlContent,
            });
            if (result.ok) sentCount++;
          } catch (err) {
            console.error(`[email-campaigns] Failed to send to ${email}:`, err);
          }
        });
        await Promise.all(promises);
      }

      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          sentAt: new Date(),
          sentCount,
        },
      });

      await writeAuditLog(g.user.id, "email_campaign.sent", "EmailCampaign", campaign.id, {
        sentCount,
        recipientCount: toSend.length,
      });

      return NextResponse.json({
        ...campaign,
        sentAt: new Date(),
        sentCount,
        message: `Campaign sent to ${sentCount} of ${toSend.length} recipients`,
      });
    }

    await writeAuditLog(g.user.id, "email_campaign.created", "EmailCampaign", campaign.id, {
      name: campaign.name,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[email-campaigns] POST error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
