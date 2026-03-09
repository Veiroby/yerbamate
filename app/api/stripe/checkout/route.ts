import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  getDpdPickupPointById,
} from "@/lib/shipping/dpd";
import { stripe } from "@/lib/stripe";

function getSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const origin = request.headers.get("origin")?.trim();
  if (origin && process.env.NODE_ENV !== "production") return origin;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  // Prevent taking payments without a working webhook to mark orders as paid.
  if (!process.env.STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 },
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

  const email = formData.get("email")?.toString();
  const name = formData.get("name")?.toString();
  const addressLine1 = formData.get("addressLine1")?.toString();
  const addressLine2 = formData.get("addressLine2")?.toString();
  const city = formData.get("city")?.toString();
  const postalCode = formData.get("postalCode")?.toString();
  const country = (formData.get("country")?.toString() ?? "US").toUpperCase();
  const shippingOptionId =
    formData.get("shippingOptionId")?.toString() ?? "standard-flat";
  const dpdPickupPointId = formData.get("dpdPickupPointId")?.toString();
  const dpdPickupPointName = formData.get("dpdPickupPointName")?.toString();

  const isDpdParcelMachine = shippingOptionId === DPD_PARCEL_MACHINE_METHOD_ID;

  if (isDpdParcelMachine && !dpdPickupPointId) {
    return NextResponse.json(
      { error: "Please select a DPD parcel machine" },
      { status: 400 },
    );
  }

  if (!email || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!isDpdParcelMachine && (!addressLine1 || !city || !postalCode)) {
    return NextResponse.json(
      { error: "Missing required address fields" },
      { status: 400 },
    );
  }

  const destination = { country };

  const preliminarySubtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.unitPrice) * item.quantity;
  }, 0);

  const shipping = await calculateShippingForOrder(
    destination,
    { id: cart.id },
    shippingOptionId,
    preliminarySubtotal,
  );

  const validatedItems = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId
        ? await prisma.product.findUnique({
            where: { id: item.productId },
          })
        : null;

      if (!product || !product.active) {
        throw new Error("Product no longer available");
      }

      return {
        id: item.id,
        productId: product.id,
        name: product.name,
        currency: product.currency,
        unitPrice: product.price as unknown as number,
        quantity: item.quantity,
      };
    }),
  );

  const subtotal = validatedItems.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);

  const shippingAmount = shipping.amount ?? 0;
  const tax = 0;
  const total = subtotal + shippingAmount + tax;

  const currency = validatedItems[0]?.currency ?? "USD";

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
    const point = getDpdPickupPointById(country, dpdPickupPointId);
    if (!point) {
      return NextResponse.json(
        { error: "Invalid DPD pickup point" },
        { status: 400 },
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
      orderNumber: `ORD-${Date.now()}`,
      email,
      sessionId,
      status: "REQUIRES_PAYMENT",
      subtotal,
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

  await recordEvent("begin_checkout", {
    sessionId,
    payload: {
      orderId: order.id,
      value: total,
      currency,
      itemCount: validatedItems.length,
    },
  });

  const lineItems = validatedItems.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency,
      unit_amount: Math.round(item.unitPrice * 100),
      product_data: {
        name: item.name,
      },
    },
  }));

  if (shippingAmount > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.round(shippingAmount * 100),
        product_data: {
          name: shipping.option?.name ?? "Shipping",
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    metadata: {
      orderId: order.id,
    },
    success_url: `${getSiteOrigin(request)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteOrigin(request)}/cart`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(session.url, {
    status: 303,
  });
}

