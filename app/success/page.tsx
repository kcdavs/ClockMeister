// The "thank you" page Stripe sends customers to after paying: /success?session_id=cs_...
// It runs on the server: it asks Stripe for that order (so the details can't be faked)
// and shows the customer what they bought and the filament for each part.
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Stripe from "stripe";
import SiteHeader from "@/components/SiteHeader";
import { ZONES } from "@/data/zones";
import filaments from "@/data/filaments.json";
import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Order confirmed · ClockMeister",
  robots: { index: false }, // keep order pages out of search engines
};

export default function SuccessPage({ searchParams }: PageProps<"/success">) {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        {/* Suspense: show a placeholder while the server waits for Stripe */}
        <Suspense fallback={<p className={`${styles.card} label`}>Loading your order…</p>}>
          <Order searchParams={searchParams} />
        </Suspense>
        <div className={styles.filler} aria-hidden="true" />
      </main>
    </>
  );
}

async function Order({ searchParams }: Pick<PageProps<"/success">, "searchParams">) {
  await connection(); // always runs per visitor (never pre-built): each order is different
  const { session_id } = await searchParams;
  const session = await getSession(session_id);

  if (!session) {
    return (
      <section className={styles.card}>
        <h1 className={styles.title}>Order not found.</h1>
        <p>
          We couldn&apos;t look up this order. If you paid, it went through: check your
          email for the receipt.
        </p>
        <Link href="/" className={`${styles.button} label`}>Back to ClockMeister →</Link>
      </section>
    );
  }

  const email = session.customer_details?.email;
  const name = session.collected_information?.shipping_details?.name;
  const paid = session.payment_status !== "unpaid"; // "paid" or "no_payment_required"

  return (
    <section className={styles.card}>
      <p className="label">Order confirmed</p>
      <h1 className={styles.title}>Thank you{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
      <p className={styles.lede}>
        {paid
          ? "Your clock is in the queue. Each one is printed and assembled by hand."
          : "Your payment is still processing. Your clock joins the queue once it clears."}
        {email && <> We&apos;ll be in touch at <strong>{email}</strong>.</>}
      </p>

      <h2 className="label">Your colors</h2>
      <ul className={styles.colors}>
        {ZONES.filter((z) => session.metadata?.[z.id]).map((zone) => {
          const filamentName = session.metadata![zone.id];
          const hex = filaments.find((f) => f.name === filamentName)?.hex;
          return (
            <li key={zone.id}>
              <span className={styles.swatch} style={{ background: hex }} aria-hidden="true" />
              <span>{zone.label}</span>
              <span className={styles.filament}>{filamentName}</span>
            </li>
          );
        })}
      </ul>

      <Link href="/" className={`${styles.button} label`}>Back to ClockMeister →</Link>
    </section>
  );
}

// Ask Stripe for the Checkout Session. Returns null for a missing or made-up ID.
async function getSession(id: string | string[] | undefined) {
  if (typeof id !== "string" || !id.startsWith("cs_")) return null;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    return await stripe.checkout.sessions.retrieve(id);
  } catch {
    return null;
  }
}
