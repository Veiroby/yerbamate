import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  resolveDpdPickupPointById,
} from "@/lib/shipping/dpd";
import {
  LOCAL_PICKUP_LOCATION,
  LOCAL_PICKUP_METHOD_ID,
} from "@/lib/shipping/local-pickup";
import { allocateNextInvoiceOrderNumber } from "@/lib/invoice-number";
import {
  isMaksekeskusConfigured,
  createTransaction,
  getRedirectUrl,
} from "@/lib/maksekeskus";
import { calculateBundleSavings } from "@/lib/pricing/bundles";
import { getRequestOrigin } from "@/lib/request-origin";
import { makseCustomerLocaleForCountry } from "@/lib/maksekeskus-baltic";
import { getCurrentUser } from "@/lib/auth";
import {
  markRecoveryForOrderConversion,
  syncRecoveryIdentityFromCart,
} from "@/lib/abandoned-cart";

function getSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return getRequestOrigin(request);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(request: Request) {
  if (!isMaksekeskusConfigured()) {
    return NextResponse.json(
      { error: "Maksekeskus is not configured" },
      { status: 500 }
    );
  }

  const sessionId = (await cookies()).get("cart_session_id")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const formData = await request.formData();
  const currentUser = await getCurrentUser();

  const email = formData.get("email")?.toString();
  const name = formData.get("name")?.toString();
  const addressLine1 = formData.get("addressLine1")?.toString();
  const addressLine2 = formData.get("addressLine2")?.toString();
  const city = formData.get("city")?.toString();
  const postalCode = formData.get("postalCode")?.toString();
  const country = (formData.get("country")?.toString() ?? "LV").toUpperCase();
  const shippingOptionId =
    formData.get("shippingOptionId")?.toString().trim() || "standard-flat";
  const dpdPickupPointId = formData.get("dpdPickupPointId")?.toString();
  const dpdPickupPointName = formData.get("dpdPickupPointName")?.toString();

  const customerTypeRaw = formData.get("customerType")?.toString();
  const customerType: "INDIVIDUAL" | "BUSINESS" =
    customerTypeRaw === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL";
  const companyName = formData.get("companyName")?.toString() || null;
  const companyAddress = formData.get("companyAddress")?.toString() || null;
  const vatNumber = formData.get("vatNumber")?.toString() || null;
  const phone = formData.get("phone")?.toString() || null;
  const discountCodeInput = formData.get("discountCode")?.toString() || null;
  const maksekeskusMethodUrl = formData.get("maksekeskusMethodUrl")?.toString() || "";
  const localeRaw = formData.get("locale")?.toString();
  const locale = localeRaw === "lv" || localeRaw === "en" ? localeRaw : "";
  const pathPrefix = locale ? `/${locale}` : "";
  const isLv = locale === "lv";

  const isDpdParcelMachine = shippingOptionId === DPD_PARCEL_MACHINE_METHOD_ID;
  const isLocalPickup = shippingOptionId === LOCAL_PICKUP_METHOD_ID;

  if (isDpdParcelMachine && !dpdPickupPointId) {
    return NextResponse.json(
      { error: isLv ? "Lūdzu, izvēlieties DPD pakomātu" : "Please select a DPD parcel machine" },
      { status: 400 }
    );
  }

  if (!email || !name) {
    return NextResponse.json(
      { error: isLv ? "Trūkst obligāto lauku" : "Missing required fields" },
      { status: 400 }
    );
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      email: email.trim().toLowerCase(),
      userId: cart.userId ?? currentUser?.id ?? undefined,
    },
  });
  await syncRecoveryIdentityFromCart(cart.id);

  if (customerType === "BUSINESS") {
    if (!companyName || !companyAddress || !vatNumber || !phone) {
      return NextResponse.json(
        {
          error: isLv
            ? "Trūkst obligāto biznesa (uzņēmuma) lauku"
            : "Missing required business fields",
        },
        { status: 400 }
      );
    }
  }

  if (!isDpdParcelMachine && !isLocalPickup && (!addressLine1 || !city || !postalCode)) {
    return NextResponse.json(
      { error: isLv ? "Trūkst obligāto adreses lauku" : "Missing required address fields" },
      { status: 400 }
    );
  }

  const destination = { country };

  const validatedItems = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId
        ? await prisma.product.findUnique({
            where: { id: item.productId },
            include: { bundleOffers: { where: { active: true } } },
          })
        : null;

      if (!product || !product.active || product.archived) {
        throw new Error("Product no longer available");
      }

      return {
        id: item.id,
        productId: product.id,
        name: product.name,
        currency: product.currency,
        unitPrice: product.price as unknown as number,
        quantity: item.quantity,
        bundleOffers: product.bundleOffers.map((b) => ({
          minQuantity: b.minQuantity,
          discountPercent: b.discountPercent,
        })),
      };
    })
  );

  const subtotal = validatedItems.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);

  let discountCode: string | null = null;
  let discountAmount: number | null = null;

  if (discountCodeInput) {
    const discount = await prisma.discountCode.findUnique({
      where: { code: discountCodeInput.toUpperCase() },
    });

    if (discount && discount.active) {
      const isExpired =
        discount.expiresAt && new Date(discount.expiresAt) < new Date();
      const isMaxUsed =
        discount.maxUses && discount.usedCount >= discount.maxUses;
      const meetsMinOrder =
        !discount.minOrderValue || subtotal >= Number(discount.minOrderValue);

      if (!isExpired && !isMaxUsed && meetsMinOrder) {
        discountCode = discount.code;
        if (discount.type === "PERCENTAGE") {
          discountAmount =
            Math.round((subtotal * Number(discount.value)) / 100 * 100) / 100;
        } else {
          discountAmount = Math.min(Number(discount.value), subtotal);
        }
      }
    }
  }

  const globalBundles = await prisma.bundleOffer.findMany({
    where: { active: true, productId: null },
    orderBy: { discountPercent: "desc" },
    select: { minQuantity: true, discountPercent: true },
  });

  const bundleSavings = calculateBundleSavings(
    validatedItems.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: { bundleOffers: item.bundleOffers },
    })),
    globalBundles,
  );

  const discountedSubtotalForShipping = Math.max(
    0,
    subtotal - bundleSavings - (discountAmount ?? 0),
  );

  const shipping = await calculateShippingForOrder(
    destination,
    { id: cart.id },
    shippingOptionId,
    discountedSubtotalForShipping,
    locale === "lv" || locale === "en" ? locale : undefined,
  );

  if (!shipping.option) {
    if (shipping.invalidSelection) {
      return NextResponse.json(
        {
          error: isLv
            ? "Nederīga piegādes izvēle. Lūdzu, atsvaidziniet lapu un mēģiniet vēlreiz."
            : "Invalid shipping selection. Please refresh the page and try again.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: isLv
          ? "Diemžēl mēs nepiegādājam uz jūsu valsti."
          : "Unfortunately we don't ship to your country.",
      },
      { status: 400 },
    );
  }

  const shippingAmount = shipping.amount ?? 0;
  const tax = 0;

  const total =
    Math.max(0, subtotal - bundleSavings - (discountAmount ?? 0)) +
    shippingAmount +
    tax;

  const currency = validatedItems[0]?.currency ?? "EUR";

  let shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
    dpdPickupPointId?: string;
    dpdPickupPointName?: string;
  };

  if (isDpdParcelMachine && dpdPickupPointId) {
    const point = await resolveDpdPickupPointById(country, dpdPickupPointId);
    if (!point) {
      return NextResponse.json(
        {
          error: isLv ? "Nederīgs DPD piegādes punkts" : "Invalid DPD pickup point",
        },
        { status: 400 }
      );
    }
    shippingAddress = {
      name,
      line1: `${point.name} — ${point.address}`,
      line2: undefined,
      city: point.city,
      postalCode: point.postalCode,
      country: point.country,
      dpdPickupPointId: point.id,
      dpdPickupPointName: dpdPickupPointName ?? point.name,
    };
  } else if (isLocalPickup) {
    shippingAddress = {
      name,
      line1: isLv
        ? `Saņemšana uz vietas — ${LOCAL_PICKUP_LOCATION.line1}`
        : `Local pick-up — ${LOCAL_PICKUP_LOCATION.line1}`,
      line2: undefined,
      city: LOCAL_PICKUP_LOCATION.city,
      postalCode: LOCAL_PICKUP_LOCATION.postalCode,
      country: LOCAL_PICKUP_LOCATION.country,
    };
  } else {
    shippingAddress = {
      name,
      line1: addressLine1!,
      line2: addressLine2 ?? undefined,
      city: city!,
      postalCode: postalCode!,
      country,
    };
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: await allocateNextInvoiceOrderNumber(),
      email,
      sessionId,
      status: "REQUIRES_PAYMENT",
      customerType,
      paymentMethod: "MAKSEKESKUS",
      companyName,
      companyAddress,
      vatNumber,
      phone,
      subtotal,
      discountCode,
      discountAmount:
        (discountAmount ?? 0) + (bundleSavings > 0 ? bundleSavings : 0) || null,
      shippingCost: shippingAmount,
      tax,
      total,
      currency,
      shippingAddress,
      items: {
        create: validatedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      },
    },
  });
  await markRecoveryForOrderConversion(sessionId, email.trim().toLowerCase());

  if (discountCode) {
    await prisma.discountCode.update({
      where: { code: discountCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  await recordEvent("begin_checkout", {
    sessionId,
    payload: {
      orderId: order.id,
      value: total,
      currency,
      itemCount: validatedItems.length,
      paymentMethod: "MAKSEKESKUS",
    },
  });

  const origin = getSiteOrigin(request);
  const result = await createTransaction({
    amount: total,
    currency,
    ip: getClientIp(request),
    return_url: `${origin}${pathPrefix}/checkout/success?provider=maksekeskus&orderNumber=${encodeURIComponent(order.orderNumber)}`,
    cancel_url: `${origin}${pathPrefix}/cart`,
    notification_url: `${origin}/api/checkout/maksekeskus/notify`,
    reference: order.orderNumber,
    merchant_data: order.id,
    customer: {
      country: country.toUpperCase(),
      locale: makseCustomerLocaleForCountry(country.toUpperCase(), locale || "en"),
    },
  });

  if (!result.ok) {
    console.error("[maksekeskus] createTransaction failed:", result.error);
    return NextResponse.json(
      { error: result.error ?? "Payment provider error" },
      { status: 500 }
    );
  }

  const buildDirectMethodUrl = (template: string, transactionId: string): string | null => {
    const raw = (template ?? "").trim();
    if (!raw) return null;
    try {
      const u = new URL(raw);
      u.searchParams.set("trx", transactionId);
      return u.toString();
    } catch {
      // If template isn't a full URL, don't risk a bad redirect.
      return null;
    }
  };

  const redirectUrl =
    maksekeskusMethodUrl
      ? buildDirectMethodUrl(maksekeskusMethodUrl, result.transaction.id)
      : null;

  const finalRedirectUrl = redirectUrl ?? getRedirectUrl(result.transaction);
  if (!finalRedirectUrl) {
    console.error("[maksekeskus] No redirect URL in response");
    return NextResponse.json(
      { error: "Invalid response from payment provider" },
      { status: 500 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { maksekeskusTransactionId: result.transaction.id },
  });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ url: finalRedirectUrl });
  }
  return NextResponse.redirect(finalRedirectUrl, { status: 303 });
}
