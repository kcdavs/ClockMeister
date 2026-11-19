// POST /api/checkout — runs on the server (Vercel), never in the browser.
// The browser sends the clock's colors; we check every color is a real
// filament, then ask Stripe for a Checkout page and send back its URL.
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { ZONES } from "@/data/zones";
import filaments from "@/data/filaments.json";

export async function POST(req: NextRequest) {
  // Secret key comes from an environment variable, never from the code.
  // No API version given on purpose: the library's default is used.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // 1. Validate colors: { zoneId: "#rrggbb" } for every selectable zone.
  const body = await req.json().catch(() => null);
  const colors = body?.colors ?? {};
  const metadata: Record<string, string> = {}; // zone id → filament (read by /success)
  const forOwner: Record<string, string> = {}; // "Escape wheel" → filament (shown on the payment)
  for (const zone of ZONES) {
    if (zone.id === "fixed") continue; // steel hardware, not chosen
    const hex = String(colors[zone.id] ?? "").toLowerCase();
    const filament = filaments.find((f) => f.hex.toLowerCase() === hex);
    if (!filament) {
      return NextResponse.json(
        { error: `Unknown color for ${zone.label}` },
        { status: 400 },
      );
    }
    metadata[zone.id] = filament.name;
    forOwner[zone.label] = filament.name;
  }

  // 2. Create the Checkout Session (settings from Stripe's Checkout Studio).
  const origin = req.nextUrl.origin; // localhost in dev, the real site live
  const session = await stripe.checkout.sessions.create({
    ui_mode: "hosted_page",
    mode: "payment", // one-time purchase (not a subscription)
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    metadata, // on the Checkout Session: the /success page reads this
    // Also on the payment itself, so the colors show under "Metadata" when you open an
    // order in Stripe → Transactions (session metadata isn't shown there).
    payment_intent_data: { metadata: forOwner },
    billing_address_collection: "auto",
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: false },
    allow_promotion_codes: true,
    submit_type: "auto",
    shipping_address_collection: { allowed_countries: ["US"] },
    integration_identifier: "hosted_web_0002",
    origin_context: "web",
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  // 3. The browser will redirect the customer to this Stripe page.
  return NextResponse.json({ url: session.url });
}
