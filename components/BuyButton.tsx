"use client";

// "Buy" sends the clock's current colors to our server function (app/api/checkout/route.ts),
// which checks them and returns a Stripe Checkout link; then we go to that Stripe page.

import { useState } from "react";
import { useClockColors } from "./ClockColors";
import styles from "./BuyButton.module.css";

export default function BuyButton() {
  const { colors } = useClockColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url; // off to Stripe (busy stays on while the page changes)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className={styles.buy}>
      <button className={`${styles.button} label`} onClick={buy} disabled={busy}>
        {busy ? "Opening checkout…" : "Buy this clock · $350 →"}
      </button>
      {error && <p className={styles.error} role="alert">{error}. Please try again.</p>}
    </div>
  );
}
