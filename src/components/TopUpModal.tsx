import { useState } from 'react';
import { X, CreditCard, Smartphone, Building, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'mpesa' | 'airtel' | 'bank'>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleTopUp = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            alert(`Successfully initiated KES ${Number(amount).toLocaleString()} deposit via ${method.toUpperCase()}. Check your phone for the STK push.`);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                >
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                        <CreditCard size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Top Up Wallet</h2>
                    <p className="text-gray-500 text-sm mt-1">Add funds securely to your SWIFTLINE wallet.</p>
                </div>

                <form onSubmit={handleTopUp} className="space-y-6">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (KES)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">KES</span>
                            <input
                                type="number"
                                required
                                min="10"
                                placeholder="e.g. 5,000"
                                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition font-bold text-lg"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Method Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('mpesa')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${method === 'mpesa'
                                    ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                    }`}
                            >
                                <Smartphone size={24} className="mb-1" />
                                <span className="text-xs">M-Pesa</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('airtel')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${method === 'airtel'
                                    ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                                    }`}
                            >
                                <Smartphone size={24} className="mb-1" />
                                <span className="text-xs">Airtel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('bank')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${method === 'bank'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                            >
                                <Building size={24} className="mb-1" />
                                <span className="text-xs">Bank</span>
                            </button>
                        </div>
                    </div>

                    {/* Phone Number Input (Conditional) */}
                    {(method === 'mpesa' || method === 'airtel') && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                required
                                placeholder="07XX XXX XXX"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 transition"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-gray-900/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Pay KES {amount ? Number(amount).toLocaleString() : '0'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <ShieldCheck size={14} className="text-green-600" />
                        <span>Secure verified payment via local gateways</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
