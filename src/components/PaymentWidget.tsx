import { useState } from 'react';
import { Smartphone, CreditCard, Loader, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';

interface PaymentWidgetProps {
  transactionId: string;
  amount: number;
  buyerName?: string;
  onPaymentSuccess?: () => void;
}

type PaymentMethod = 'mpesa' | 'card' | 'all';

export function PaymentWidget({ transactionId, amount }: PaymentWidgetProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'redirecting' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('all');

  // Initialize Paystack payment
  const handlePaystackPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.initiatePaystackPayment({
        transactionId,
        email,
        metadata: { paymentMethod },
      });

      if (response.success && response.data) {
        const data = response.data as { authorizationUrl: string };
        setPaymentStatus('redirecting');
        
        // Redirect to Paystack checkout page
        window.location.href = data.authorizationUrl;
      } else {
        setError(response.error || 'Failed to initialize payment');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="font-bold text-lg text-foreground mb-4">Choose Payment Method</h3>

      {paymentStatus === 'idle' && (
        <>
          {/* Payment Method Selector */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition ${
                paymentMethod === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              <ExternalLink size={18} />
              <span className="text-sm font-medium">All Options</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('mpesa')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition ${
                paymentMethod === 'mpesa'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              <Smartphone size={18} />
              <span className="text-sm font-medium">M-Pesa</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition ${
                paymentMethod === 'card'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              <CreditCard size={18} />
              <span className="text-sm font-medium">Card</span>
            </button>
          </div>

          <form onSubmit={handlePaystackPayment} className="space-y-4">
            {/* Email - Required for Paystack */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Receipt will be sent to this email</p>
            </div>

            {/* Amount Display */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount:</p>
              <p className="text-2xl font-bold text-foreground">KES {amount.toLocaleString()}</p>
            </div>

            {/* Payment Method Info */}
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              {paymentMethod === 'all' && (
                <p>You'll be redirected to a secure page to complete payment via M-Pesa, Card, or Bank Transfer.</p>
              )}
              {paymentMethod === 'mpesa' && (
                <p>You'll be redirected to complete payment via M-Pesa mobile money.</p>
              )}
              {paymentMethod === 'card' && (
                <p>You'll be redirected to a secure page to enter your card details.</p>
              )}
            </div>

            {/* Accepted Payment Methods */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs text-muted-foreground">M-Pesa</span>
              <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs text-muted-foreground">Visa/Mastercard</span>
              <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs text-muted-foreground">Bank Transfer</span>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <ExternalLink size={20} />
                  Proceed to Payment
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-primary" />
              <span>Secure payment powered by Paystack</span>
            </div>
          </form>
        </>
      )}

      {paymentStatus === 'redirecting' && (
        <div className="text-center py-8">
          <div className="inline-block">
            <Loader size={40} className="text-primary animate-spin mb-4" />
          </div>
          <p className="text-foreground font-medium">Redirecting to payment page...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we redirect you to the secure payment page.
          </p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-primary font-bold">Payment Successful!</p>
          <p className="text-sm text-primary/80 mt-2">Transaction ID: {transactionId}</p>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-destructive font-bold">Payment Failed</p>
          {error && <p className="text-sm text-destructive/80 mt-1">{error}</p>}
          <button
            onClick={() => {
              setPaymentStatus('idle');
              setError(null);
            }}
            className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
