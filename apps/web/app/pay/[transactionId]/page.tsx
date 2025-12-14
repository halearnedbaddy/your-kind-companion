import type { Metadata } from "next";
import { SellerActions } from "./SellerActions";
import { SellerDeliveryActions } from "./SellerDeliveryActions";
import { BuyerConfirmActions } from "./BuyerConfirmActions";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface PaymentDetails {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  seller_contact: string;
  seller_payout_contact?: string | null;
  product_name: string | null;
  description: string | null;
  expires_at: string | null;
  escrowed_amount: number;
  delivered_at?: string | null;
  delivery_proof_urls?: string[] | null;
}

async function fetchPayment(transactionId: string): Promise<PaymentDetails | null> {
  const res = await fetch(`${API_BASE}/api/v1/payments/${transactionId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as PaymentDetails;
}

export const metadata: Metadata = {
  title: "Paying-zee | Payment",
};

interface PageProps {
  params: { transactionId: string };
}

export default async function PayPage({ params }: PageProps) {
  const data = await fetchPayment(params.transactionId);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <h1 className="text-xl font-semibold">Payment link not found</h1>
        <p className="mt-2 text-sm text-zinc-600">
          This link may have expired or the transaction ID is invalid.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Payment for {data.product_name ?? "item"}</h1>
        <p className="mt-2 text-sm text-zinc-600">Secure escrow via Paying-zee.</p>
      </header>

      <section className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm">
        <p>
          <span className="font-medium">Amount:</span> {data.amount} {data.currency}
        </p>
        <p>
          <span className="font-medium">Status:</span> {data.status}
        </p>
        <p>
          <span className="font-medium">Escrowed:</span> {data.escrowed_amount} {data.currency}
        </p>
        <p>
          <span className="font-medium">Seller contact:</span> {data.seller_contact}
        </p>
        {data.seller_payout_contact && (
          <p>
            <span className="font-medium">Payout contact:</span> {data.seller_payout_contact}
          </p>
        )}
        {data.description && (
          <p className="mt-2">
            <span className="font-medium">Description:</span> {data.description}
          </p>
        )}
        {data.expires_at && (
          <p className="mt-2 text-xs text-zinc-500">
            Expires at: {new Date(data.expires_at).toLocaleString()}
          </p>
        )}
        {data.delivered_at && (
          <p className="mt-1 text-xs text-zinc-500">
            Marked delivered at: {new Date(data.delivered_at).toLocaleString()}
          </p>
        )}
        {data.delivery_proof_urls && data.delivery_proof_urls.length > 0 && (
          <div className="mt-2 text-xs text-zinc-600">
            <div className="font-medium">Delivery proof:</div>
            <ul className="list-inside list-disc">
              {data.delivery_proof_urls.map((url) => (
                <li key={url} className="truncate">
                  <a href={url} target="_blank" rel="noreferrer" className="underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <SellerActions transactionId={data.transaction_id} initialStatus={data.status} />
      <SellerDeliveryActions transactionId={data.transaction_id} initialStatus={data.status} />
      <BuyerConfirmActions transactionId={data.transaction_id} initialStatus={data.status} />
    </main>
  );
}
