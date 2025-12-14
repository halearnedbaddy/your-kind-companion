import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { SellerActions } from "@/components/SellerActions";
import { SellerDeliveryActions } from "@/components/SellerDeliveryActions";
import { BuyerConfirmActions } from "@/components/BuyerConfirmActions";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

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

// Demo data for preview
const DEMO_PAYMENT: PaymentDetails = {
  transaction_id: "demo-transaction",
  status: "ESCROWED",
  amount: 5000,
  currency: "KES",
  seller_contact: "+254712345678",
  seller_payout_contact: null,
  product_name: "iPhone 13 Pro Max",
  description: "Brand new, sealed in box. 256GB Sierra Blue.",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  escrowed_amount: 5000,
  delivered_at: null,
  delivery_proof_urls: null,
};

export function PaymentPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [data, setData] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayment() {
      // Use demo data for demo transaction
      if (transactionId === "demo-transaction") {
        setData(DEMO_PAYMENT);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/v1/payments/${transactionId}`);
        if (!res.ok) {
          setError("Payment link not found");
          setLoading(false);
          return;
        }
        const payment = await res.json();
        setData(payment);
      } catch {
        setError("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();
  }, [transactionId]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Payment link not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link may have expired or the transaction ID is invalid.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Payment for {data.product_name ?? "item"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure escrow via Paying-zee.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="space-y-2">
          <p className="text-card-foreground">
            <span className="font-medium">Amount:</span> {data.amount} {data.currency}
          </p>
          <p className="text-card-foreground">
            <span className="font-medium">Status:</span>{" "}
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {data.status}
            </span>
          </p>
          <p className="text-card-foreground">
            <span className="font-medium">Escrowed:</span> {data.escrowed_amount} {data.currency}
          </p>
          <p className="text-card-foreground">
            <span className="font-medium">Seller contact:</span> {data.seller_contact}
          </p>
          {data.seller_payout_contact && (
            <p className="text-card-foreground">
              <span className="font-medium">Payout contact:</span> {data.seller_payout_contact}
            </p>
          )}
          {data.description && (
            <p className="mt-3 text-card-foreground">
              <span className="font-medium">Description:</span> {data.description}
            </p>
          )}
          {data.expires_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Expires at: {new Date(data.expires_at).toLocaleString()}
            </p>
          )}
          {data.delivered_at && (
            <p className="text-xs text-muted-foreground">
              Marked delivered at: {new Date(data.delivered_at).toLocaleString()}
            </p>
          )}
          {data.delivery_proof_urls && data.delivery_proof_urls.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="font-medium">Delivery proof:</div>
              <ul className="mt-1 list-inside list-disc">
                {data.delivery_proof_urls.map((url) => (
                  <li key={url} className="truncate">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <SellerActions transactionId={data.transaction_id} initialStatus={data.status} />
      <SellerDeliveryActions transactionId={data.transaction_id} initialStatus={data.status} />
      <BuyerConfirmActions transactionId={data.transaction_id} initialStatus={data.status} />
    </main>
  );
}
