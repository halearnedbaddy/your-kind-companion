import { useState } from "react";
import { useProducts, useCategories, type Product } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";

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

  const S: Record<string, React.CSSProperties> = {
    app: { fontFamily: "'Sora', sans-serif", background: "#F7F4EF", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden" },
    header: { background: "#0A0A0A", padding: "20px 20px 16px", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
    logoMark: { width: 36, height: 36, background: "#FF4D00", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" },
    logoText: { color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px" },
    logoSub: { color: "#FF4D00", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const },
    cartBtn: { marginLeft: "auto", background: "#FF4D00", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    searchBar: { background: "#1A1A1A", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 },
    searchInput: { background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, flex: 1, fontFamily: "'Sora', sans-serif" },
    heroStrip: { background: "linear-gradient(135deg, #FF4D00 0%, #FF8C00 100%)", padding: "20px 20px", position: "relative", overflow: "hidden" },
    heroTitle: { color: "#fff", fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px" },
    heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
    heroPattern: { position: "absolute", right: -20, top: -20, fontSize: 80, opacity: 0.15 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px 100px" },
    card: { background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    cardImg: { background: "#F7F4EF", height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, position: "relative" },
    cardBody: { padding: "10px 12px 12px" },
    cardName: { fontSize: 13, fontWeight: 700, color: "#0A0A0A", lineHeight: 1.3, marginBottom: 4 },
    cardAgent: { fontSize: 11, color: "#999", marginBottom: 8 },
    cardPrice: { fontSize: 16, fontWeight: 800, color: "#FF4D00" },
    cardOld: { fontSize: 11, color: "#bbb", textDecoration: "line-through", marginLeft: 4 },
    addBtn: { background: "#0A0A0A", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 8, width: "100%", fontFamily: "'Sora', sans-serif" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #E8E4DD", display: "flex", padding: "10px 0 16px", zIndex: 200 },
    checkoutBtn: { background: "#FF4D00", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 800, width: "100%", cursor: "pointer", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.3px" },
    checkoutBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0A0A0A", padding: "16px 20px 28px", zIndex: 200 },
    input: { background: "#fff", border: "2px solid #E8E4DD", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontFamily: "'Sora', sans-serif", width: "100%", outline: "none", color: "#0A0A0A", boxSizing: "border-box" as const },
    label: { fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 6, display: "block" },
    summaryBox: { background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    stkBox: { background: "#0A0A0A", borderRadius: 14, padding: 16, textAlign: "center" as const, color: "#fff", marginBottom: 16 },
    cartItem: { background: "#fff", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    cartItemEmoji: { fontSize: 32, background: "#F7F4EF", width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    qtyBtn: { background: "#F7F4EF", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Sora', sans-serif" },
  };

  const catBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "#0A0A0A" : "#fff", color: active ? "#fff" : "#0A0A0A",
    border: `2px solid ${active ? "#0A0A0A" : "#E8E4DD"}`, borderRadius: 100,
    padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
    fontFamily: "'Sora', sans-serif", transition: "all 0.2s",
  });

  const badgeStyle = (type: string): React.CSSProperties => ({
    position: "absolute", top: 8, left: 8,
    background: badgeColors[type]?.bg, color: badgeColors[type]?.text,
    fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 6, letterSpacing: 0.5,
  });

  const navItem = (active: boolean): React.CSSProperties => ({
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    cursor: "pointer", color: active ? "#FF4D00" : "#999", fontSize: 10, fontWeight: active ? 700 : 500,
  });

  // Product Detail
  if (screen === "product" && selectedProduct) {
    const p = selectedProduct;
    return (
      <div style={S.app}>
        <div style={{ background: "#0A0A0A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setScreen("home")} style={{ background: "#1A1A1A", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16 }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Product Detail</span>
        </div>
        <div style={{ background: "#F7F4EF", height: 220, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>{p.emoji || "📦"}</div>
        <div style={{ padding: "20px 20px 100px" }}>
          {p.badge && <span style={{ ...badgeStyle(p.badge), position: "relative", top: 0, left: 0, display: "inline-block", marginBottom: 10 }}>{p.badge}</span>}
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0A", marginBottom: 4 }}>{p.name}</div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>⭐ {p.rating || 0} · {p.total_sold} sold</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#FF4D00" }}>KSh {p.price.toLocaleString()}</span>
            {p.original_price && <span style={{ fontSize: 15, color: "#bbb", textDecoration: "line-through" }}>KSh {p.original_price.toLocaleString()}</span>}
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>About this product</div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{p.description || `Premium quality ${p.name} sourced and sold exclusively through PayLoom Instants. 100% authentic with 30-day return policy and PayLoom buyer protection.`}</div>
          </div>
        </div>
        <div style={S.checkoutBar}>
          <button onClick={() => { addToCart(p); setScreen("cart"); }} style={S.checkoutBtn}>Add to Cart — KSh {p.price.toLocaleString()}</button>
        </div>
      </div>
    );
  }

  // Cart
  if (screen === "cart") {
    return (
      <div style={S.app}>
        <div style={{ background: "#0A0A0A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setScreen("home")} style={{ background: "#1A1A1A", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16 }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>My Cart</span>
          <span style={{ marginLeft: "auto", color: "#FF4D00", fontWeight: 700 }}>{cartCount} items</span>
        </div>
        <div style={{ padding: "20px 20px 100px", minHeight: "100vh" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0A0A0A" }}>Your cart is empty</div>
              <div style={{ fontSize: 14, color: "#999", marginTop: 8 }}>Add items to get started</div>
              <button onClick={() => setScreen("home")} style={{ ...S.checkoutBtn, marginTop: 24, width: "auto", padding: "12px 24px" }}>Browse Products</button>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={S.cartItem}>
              <div style={S.cartItemEmoji}>{item.emoji || "📦"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A" }}>{item.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <button style={S.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{item.qty}</span>
                  <button style={S.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FF4D00" }}>KSh {(item.price * item.qty).toLocaleString()}</div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#FF4D00", fontSize: 11, cursor: "pointer", marginTop: 6, fontFamily: "'Sora', sans-serif" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={S.checkoutBar}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#999", fontSize: 13 }}>Total ({cartCount} items)</span>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>KSh {cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={() => setScreen("checkout")} style={S.checkoutBtn}>Proceed to Checkout →</button>
          </div>
        )}
      </div>
    );
  }

  // Checkout
  if (screen === "checkout") {
    return (
      <div style={S.app}>
        <div style={{ background: "#0A0A0A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setScreen("cart")} style={{ background: "#1A1A1A", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16 }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Pay via M-Pesa</span>
        </div>
        <div style={{ padding: "20px 20px 120px" }}>
          <div style={S.summaryBox}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#0A0A0A" }}>Order Summary</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#666" }}>{item.emoji} {item.name} ×{item.qty}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>KSh {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #F0EDE8", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#FF4D00" }}>KSh {cartTotal.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>M-Pesa Phone Number</label>
            <input style={S.input} placeholder="e.g. 0712 345 678" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
          </div>
          {stkSent && (
            <div style={S.stkBox}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📲</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>STK Push Sent!</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Check your phone and enter your M-Pesa PIN to complete payment</div>
              <div style={{ marginTop: 12, fontSize: 11, color: "#FF4D00" }}>⏳ Waiting for confirmation...</div>
            </div>
          )}
          <div style={{ background: "#E8F5EF", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00A651" }}>Secured by PayLoom Instants</div>
              <div style={{ fontSize: 11, color: "#666" }}>Your payment goes directly to our verified merchant account</div>
            </div>
          </div>
        </div>
        <div style={S.checkoutBar}>
          <button onClick={handlePay} disabled={paying || stkSent} style={{ ...S.checkoutBtn, opacity: (paying || stkSent) ? 0.7 : 1 }}>
            {paying ? "⏳ Sending STK Push..." : stkSent ? "📲 Awaiting PIN..." : `Pay KSh ${cartTotal.toLocaleString()} via M-Pesa`}
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (screen === "success") {
    return (
      <div style={{ ...S.app, background: "#0A0A0A" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>✅</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Payment Confirmed!</div>
          <div style={{ color: "#aaa", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>Your M-Pesa payment was received by PayLoom Instants. Your order is being processed.</div>
          <div style={{ background: "#1A1A1A", borderRadius: 16, padding: 20, width: "100%", marginBottom: 24, textAlign: "left" }}>
            <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>TRANSACTION REFERENCE</div>
            <div style={{ color: "#FF4D00", fontSize: 16, fontWeight: 800 }}>PLI{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
          </div>
          <button onClick={() => setScreen("home")} style={{ ...S.checkoutBtn, width: "100%" }}>Continue Shopping →</button>
        </div>
      </div>
    );
  }

  // Home
  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoMark}>P</div>
          <div>
            <div style={S.logoText}>PayLoom</div>
            <div style={S.logoSub}>Instants Shop</div>
          </div>
          <button style={S.cartBtn} onClick={() => setScreen("cart")}>
            🛒 {cartCount > 0 && <span style={{ background: "#fff", color: "#FF4D00", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{cartCount}</span>}
            {cartCount === 0 ? "Cart" : ""}
          </button>
        </div>
        <div style={S.searchBar}>
          <span style={{ color: "#666" }}>🔍</span>
          <input style={S.searchInput} placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div style={S.heroStrip}>
        <div style={S.heroPattern}>🛍️</div>
        <div style={S.heroTitle}>Shop. Pay. Done.<br />Instantly.</div>
        <div style={S.heroSub}>Pay with M-Pesa · Delivered to your door</div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "16px 20px", overflowX: "auto", scrollbarWidth: "none" as const }}>
        {allCategories.map(c => (
          <button key={c} style={catBtn(activeCategory === c)} onClick={() => setActiveCategory(c)}>{c}</button>
        ))}
      </div>
      <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0A0A" }}>
          {isLoading ? "Loading..." : `${filtered.length} Products`}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>Tap to view details</div>
      </div>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading products from database...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A" }}>No products yet</div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Products will appear here once added via Admin panel</div>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(p => (
            <div key={p.id} style={S.card} onClick={() => { setSelectedProduct(p); setScreen("product"); }}>
              <div style={S.cardImg}>
                {p.emoji || "📦"}
                {p.badge && <span style={badgeStyle(p.badge)}>{p.badge}</span>}
              </div>
              <div style={S.cardBody}>
                <div style={S.cardName}>{p.name}</div>
                <div style={S.cardAgent}>{p.category_name}</div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={S.cardPrice}>KSh {p.price.toLocaleString()}</span>
                  {p.original_price && <span style={S.cardOld}>{p.original_price.toLocaleString()}</span>}
                </div>
                <button style={S.addBtn} onClick={e => { e.stopPropagation(); addToCart(p); }}>+ Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={S.bottomNav}>
        {([["🏠", "Home", "home"], ["🛒", "Cart", "cart"]] as const).map(([icon, label, s]) => (
          <div key={s} style={navItem(screen === s)} onClick={() => setScreen(s)}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
        <div style={navItem(false)} onClick={() => navigate("/")}>
          <span style={{ fontSize: 20 }}>🏢</span>
          <span>Hub</span>
        </div>
      </div>
    </div>
  );
}
