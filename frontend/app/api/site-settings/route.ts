import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminWriteAccess } from "@/lib/admin-access";

const DEFAULT_SETTINGS = {
  popupEnabled: true,
  popupDelaySeconds: 10,
  popupTitle: "Join YerbaTea Community",
  popupDescription: "Subscribe to our newsletter and get an exclusive discount on your first order!",
  popupDiscountCode: null,
  popupDiscountPercent: 10,
};

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json(settings || DEFAULT_SETTINGS);
  } catch (error) {
    console.error("[site-settings] GET error:", error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminWriteAccess(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      popupEnabled,
      popupDelaySeconds,
      popupTitle,
      popupDescription,
      popupDiscountCode,
      popupDiscountPercent,
    } = body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        popupEnabled: popupEnabled ?? true,
        popupDelaySeconds: popupDelaySeconds ?? 10,
        popupTitle: popupTitle ?? DEFAULT_SETTINGS.popupTitle,
        popupDescription: popupDescription ?? DEFAULT_SETTINGS.popupDescription,
        popupDiscountCode: popupDiscountCode || null,
        popupDiscountPercent: popupDiscountPercent ?? 10,
      },
      create: {
        id: "default",
        popupEnabled: popupEnabled ?? true,
        popupDelaySeconds: popupDelaySeconds ?? 10,
        popupTitle: popupTitle ?? DEFAULT_SETTINGS.popupTitle,
        popupDescription: popupDescription ?? DEFAULT_SETTINGS.popupDescription,
        popupDiscountCode: popupDiscountCode || null,
        popupDiscountPercent: popupDiscountPercent ?? 10,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[site-settings] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
