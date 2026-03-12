import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email not configured" }, { status: 400 });
    }

    const body = await request.json();
    const { name, subject, htmlContent, recipients, sendNow } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: "Name, subject, and content are required" }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
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
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
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

      return NextResponse.json({
        ...campaign,
        sentAt: new Date(),
        sentCount,
        message: `Campaign sent to ${sentCount} of ${recipients.length} recipients`,
      });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[email-campaigns] POST error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
