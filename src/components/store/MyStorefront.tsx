import { useState, useEffect } from 'react';
import { Globe, ExternalLink, Copy, Share2, Check, Eye, ShoppingCart, Package, QrCode, Download, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface MyStorefrontProps {
  storeSlug: string;
  storeName: string;
  storeStatus?: string;
  storeLogo?: string | null;
}

interface Stats {
  totalProducts: number;
  totalViews: number;
  totalOrders: number;
}

export function MyStorefront({ storeSlug, storeName, storeStatus = 'INACTIVE', storeLogo }: MyStorefrontProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalViews: 0, totalOrders: 0 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const storeUrl = `${window.location.origin}/store/${storeSlug}`;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          api.getSellerStats(),
          api.listPublishedProducts(),
        ]);

        const newStats: Stats = { totalProducts: 0, totalViews: 0, totalOrders: 0 };

        if (statsRes.success && statsRes.data) {
          const data = statsRes.data as any;
          newStats.totalViews = data.storeViews || 0;
          newStats.totalOrders = data.totalOrders || data.completedCount || 0;
        }

        if (productsRes.success && productsRes.data) {
          const products = Array.isArray(productsRes.data) ? productsRes.data : [];
          newStats.totalProducts = products.length;
        }

        setStats(newStats);
      } catch (error) {
        console.error('Failed to load store stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast({ title: 'Link copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Check out my store: ${storeName}`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${storeUrl}`)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(storeUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't have direct sharing API, copy link instead
        handleCopyLink();
        toast({ title: 'Link copied!', description: 'Paste in your Instagram bio or story' });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const generateQRCode = () => {
    // Using a free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`;
  };

  const isActive = storeStatus === 'ACTIVE';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">My Storefront</h2>

      {/* Store Preview Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Store Header Preview */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          <div className="relative flex items-center gap-4">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Globe size={36} />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold">{storeName}</h3>
              <p className="opacity-80 text-sm">Your public storefront</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-green-500/20 text-green-100' : 'bg-yellow-500/20 text-yellow-100'
                }`}>
                  {isActive ? '● Live' : '○ Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Store URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Store URL</label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-sm text-foreground truncate flex items-center">
                <span className="truncate">{storeUrl}</span>
              </div>
              <button 
                onClick={handleCopyLink}
                className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition flex items-center gap-2 text-foreground min-w-[100px] justify-center"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
            >
              <ExternalLink size={18} />
              View Store
            </a>
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition text-foreground"
              >
                <Share2 size={18} />
                Share Store
              </button>
              
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 w-48 py-2">
                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition flex items-center gap-3 text-foreground"
                    >
                      <MessageCircle size={18} className="text-green-500" />
                      WhatsApp
                    </button>
                    <button 
                      onClick={() => handleShare('facebook')}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition flex items-center gap-3 text-foreground"
                    >
                      <Facebook size={18} className="text-blue-600" />
                      Facebook
                    </button>
                    <button 
                      onClick={() => handleShare('instagram')}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition flex items-center gap-3 text-foreground"
                    >
                      <Instagram size={18} className="text-pink-500" />
                      Instagram
                    </button>
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition flex items-center gap-3 text-foreground"
                    >
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </button>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition text-foreground"
            >
              <QrCode size={18} />
              QR Code
            </button>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="bg-muted rounded-xl p-6 text-center">
              <img 
                src={generateQRCode()} 
                alt="Store QR Code" 
                className="mx-auto rounded-lg mb-4"
              />
              <p className="text-sm text-muted-foreground mb-3">Scan to visit your store</p>
              <a 
                href={generateQRCode()} 
                download={`${storeSlug}-qr-code.png`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium"
              >
                <Download size={16} />
                Download QR Code
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Store Status */}
      <div className={`bg-card border rounded-xl p-6 ${
        isActive ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'
      }`}>
        <h3 className="text-lg font-bold text-foreground mb-4">Store Status</h3>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className="text-foreground font-medium">{isActive ? 'Active' : 'Inactive'}</span>
          <span className="text-sm text-muted-foreground">
            - {isActive ? 'Your store is live and accepting orders' : 'Activate your store in Settings to go live'}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100' },
          { label: 'Store Views', value: stats.totalViews, icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600', bgColor: 'bg-green-100' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={stat.color} size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{loading ? '-' : stat.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {!isActive && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Getting Started</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Connect your social accounts to import products</li>
            <li>• Add a payout method to receive payments</li>
            <li>• Activate your store in Settings to go live</li>
            <li>• Share your store link on social media</li>
          </ul>
        </div>
      )}
    </div>
  );
}
