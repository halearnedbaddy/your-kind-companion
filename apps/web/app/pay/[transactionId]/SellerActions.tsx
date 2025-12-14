"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface Props {
  transactionId: string;
  initialStatus: string;
}

export function SellerActions({ transactionId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [payoutContact, setPayoutContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "ESCROWED") {
    return null;
  }

  async function handleAccept() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/payments/${transactionId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_payout_contact: payoutContact || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || `Request failed with ${res.status}`);
      }

      setStatus(body.status ?? "ACTIVE");
      setMessage("Order accepted. Funds remain in escrow until delivery is marked.");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded border border-zinc-200 bg-white p-4 text-sm">
      <h2 className="mb-2 font-semibold">Seller actions</h2>
      <p className="mb-3 text-zinc-600">
        Funds are in escrow. As the seller, confirm you accept this order and
        optionally provide the M-Pesa number to receive payout.
      </p>

      <label className="flex flex-col gap-1 text-xs">
        Payout contact (M-Pesa phone)
        <input
          type="text"
          value={payoutContact}
          onChange={(e) => setPayoutContact(e.target.value)}
          placeholder="e.g. +2547..."
          className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </label>

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center rounded bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {loading ? "Accepting..." : "Accept order"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-2 text-xs text-green-700" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
