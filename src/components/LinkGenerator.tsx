import { useState } from 'react';
import { Copy, Smartphone, CheckCircle, ArrowRight, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
interface GeneratedTransaction {
    id: string;
    paymentLink: string;
    itemName: string;
    amount: number;
    description?: string;
}

export function LinkGenerator() {
    const { isAuthenticated } = useAuth();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [formData, setFormData] = useState({
        item: '',
        price: '',
        description: ''
    });
    const [transaction, setTransaction] = useState<GeneratedTransaction | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsGenerating(true);

        try {
            // If authenticated, use real API
            if (isAuthenticated) {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`${API_BASE}/api/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        itemName: formData.item,
                        amount: parseFloat(formData.price),
                        description: formData.description || undefined,
                    }),
                });

                const data = await response.json();

                if (data.success && data.data) {
                    setTransaction({
                        id: data.data.id,
                        paymentLink: data.data.paymentLink,
                        itemName: data.data.itemName,
                        amount: data.data.amount,
                        description: data.data.itemDescription,
                    });
                    setStep('success');
                } else {
                    setError(data.error || 'Failed to create payment link');
                }
            } else {
                // Demo mode for non-authenticated users
                const mockId = `TXN-${Date.now().toString(36).toUpperCase()}`;
                const baseUrl = window.location.origin;
                setTransaction({
                    id: mockId,
                    paymentLink: `${baseUrl}/pay/${mockId}`,
                    itemName: formData.item,
                    amount: parseFloat(formData.price),
                    description: formData.description,
                });
                setStep('success');
            }
        } catch (err) {
            console.error('Error creating transaction:', err);
            setError('Failed to create payment link. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        if (!transaction) return;
        try {
            await navigator.clipboard.writeText(transaction.paymentLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = transaction.paymentLink;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareToWhatsApp = () => {
        if (!transaction) return;
        const text = `Pay securely for ${transaction.itemName} (KES ${transaction.amount.toLocaleString()}) using SWIFTLINE Escrow:\n${transaction.paymentLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareNative = async () => {
        if (!transaction) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Payment for ${transaction.itemName}`,
                    text: `Pay securely using SWIFTLINE Escrow`,
                    url: transaction.paymentLink,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            copyToClipboard();
        }
    };

    const resetForm = () => {
        setStep('form');
        setFormData({ item: '', price: '', description: '' });
        setTransaction(null);
        setError(null);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-foreground mb-2">Create Payment Link</h2>
                <p className="text-muted-foreground">Turn any product into a secure checkout link for social media.</p>
                {!isAuthenticated && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Demo mode: Log in to create real payment links
                    </p>
                )}
            </div>

            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                {step === 'form' ? (
                    <div className="p-8">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">What are you selling?</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Nike Air Force 1 - Size 42"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition font-medium"
                                    value={formData.item}
                                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">Price (KES)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">KES</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="0.00"
                                        className="w-full pl-14 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition font-bold text-lg"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">Description / Condition (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Brand new in box. No returns."
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating Secure Link...
                                    </>
                                ) : (
                                    <>
                                        Generate Link
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : transaction && (
                    <div className="p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Visual Card Preview */}
                            <div className="flex-1 bg-gradient-to-br from-primary/90 to-primary p-6 rounded-2xl text-primary-foreground shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                                <div className="relative z-10 flex flex-col h-full justify-between min-h-[400px]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="text-white" size={20} />
                                            </div>
                                            <span className="font-black tracking-wider">SWIFTLINE</span>
                                        </div>

                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10">
                                            <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Selling</p>
                                            <h3 className="text-xl font-bold leading-tight">{transaction.itemName}</h3>
                                        </div>

                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                            <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Price</p>
                                            <p className="text-3xl font-black">KES {transaction.amount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center bg-white p-4 rounded-xl">
                                        <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(transaction.paymentLink)}`} 
                                                alt="QR Code" 
                                                className="w-[80%] h-[80%]" 
                                            />
                                        </div>
                                        <p className="text-gray-900 font-bold text-sm">Scan to Pay Securely</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-1 flex flex-col justify-center gap-4">
                                <div className="text-center mb-6 md:text-left">
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Link Created!</h3>
                                    <p className="text-muted-foreground">Share this card on your story or send the link directly.</p>
                                </div>

                                <div 
                                    className="bg-muted p-4 rounded-xl border border-border flex items-center justify-between mb-2 group cursor-pointer hover:bg-background transition" 
                                    onClick={copyToClipboard}
                                >
                                    <div className="overflow-hidden flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1">Payment Link</p>
                                        <code className="text-primary font-mono font-bold text-sm truncate block">
                                            {transaction.paymentLink}
                                        </code>
                                    </div>
                                    <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition ml-2 flex-shrink-0">
                                        {copied ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <button
                                    onClick={shareNative}
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                                >
                                    <Share2 size={20} />
                                    Share Link
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={shareToWhatsApp}
                                        className="py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition flex items-center justify-center gap-2"
                                    >
                                        <Smartphone size={18} />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition"
                                    >
                                        New Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
