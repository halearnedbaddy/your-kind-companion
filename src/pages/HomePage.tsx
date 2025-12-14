import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Paying-zee
        </h1>
        <p className="text-lg text-muted-foreground">
          Secure escrow platform for safe transactions
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
          How it works
        </h2>
        <div className="space-y-4 text-left text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              1
            </span>
            <p>Seller creates a payment link with item details and price</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              2
            </span>
            <p>Buyer pays via M-Pesa – funds are held in escrow</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              3
            </span>
            <p>Seller delivers the item and marks it as delivered</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              4
            </span>
            <p>Buyer confirms receipt – funds are released to seller</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/pay/demo-transaction"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View Demo Payment
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Protected by escrow. Safe for buyers and sellers.
      </p>
    </main>
  );
}
