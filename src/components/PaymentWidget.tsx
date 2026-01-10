import { useState } from 'react';
import { Smartphone, CreditCard, Loader, ExternalLink } from 'lucide-react';
import { api } from '@/services/api';

interface PaymentWidgetProps {
  transactionId: string;
  amount: number;
  buyerName: string;
  onPaymentSuccess?: () => void;
}

type PaymentMethod = 'mpesa' | 'card' | 'hosted';

export function PaymentWidget({ transactionId, amount, onPaymentSuccess }: PaymentWidgetProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'redirecting' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('hosted');

  // Use IntaSend hosted checkout (recommended - supports M-Pesa, Cards, Bank)
  const handleHostedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.createIntaSendCheckout({
        transactionId,
        email,
        phone: phoneNumber || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as { checkoutUrl: string };
        setPaymentStatus('redirecting');
        
        // Redirect to IntaSend hosted checkout page
        window.location.href = data.checkoutUrl;
      } else {
        setError(response.error || 'Failed to create checkout');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Use IntaSend M-Pesa STK Push directly
  const handleMpesaStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.initiateIntaSendStkPush({
        transactionId,
        phoneNumber,
        email: email || undefined,
      });

      if (response.success && response.data) {
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus();
      } else {
        setError(response.error || 'Failed to initiate payment');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.checkIntaSendStatus(transactionId);

        const txData = response.data as { status: string };
        if (txData.status === 'PAID') {
          setPaymentStatus('success');
          clearInterval(pollInterval);
          onPaymentSuccess?.();
        } else if (txData.status === 'CANCELLED' || txData.status === 'FAILED') {
          setPaymentStatus('failed');
          clearInterval(pollInterval);
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (paymentMethod === 'hosted' || paymentMethod === 'card') {
      handleHostedCheckout(e);
    } else {
      handleMpesaStkPush(e);
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
              onClick={() => setPaymentMethod('hosted')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition ${
                paymentMethod === 'hosted'
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email - Required for all methods */}
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
            </div>

            {/* Phone - Required for M-Pesa, optional for others */}
            {paymentMethod === 'mpesa' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  M-Pesa Phone Number (254XXXXXXXXX)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547xxxxxxxx"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Amount Display */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount:</p>
              <p className="text-2xl font-bold text-foreground">KES {amount.toLocaleString()}</p>
            </div>

            {/* Payment Method Info */}
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              {paymentMethod === 'hosted' && (
                <p>You'll be redirected to a secure page to complete payment via M-Pesa, Card, or Bank.</p>
              )}
              {paymentMethod === 'mpesa' && (
                <p>You'll receive an M-Pesa PIN prompt on your phone to complete the payment.</p>
              )}
              {paymentMethod === 'card' && (
                <p>You'll be redirected to a secure page to enter your card details.</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'mpesa' ? (
                <>
                  <Smartphone size={20} />
                  Pay with M-Pesa
                </>
              ) : (
                <>
                  <ExternalLink size={20} />
                  Proceed to Payment
                </>
              )}
            </button>
          </form>
        </>
      )}

      {paymentStatus === 'pending' && (
        <div className="text-center py-8">
          <div className="inline-block">
            <Loader size={40} className="text-primary animate-spin mb-4" />
          </div>
          <p className="text-foreground font-medium">Waiting for payment confirmation</p>
          <p className="text-sm text-muted-foreground mt-2">
            {paymentMethod === 'mpesa' 
              ? `Check your phone (${phoneNumber}) for the M-Pesa PIN prompt`
              : 'Processing your payment...'}
          </p>
        </div>
      )}

      {paymentStatus === 'redirecting' && (
        <div className="text-center py-8">
          <div className="inline-block">
            <Loader size={40} className="text-primary animate-spin mb-4" />
          </div>
          <p className="text-foreground font-medium">Redirecting to payment page...</p>
          <p className="text-sm text-muted-foreground mt-2">
            If you're not redirected, <a href="#" className="text-primary underline">click here</a>
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
