# Stripe integration — to do

Hosted Stripe Checkout: the customer clicks Buy, is sent to a Stripe-hosted
payment page, then comes back to the site.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [app/api/checkout/route.ts](app/api/checkout/route.ts)
- [.env.local](.env.local) (gitignored, local only)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| STRIPE_PRICE_ID | sandbox `price_1UdaLT…`; live `price_1UdcMcRt2mhEdHy0xVnLMA8O` ($350) | Live ID goes in Vercel Production; Preview keeps the sandbox ID. |
| success_url | `{site}/success?session_id={CHECKOUT_SESSION_ID}` | Done: `app/success/page.tsx` looks the order up in Stripe and shows the colors. |
| cancel_url | `{site}/` | Already real (back to the home page). Change only if you want a different page. |
| mode | `payment` | Correct for a one-time purchase. Only change for subscriptions. |
| STRIPE_SECRET_KEY | set locally (`sk_test_`) | Also add it in Vercel (below). Live key `sk_live_` at launch. |

`{site}` is taken from the request automatically: `http://localhost:3000` in
development, `https://www.clockmeisterclocks.com` when live.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [app/api/checkout/route.ts](app/api/checkout/route.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (Stripe SDK 23.2.0, so not the old `hosted`) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: true }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `true` |
| submit_type | `auto` |
| shipping_address_collection | `{ allowed_countries: ["US"] }` |
| consent_collection | `{ promotions: "auto" }` |
| consent_collection | **Removed for now** (see below) |
| integration_identifier | `hosted_web_0002` |
| origin_context | `web` |

`consent_collection: { promotions: "auto" }` (the "email me about
promotions" checkbox) was configured, but Stripe refuses it until the
account accepts its terms at Settings → Checkout, and the acceptance was done
in the live account, not the sandbox. To add it back: accept the terms in
the account whose key the site uses, then put that line back in the route.

`payment_method_collection: "always"` was configured too, but Stripe only
allows it for subscriptions, so it is left out (mode is `payment`).

## Setup

1. **Keys.** In Stripe, stay in *Test mode*. Copy the secret key into
   `.env.local` (`STRIPE_SECRET_KEY=sk_test_...`). Restart `npm run dev`.
   The publishable key (`pk_...`) isn't needed: hosted Checkout is a redirect.
2. **Vercel.** Project → Settings → Environment Variables → add
   `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` (sandbox values for now; live
   values at launch), then redeploy. Without them the live site's Buy
   button shows an error.
3. **Dependency.** `stripe` (23.2.0) is already in `package.json`.

## New files

- `app/api/checkout/route.ts`: the server function (`POST /api/checkout`)
- `components/BuyButton.tsx` + `.module.css`: the Buy button
- `app/success/page.tsx` + `success.module.css`: the after-payment page
- `.env.local`: secret key, local only (gitignored)
- `STRIPE_INTEGRATION_TODO.md`: this file

## How it works

1. The browser sends `{ colors: { zoneId: "#hex", ... } }` to `POST /api/checkout`.
2. The server checks every selectable zone has a real Bambu filament color
   (`data/filaments.json`). Otherwise it returns 400, so made-up colors can't be ordered.
3. It creates a Checkout Session with the price set **on the server**, so
   the browser can't change it. Each zone's filament name is attached as
   `metadata` and shows on the payment in the Stripe Dashboard.
4. It returns `{ url }`; the browser redirects there. After paying, Stripe
   sends the customer to `success_url`.

## Testing

- Test card: `4242 4242 4242 4242`, any future date, any CVC, any ZIP.
- Declined: `4000 0000 0000 0002`. 3-D Secure: `4000 0027 6000 3184`.
- More: https://docs.stripe.com/testing
- Test-mode payments are fake. Nothing is charged until you switch to live keys.

## Next steps

- [x] Create the product + Price in Stripe (sandbox)
- [x] "Buy" button (`components/BuyButton.tsx`, under the presets) — tested,
      lands on Stripe Checkout
- [x] Live product renamed "3D Printed Clock" (was "Mondrian Clock")
- [x] `/success` page: thank-you, customer email, colors from the order
- [ ] Fulfillment: read the colors from each payment's metadata (Dashboard,
      or a `checkout.session.completed` webhook later); depends on the
      print-service vs. owner-approval decision
- [ ] Shipping cost and sales tax (currently off)
- [ ] Before going live: business support email (e.g. orders@clockmeisterclocks.com
      forwarding to you) and phone (e.g. Google Voice) in Stripe → Settings →
      Business → Public details, so customers never see personal contact info
- [ ] Stripe (live) → Settings → Customer emails: turn on "Successful payments" receipts
- [x] Live keys in Vercel Production (2026-11-19); live checkout verified (`cs_live_`). Preview stays on sandbox.
- [x] Owner test purchase in live mode with a $300-off one-use code (`OWNERTEST`); refund it in the Dashboard

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
