import { useState } from 'react';
import { XIcon, CreditCardIcon, LoaderIcon, ShieldIcon, ArrowRightIcon } from '@/components/icons';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function TopUpModal({ isOpen, onClose, userEmail }: TopUpModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topUpAmount = Number(amount);
    if (!topUpAmount || topUpAmount < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum top-up amount is KES 100',
        variant: 'destructive',
      });
      return;
    }

    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await api.initiatePaystackTopup(topUpAmount, email);
      
      if (response.success && response.data) {
        const data = response.data as { authorizationUrl: string };
        // Redirect to Paystack checkout
        window.location.href = data.authorizationUrl;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to initialize top-up',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to initialize top-up. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
        >
          <XIcon size={24} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
            <CreditCardIcon size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Top Up Wallet</h2>
          <p className="text-gray-500 text-sm mt-1">Add funds securely to your SWIFTLINE wallet.</p>
        </div>

        <form onSubmit={handleTopUp} className="space-y-4">
          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    amount === amt.toString()
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">KES</span>
                <input
                  type="number"
                  required
                  min="100"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition font-bold text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 transition text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !amount}
            className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isProcessing ? (
              <LoaderIcon size={18} className="animate-spin" />
            ) : (
              <>
                Pay KES {amount ? Number(amount).toLocaleString() : '0'}
                <ArrowRightIcon size={18} />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
            <ShieldIcon size={12} className="text-emerald-600" />
            <span>Secure via Paystack</span>
          </div>
        </form>
      </div>
    </div>
  );
}
