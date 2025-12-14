"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface Props {
  transactionId: string;
  initialStatus: string;
}

export function SellerDeliveryActions({ transactionId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "ACTIVE" && status !== "DELIVERED") {
    return null;
  }

  async function handleMarkDelivered() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const urls = evidenceUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await fetch(
        `${API_BASE}/api/v1/payments/${transactionId}/mark-delivered`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evidence_urls: urls.length ? urls : undefined }),
        },
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || `Request failed with ${res.status}`);
      }

      setStatus(body.status ?? "DELIVERED");
      setMessage("Marked as delivered. Buyer will be asked to confirm, or funds will auto-release later.");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded border border-zinc-200 bg-white p-4 text-sm">
      <h2 className="mb-2 font-semibold">Delivery</h2>
      <p className="mb-3 text-zinc-600">
        Once you have delivered the item/service, mark it as delivered. Optionally,
        provide links to proof (e.g., image URLs). Uploads will later be handled via
        secure storage.
      </p>

      <label className="flex flex-col gap-1 text-xs">
        Evidence URLs (comma-separated)
        <textarea
          value={evidenceUrls}
          onChange={(e) => setEvidenceUrls(e.target.value)}
          placeholder="https://... , https://..."
          className="min-h-[60px] rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </label>

      <button
        type="button"
        onClick={handleMarkDelivered}
        disabled={loading || status === "DELIVERED"}
        className="mt-3 inline-flex items-center justify-center rounded bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {status === "DELIVERED"
          ? "Already marked delivered"
          : loading
          ? "Saving..."
          : "Mark delivered"}
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
