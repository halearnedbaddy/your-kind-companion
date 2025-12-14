"use client";

import { FormEvent, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface CreatePaymentResponse {
  payment_link: string;
  transaction_id: string;
  status: string;
}

export default function CreateLinkPage() {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("KES");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [sellerContact, setSellerContact] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePaymentResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          product_name: productName,
          description: description || undefined,
          seller_contact: sellerContact,
          expiry_days: expiryDays,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with ${res.status}`);
      }

      const data = (await res.json()) as CreatePaymentResponse;
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Create payment link</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter payment details to generate a secure escrow link you can share with a
          seller.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Amount (KES)
          <input
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Currency
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Product name
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Seller contact (phone or handle)
          <input
            type="text"
            required
            value={sellerContact}
            onChange={(e) => setSellerContact(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Expiry (days)
          <input
            type="number"
            min={1}
            max={90}
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create link"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <h2 className="mb-2 font-semibold">Payment link created</h2>
          <p>
            <span className="font-medium">Transaction ID:</span> {result.transaction_id}
          </p>
          <p>
            <span className="font-medium">Status:</span> {result.status}
          </p>
          <p className="mt-2 break-words">
            <span className="font-medium">Link:</span> {result.payment_link}
          </p>
        </section>
      )}
    </main>
  );
}
