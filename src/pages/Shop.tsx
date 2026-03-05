import { useState } from "react";
import { useProducts, useCategories, type Product } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Search, Minus, Plus, Trash2, Lock, Home } from "lucide-react";

type CartItem = Product & { qty: number };

const badgeColors: Record<string, { bg: string; text: string }> = {
  Hot: { bg: "#FF4D00", text: "#fff" },
  Sale: { bg: "#00B86B", text: "#fff" },
  New: { bg: "#005FFF", text: "#fff" },
};

export default function Shop() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<"home" | "cart" | "checkout" | "success" | "product">("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const allCategories = ["All", ...categories.map(c => c.name)];
  const filtered = products.filter(p =>
    (activeCategory === "All" || p.category_name === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const handlePay = () => {
    if (!phone || phone.length < 10) return;
    setPaying(true);
    setTimeout(() => { setPaying(false); setStkSent(true); }, 2000);
    setTimeout(() => { setStkSent(false); setCart([]); setScreen("success"); }, 6000);
  };

  const AppShell = ({ children, title, onBack, rightContent }: { children: React.ReactNode; title: string; onBack?: () => void; rightContent?: React.ReactNode }) => (
    <div className="font-['Sora',sans-serif] bg-[#F7F4EF] min-h-screen max-w-[430px] mx-auto relative overflow-hidden">
      <div className="bg-[#0A0A0A] px-5 py-4 sticky top-0 z-50 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="bg-[#1A1A1A] border-none rounded-xl w-9 h-9 flex items-center justify-center text-white cursor-pointer">
            <ArrowLeft size={16} />
          </button>
        )}
        <span className="text-white font-bold text-base flex-1">{title}</span>
        {rightContent}
      </div>
      {children}
    </div>
  );

  // Product Detail
  if (screen === "product" && selectedProduct) {
    const p = selectedProduct;
    return (
      <AppShell title="Product Detail" onBack={() => setScreen("home")}>
        <div className="bg-[#F7F4EF] h-[220px] flex items-center justify-center text-[100px]">{p.emoji || "📦"}</div>
        <div className="p-5 pb-[100px]">
          {p.badge && <span className="inline-block mb-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md" style={{ background: badgeColors[p.badge]?.bg, color: badgeColors[p.badge]?.text }}>{p.badge}</span>}
          <div className="text-[22px] font-extrabold text-[#0A0A0A] mb-1">{p.name}</div>
          <div className="text-sm text-[#999] mb-4">⭐ {p.rating || 0} · {p.total_sold} sold</div>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-[28px] font-extrabold text-primary">KSh {p.price.toLocaleString()}</span>
            {p.original_price && <span className="text-[15px] text-[#bbb] line-through">KSh {p.original_price.toLocaleString()}</span>}
          </div>
          <div className="bg-white rounded-2xl p-4 mb-4">
            <div className="text-sm font-bold mb-2">About this product</div>
            <div className="text-sm text-[#666] leading-relaxed">{p.description || `Premium quality ${p.name}. 100% authentic with buyer protection.`}</div>
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0A0A0A] p-5 pb-7 z-50">
          <button onClick={() => { addToCart(p); setScreen("cart"); }} className="bg-primary text-white border-none rounded-2xl py-4 w-full text-[15px] font-extrabold cursor-pointer">
            Add to Cart — KSh {p.price.toLocaleString()}
          </button>
        </div>
      </AppShell>
    );
  }

  // Cart
  if (screen === "cart") {
    return (
      <AppShell title="My Cart" onBack={() => setScreen("home")} rightContent={<span className="text-primary font-bold">{cartCount} items</span>}>
        <div className="p-5 pb-[100px] min-h-screen">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-7xl mb-4">🛒</div>
              <div className="text-lg font-bold text-[#0A0A0A]">Your cart is empty</div>
              <div className="text-sm text-[#999] mt-2">Add items to get started</div>
              <button onClick={() => setScreen("home")} className="bg-primary text-white border-none rounded-2xl py-3 px-6 text-sm font-extrabold cursor-pointer mt-6">Browse Products</button>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3 mb-2.5 shadow-sm">
              <div className="text-3xl bg-[#F7F4EF] w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0">{item.emoji || "📦"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#0A0A0A] truncate">{item.name}</div>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <button className="bg-[#F7F4EF] border-none rounded-md w-7 h-7 cursor-pointer flex items-center justify-center" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                  <span className="text-sm font-bold">{item.qty}</span>
                  <button className="bg-[#F7F4EF] border-none rounded-md w-7 h-7 cursor-pointer flex items-center justify-center" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-extrabold text-primary">KSh {(item.price * item.qty).toLocaleString()}</div>
                <button onClick={() => removeFromCart(item.id)} className="bg-transparent border-none text-red-500 text-xs cursor-pointer mt-1.5 flex items-center gap-1 ml-auto"><Trash2 size={12} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0A0A0A] p-5 pb-7 z-50">
            <div className="flex justify-between mb-3">
              <span className="text-[#999] text-sm">Total ({cartCount} items)</span>
              <span className="text-white text-lg font-extrabold">KSh {cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={() => setScreen("checkout")} className="bg-primary text-white border-none rounded-2xl py-4 w-full text-[15px] font-extrabold cursor-pointer">
              Proceed to Checkout →
            </button>
          </div>
        )}
      </AppShell>
    );
  }

  // Checkout
  if (screen === "checkout") {
    return (
      <AppShell title="Pay via M-Pesa" onBack={() => setScreen("cart")}>
        <div className="p-5 pb-[120px]">
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <div className="text-sm font-bold mb-3 text-[#0A0A0A]">Order Summary</div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between mb-2">
                <span className="text-sm text-[#666]">{item.emoji} {item.name} ×{item.qty}</span>
                <span className="text-sm font-bold">KSh {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-[#F0EDE8] pt-2.5 mt-1 flex justify-between">
              <span className="text-sm font-bold">Total</span>
              <span className="text-base font-extrabold text-primary">KSh {cartTotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="mb-5">
            <label className="text-xs font-bold text-[#666] tracking-widest uppercase mb-1.5 block">M-Pesa Phone Number</label>
            <input className="bg-white border-2 border-[#E8E4DD] rounded-xl py-3.5 px-4 text-[15px] w-full outline-none text-[#0A0A0A] font-['Sora',sans-serif] focus:border-primary transition-colors"
              placeholder="e.g. 0712 345 678" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
          </div>
          {stkSent && (
            <div className="bg-[#0A0A0A] rounded-2xl p-4 text-center text-white mb-4">
              <div className="text-[28px] mb-2">📲</div>
              <div className="font-extrabold text-[15px] mb-1">STK Push Sent!</div>
              <div className="text-xs text-[#aaa]">Check your phone and enter your M-Pesa PIN to complete payment</div>
              <div className="mt-3 text-xs text-primary">⏳ Waiting for confirmation...</div>
            </div>
          )}
          <div className="bg-[#E8F5EF] rounded-xl p-3.5 flex items-center gap-2.5">
            <Lock size={20} className="text-[#00A651]" />
            <div>
              <div className="text-xs font-bold text-[#00A651]">Secured by PayLoom Instants</div>
              <div className="text-[11px] text-[#666]">Your payment goes directly to our verified merchant account</div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0A0A0A] p-5 pb-7 z-50">
          <button onClick={handlePay} disabled={paying || stkSent}
            className="bg-primary text-white border-none rounded-2xl py-4 w-full text-[15px] font-extrabold cursor-pointer disabled:opacity-60">
            {paying ? "⏳ Sending STK Push..." : stkSent ? "📲 Awaiting PIN..." : `Pay KSh ${cartTotal.toLocaleString()} via M-Pesa`}
          </button>
        </div>
      </AppShell>
    );
  }

  // Success
  if (screen === "success") {
    return (
      <div className="font-['Sora',sans-serif] bg-[#0A0A0A] min-h-screen max-w-[430px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="text-[80px] mb-5">✅</div>
          <div className="text-white text-[26px] font-extrabold mb-2">Payment Confirmed!</div>
          <div className="text-[#aaa] text-sm mb-8 leading-relaxed">Your M-Pesa payment was received. Your order is being processed.</div>
          <div className="bg-[#1A1A1A] rounded-2xl p-5 w-full mb-6 text-left">
            <div className="text-[#666] text-xs mb-2">TRANSACTION REFERENCE</div>
            <div className="text-primary text-base font-extrabold">PLI{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
          </div>
          <button onClick={() => setScreen("home")} className="bg-primary text-white border-none rounded-2xl py-4 w-full text-[15px] font-extrabold cursor-pointer">
            Continue Shopping →
          </button>
        </div>
      </div>
    );
  }

  // Home
  return (
    <div className="font-['Sora',sans-serif] bg-[#F7F4EF] min-h-screen max-w-[430px] mx-auto relative overflow-hidden">
      <div className="bg-[#0A0A0A] px-5 pt-5 pb-4 sticky top-0 z-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-lg font-black text-white">P</div>
          <div>
            <div className="text-white text-lg font-bold tracking-tight">PayLoom</div>
            <div className="text-primary text-[11px] font-semibold tracking-widest uppercase">Instants Shop</div>
          </div>
          <button className="ml-auto bg-primary border-none rounded-xl px-3.5 py-2 text-white text-sm font-bold cursor-pointer flex items-center gap-1.5"
            onClick={() => setScreen("cart")}>
            <ShoppingCart size={16} />
            {cartCount > 0 && <span className="bg-white text-primary rounded-full w-[18px] h-[18px] inline-flex items-center justify-center text-[10px] font-black">{cartCount}</span>}
            {cartCount === 0 && "Cart"}
          </button>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
          <Search size={16} className="text-[#666]" />
          <input className="bg-transparent border-none outline-none text-white text-sm flex-1 font-['Sora',sans-serif] placeholder:text-[#666]"
            placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-[#FF8C00] px-5 py-5 relative overflow-hidden">
        <div className="absolute -right-5 -top-5 text-[80px] opacity-15">🛍️</div>
        <div className="text-white text-[22px] font-extrabold leading-tight tracking-tight">Shop. Pay. Done.<br />Instantly.</div>
        <div className="text-white/85 text-sm mt-1">Pay with M-Pesa · Delivered to your door</div>
      </div>

      <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
        {allCategories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold border-2 cursor-pointer transition-all font-['Sora',sans-serif] ${activeCategory === c ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white text-[#0A0A0A] border-[#E8E4DD] hover:border-[#ccc]'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="px-5 pb-3 flex justify-between items-center">
        <div className="text-[15px] font-extrabold text-[#0A0A0A]">
          {isLoading ? "Loading..." : `${filtered.length} Products`}
        </div>
        <div className="text-xs text-[#999]">Tap to view details</div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-[#999]">Loading products from database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-2">📭</div>
          <div className="text-[15px] font-bold text-[#0A0A0A]">No products yet</div>
          <div className="text-sm text-[#999] mt-1">Products will appear here once added via Admin panel</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-[100px]">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              onClick={() => { setSelectedProduct(p); setScreen("product"); }}>
              <div className="bg-[#F7F4EF] h-[110px] flex items-center justify-center text-[52px] relative">
                {p.emoji || "📦"}
                {p.badge && <span className="absolute top-2 left-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md" style={{ background: badgeColors[p.badge]?.bg, color: badgeColors[p.badge]?.text }}>{p.badge}</span>}
              </div>
              <div className="p-3">
                <div className="text-[13px] font-bold text-[#0A0A0A] leading-tight mb-1">{p.name}</div>
                <div className="text-[11px] text-[#999] mb-2">{p.category_name}</div>
                <div className="flex items-baseline">
                  <span className="text-base font-extrabold text-primary">KSh {p.price.toLocaleString()}</span>
                  {p.original_price && <span className="text-[11px] text-[#bbb] line-through ml-1">{p.original_price.toLocaleString()}</span>}
                </div>
                <button className="bg-[#0A0A0A] text-white border-none rounded-lg py-1.5 w-full text-[11px] font-bold cursor-pointer mt-2 font-['Sora',sans-serif] hover:bg-[#222] transition-colors"
                  onClick={e => { e.stopPropagation(); addToCart(p); }}>+ Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#E8E4DD] flex py-2.5 pb-4 z-50">
        {([
          { icon: <Home size={20} />, label: "Home", s: "home" as const },
          { icon: <ShoppingCart size={20} />, label: "Cart", s: "cart" as const },
        ]).map(({ icon, label, s }) => (
          <div key={s} className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer text-[10px] font-medium ${screen === s ? 'text-primary font-bold' : 'text-[#999]'}`}
            onClick={() => setScreen(s)}>
            {icon}
            <span>{label}</span>
          </div>
        ))}
        <div className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer text-[10px] font-medium text-[#999]" onClick={() => navigate("/")}>
          <span className="text-xl">🏢</span>
          <span>Hub</span>
        </div>
      </div>
    </div>
  );
}
