import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black">
            Paying-zee
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-zinc-600">
            Secure escrow platform for safe transactions. Protect your payments with our
            trusted escrow service.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
          <Link
            href="/create-link"
            className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-900 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-black">Create Payment Link</h2>
            <p className="text-sm text-zinc-600">
              Generate a secure payment link to share with sellers. Funds are held in escrow
              until delivery is confirmed.
            </p>
            <span className="mt-2 text-sm font-medium text-zinc-900">Get started →</span>
          </Link>

          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-xl font-semibold text-black">How It Works</h2>
            <ol className="flex flex-col gap-3 text-sm text-zinc-600">
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-900">1.</span>
                <span>Create a payment link with transaction details</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-900">2.</span>
                <span>Buyer pays and funds are held in escrow</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-900">3.</span>
                <span>Seller delivers and marks as complete</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-900">4.</span>
                <span>Buyer confirms receipt and seller gets paid</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 text-center text-sm text-zinc-500">
          <p>Secure • Fast • Trusted</p>
          <p className="text-xs">
            All transactions are protected by our escrow system and dispute resolution process.
          </p>
        </div>
      </main>
    </div>
  );
}
