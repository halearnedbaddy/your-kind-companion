import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  delivered: { bg: "#0D2B1E", color: "#00D97E", label: "Delivered" },
  processing: { bg: "#1A1A00", color: "#FFD600", label: "Processing" },
  pending: { bg: "#1A1400", color: "#FFB800", label: "Pending" },
  cancelled: { bg: "#2B0D0D", color: "#FF4D4D", label: "Cancelled" },
  paid: { bg: "#0D2B1E", color: "#00D97E", label: "Paid" },
};

const TIER_COLOR: Record<string, string> = { Gold: "#FFD700", Silver: "#C0C0C0", Bronze: "#CD7F32", Platinum: "#00E5FF" };

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const [shareModal, setShareModal] = useState(false);
  const [shareProduct, setShareProduct] = useState<any>(null);

  // Fetch all agents for demo (no auth required)
  const { data: agents = [] } = useQuery({
    queryKey: ["all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*, profiles(full_name, phone)");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["agent-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ["agent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payouts
  const { data: payouts = [] } = useQuery({
    queryKey: ["agent-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const agent = agents[0] as any; // Demo: show first agent
  const agentName = agent?.profiles?.full_name || "Agent";
  const agentPhone = agent?.profiles?.phone || agent?.mpesa_phone || "";
  const agentAvatar = agentName.split(" ").map((n: string) => n[0]).join("").substring(0, 2);

  const pendingEarnings = agent?.pending_earnings || 0;
  const totalEarnings = agent?.total_earned || 0;
  const totalSales = agent?.total_sales || 0;
  const commissionRate = agent?.commission_rate || 8;
  const tier = agent?.tier || "Bronze";

  const S: Record<string, React.CSSProperties> = {
    root: { fontFamily: "'DM Sans', sans-serif", background: "#0C0C10", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#F0EEF8", position: "relative", paddingBottom: 72 },
    topBar: { padding: "20px 20px 16px", background: "#0C0C10", position: "sticky", top: 0, zIndex: 99, borderBottom: "1px solid #1C1C24" },
    balanceCard: { background: "linear-gradient(135deg, #1A0A00 0%, #2B1400 50%, #1A0A00 100%)", border: "1px solid #3D1F00", borderRadius: 20, padding: "20px 20px 16px", margin: "16px 16px 0", position: "relative", overflow: "hidden" },
    balanceGlow: { position: "absolute", top: -40, right: -40, width: 120, height: 120, background: "radial-gradient(circle, rgba(255,77,0,0.3) 0%, transparent 70%)", borderRadius: "50%" },
    requestBtn: { marginTop: 14, background: "#FF4D00", border: "none", borderRadius: 12, padding: "12px 0", width: "100%", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
    statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 16px 0" },
    statCard: { background: "#16161E", border: "1px solid #1F1F2E", borderRadius: 14, padding: "14px 14px 12px" },
    section: { padding: "20px 16px 0" },
    sectionTitle: { fontSize: 14, fontWeight: 800, color: "#888", letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 12 },
    orderRow: { background: "#16161E", border: "1px solid #1F1F2E", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 },
    productRow: { background: "#16161E", border: "1px solid #1F1F2E", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 },
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0C0C10", borderTop: "1px solid #1C1C24", display: "flex", padding: "10px 0 16px", zIndex: 200 },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 999 },
    modalBox: { background: "#16161E", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430, margin: "0 auto", border: "1px solid #2A2A36" },
    copyBtn: { background: "#FF4D00", border: "none", borderRadius: 12, padding: "13px 0", width: "100%", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 14 },
  };

  const statusPill = (s: string): React.CSSProperties => ({
    background: STATUS_STYLE[s]?.bg || "#1A1A1A", color: STATUS_STYLE[s]?.color || "#fff",
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
  });

  const navItem = (active: boolean): React.CSSProperties => ({
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    cursor: "pointer", color: active ? "#FF4D00" : "#3A3A4A", fontSize: 10, fontWeight: active ? 800 : 500,
  });

  const NAV_ITEMS = [
    { id: "home", icon: "⚡", label: "Home" },
    { id: "products", icon: "📦", label: "Products" },
    { id: "orders", icon: "🧾", label: "Orders" },
    { id: "payouts", icon: "💸", label: "Payouts" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{sub}</div>
    </div>
  );

  const HomeTab = () => (
    <div>
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#FF4D00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>{agentAvatar || "AG"}</div>
        <div>
          <div style={{ fontSize: 13, color: "#666" }}>Welcome 👋</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{agentName}</div>
        </div>
        {agent && <div style={{ marginLeft: "auto", background: "#1A1000", border: `1px solid ${TIER_COLOR[tier]}33`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: TIER_COLOR[tier] }}>{tier} Agent</div>}
      </div>
      <div style={S.balanceCard}>
        <div style={S.balanceGlow} />
        <div style={{ fontSize: 11, color: "#FF8C5A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Pending Earnings</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: "#fff", margin: "6px 0 2px" }}>KSh {Number(pendingEarnings).toLocaleString()}</div>
        <div style={{ fontSize: 12, color: "#AA7755" }}>Commission rate: {commissionRate}% per sale</div>
        <button style={S.requestBtn}>Request Payout via M-Pesa →</button>
      </div>
      <div style={S.statGrid}>
        {[
          [`KSh ${Number(totalEarnings).toLocaleString()}`, "Total Earned", "#00D97E"],
          [totalSales.toString(), "Total Sales", "#FFD600"],
          [`${commissionRate}%`, "Commission Rate", "#00B4FF"],
          [products.length.toString(), "Active Listings", "#FF4D00"],
        ].map(([value, label, color]) => (
          <div key={label} style={S.statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color }}>{value}</div>
            <div style={{ fontSize: 11, color: "#666", fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {orders.length === 0 && products.length === 0 ? (
        <EmptyState icon="📊" title="No data yet" sub="Orders and products will appear once the database is populated" />
      ) : (
        <div style={S.section}>
          <div style={S.sectionTitle}>Recent Orders</div>
          {orders.length === 0 ? (
            <EmptyState icon="🧾" title="No orders yet" sub="Orders will show up here" />
          ) : orders.slice(0, 3).map((o: any) => (
            <div key={o.id} style={S.orderRow}>
              <div style={{ width: 40, height: 40, background: "#0C0C10", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{o.customer_name || "Customer"}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{o.order_number}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#00D97E" }}>KSh {Number(o.total_amount).toLocaleString()}</div>
                <span style={statusPill(o.status)}>{STATUS_STYLE[o.status]?.label || o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ProductsTab = () => (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>My Products</div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Share your link to get sales</div>
      {products.length === 0 ? (
        <EmptyState icon="📦" title="No products" sub="Add products from the Admin panel" />
      ) : products.map((p: any) => (
        <div key={p.id} style={S.productRow}>
          <div style={{ width: 48, height: 48, background: "#0C0C10", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{p.emoji || "📦"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>KSh {Number(p.price).toLocaleString()} · {p.total_sold} sold</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ ...statusPill(p.stock === 0 ? "cancelled" : "delivered"), fontSize: 9 }}>{p.stock === 0 ? "Out of Stock" : `${p.stock} in stock`}</span>
              <span style={{ fontSize: 10, color: "#FF4D00", fontWeight: 700 }}>+KSh {Math.round(Number(p.price) * commissionRate / 100).toLocaleString()} commission</span>
            </div>
          </div>
          <button onClick={() => { setShareProduct(p); setShareModal(true); }} style={{ background: "#1F1F2E", border: "1px solid #2A2A36", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Share 🔗</button>
        </div>
      ))}
    </div>
  );

  const OrdersTab = () => (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>My Orders</div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>All customer orders</div>
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" sub="Orders from customers will appear here" />
      ) : orders.map((o: any) => (
        <div key={o.id} style={{ ...S.orderRow, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>{o.order_number}</span>
            <span style={statusPill(o.status)}>{STATUS_STYLE[o.status]?.label || o.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1F1F2E", paddingTop: 8 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Sale: KSh {Number(o.total_amount).toLocaleString()}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#00D97E" }}>Commission: KSh {Number(o.commission_amount).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const PayoutsTab = () => (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Payouts</div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Earnings sent to your M-Pesa</div>
      <div style={{ ...S.balanceCard, margin: "0 0 16px" }}>
        <div style={S.balanceGlow} />
        <div style={{ fontSize: 11, color: "#FF8C5A", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Available to Request</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "#fff", margin: "6px 0 2px" }}>KSh {Number(pendingEarnings).toLocaleString()}</div>
        <div style={{ fontSize: 12, color: "#AA7755" }}>Will be sent to {agentPhone}</div>
        <button style={S.requestBtn}>Request Payout Now →</button>
      </div>
      <div style={S.sectionTitle}>Payout History</div>
      {payouts.length === 0 ? (
        <EmptyState icon="💸" title="No payouts yet" sub="Request your first payout above" />
      ) : payouts.map((p: any) => (
        <div key={p.id} style={{ ...S.orderRow, flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#00D97E" }}>KSh {Number(p.amount).toLocaleString()}</span>
            <span style={statusPill(p.status)}>{STATUS_STYLE[p.status]?.label || p.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#555" }}>{new Date(p.created_at).toLocaleDateString()}</span>
            <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>Ref: {p.payout_ref}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const ProfileTab = () => (
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 20px" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#FF4D00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, marginBottom: 12 }}>{agentAvatar}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{agentName}</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{agentPhone}</div>
        <div style={{ marginTop: 8, background: "#1A1000", border: `1px solid ${TIER_COLOR[tier]}44`, borderRadius: 10, padding: "5px 14px", fontSize: 12, fontWeight: 800, color: TIER_COLOR[tier] }}>⭐ {tier} Agent · {commissionRate}% Commission</div>
      </div>
      {([["📱", "M-Pesa Number", agentPhone || "Not set"], ["💼", "Total Sales", `${totalSales} orders`], ["💰", "Total Earned", `KSh ${Number(totalEarnings).toLocaleString()}`]] as const).map(([icon, label, value]) => (
        <div key={label} style={{ ...S.productRow, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const TABS: Record<string, React.FC> = { home: HomeTab, products: ProductsTab, orders: OrdersTab, payouts: PayoutsTab, profile: ProfileTab };
  const ActiveTab = TABS[tab];

  return (
    <div style={S.root}>
      <div style={S.topBar}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #FF4D00, #FF8C00)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>P</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.4px" }}>PayLoom Agent</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#FF4D00", letterSpacing: 2, textTransform: "uppercase" }}>Instants</div>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#16161E", border: "1px solid #2A2A36", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative" }}>
            🔔
          </div>
        </div>
      </div>
      <div style={{ paddingBottom: 20 }}>
        <ActiveTab />
      </div>
      {shareModal && shareProduct && (
        <div style={S.modal} onClick={() => setShareModal(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Share Product Link 🔗</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Share this link to earn commission per sale</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0C0C10", borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ fontSize: 28 }}>{shareProduct.emoji || "📦"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{shareProduct.name}</div>
                <div style={{ fontSize: 12, color: "#FF4D00", fontWeight: 700 }}>KSh {Number(shareProduct.price).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ background: "#0C0C10", border: "1px solid #2A2A36", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#FF8C5A", wordBreak: "break-all", marginTop: 12 }}>
              https://shop.payloom.co/p/{shareProduct.id}
            </div>
            <button style={S.copyBtn} onClick={() => setShareModal(false)}>Done ✓</button>
          </div>
        </div>
      )}
      <div style={S.nav}>
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <div key={id} style={navItem(tab === id)} onClick={() => setTab(id)}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
