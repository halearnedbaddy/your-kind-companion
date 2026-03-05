import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const TIER_COLOR: Record<string, string> = { Gold: "#FFD700", Silver: "#C0C0C0", Bronze: "#CD7F32", Platinum: "#00E5FF" };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: "#0D2B1E", color: "#00D97E" }, paid: { bg: "#0D2B1E", color: "#00D97E" },
  failed: { bg: "#2B0D0D", color: "#FF4D4D" }, active: { bg: "#0D2B1E", color: "#00D97E" },
  inactive: { bg: "#1A1A1A", color: "#666" }, pending: { bg: "#1A1400", color: "#FFB800" },
  processing: { bg: "#1A1A00", color: "#FFD600" },
  C2B: { bg: "#001833", color: "#00B4FF" }, B2C: { bg: "#1A0800", color: "#FF8C00" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutAgent, setPayoutAgent] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paidDone, setPaidDone] = useState(false);
  const [agentModal, setAgentModal] = useState(false);
  const [viewAgent, setViewAgent] = useState<any>(null);
  const [txFilter, setTxFilter] = useState("All");
  const [agentSearch, setAgentSearch] = useState("");

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*, profiles(full_name, phone)");
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        name: a.profiles?.full_name || "Agent",
        phone: a.profiles?.phone || a.mpesa_phone,
        avatar: (a.profiles?.full_name || "AG").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        earned: Number(a.total_earned),
        pending: Number(a.pending_earnings),
        sales: a.total_sales,
        joined: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      }));
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*, agents(profiles(full_name), mpesa_phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        agent_name: t.agents?.profiles?.full_name || "Unknown",
      }));
    },
  });

  // Fetch products
  const { data: productsAdmin = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").order("total_sold", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payouts
  const { data: adminPayouts = [] } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts").select("*, agents(profiles(full_name), mpesa_phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        agent_name: p.agents?.profiles?.full_name || "Unknown",
        agent_phone: p.agents?.mpesa_phone || "",
      }));
    },
  });

  const totalRevenue = transactions.filter((t: any) => t.type === "C2B" && t.status === "completed").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalPayoutsAmount = adminPayouts.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingPayouts = agents.reduce((s: number, a: any) => s + a.pending, 0);
  const activeAgents = agents.filter((a: any) => a.status === "active").length;

  const handlePayout = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); setPaidDone(true); }, 2500);
    setTimeout(() => { setPaidDone(false); setPayoutModal(false); setPayoutAgent(null); }, 5000);
  };

  const pill = (type: string): React.CSSProperties => ({
    background: STATUS_STYLE[type]?.bg || "#1A1A1A", color: STATUS_STYLE[type]?.color || "#fff",
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, display: "inline-block",
  });

  const avatar = (tier: string): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: 12,
    background: `linear-gradient(135deg, ${TIER_COLOR[tier] || "#FF4D00"}44, ${TIER_COLOR[tier] || "#FF4D00"}22)`,
    border: `2px solid ${TIER_COLOR[tier] || "#FF4D00"}66`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 14, color: TIER_COLOR[tier] || "#FF4D00", flexShrink: 0,
  });

  const kpiCard = (accent: string): React.CSSProperties => ({
    background: "#0D0E14", border: `1px solid ${accent}22`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden",
  });
  const kpiGlow = (accent: string): React.CSSProperties => ({
    position: "absolute", top: -30, right: -30, width: 80, height: 80,
    background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`, borderRadius: "50%",
  });

  const navItem = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
    background: active ? "#1A1B24" : "transparent", color: active ? "#FF4D00" : "#444",
    fontSize: 13, fontWeight: active ? 700 : 500, transition: "all 0.15s",
    borderLeft: active ? "3px solid #FF4D00" : "3px solid transparent",
  });

  const chartCard: React.CSSProperties = { background: "#0D0E14", border: "1px solid #161720", borderRadius: 16, padding: "20px 24px", marginBottom: 24 };
  const chartTitle: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: "#888", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 };
  const tableWrap: React.CSSProperties = { background: "#0D0E14", border: "1px solid #161720", borderRadius: 16, overflow: "hidden" };

  const NAV = [
    { id: "overview", icon: "⚡", label: "Overview" },
    { id: "agents", icon: "👥", label: "Agents" },
    { id: "transactions", icon: "💳", label: "Transactions" },
    { id: "products", icon: "📦", label: "Products" },
    { id: "payouts", icon: "💸", label: "B2C Payouts" },
  ];

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#E8E6F0" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 6, maxWidth: 300, margin: "6px auto 0" }}>{sub}</div>
    </div>
  );

  const Overview = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>Dashboard Overview</div>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 28 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} — PayLoom Instants HQ</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {([
          ["Total Revenue", totalRevenue > 0 ? `KSh ${(totalRevenue / 1000).toFixed(0)}K` : "KSh 0", "#00D97E"],
          ["Total Payouts", totalPayoutsAmount > 0 ? `KSh ${(totalPayoutsAmount / 1000).toFixed(0)}K` : "KSh 0", "#FF8C00"],
          ["Pending Payouts", `KSh ${pendingPayouts.toLocaleString()}`, "#FFD600"],
          ["Active Agents", `${activeAgents} / ${agents.length}`, "#00B4FF"],
        ] as const).map(([label, value, accent]) => (
          <div key={label} style={kpiCard(accent)}>
            <div style={kpiGlow(accent)} />
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "-0.5px" }}>{value}</div>
          </div>
        ))}
      </div>
      {agents.length === 0 && transactions.length === 0 ? (
        <EmptyState icon="📊" title="No data yet" sub="Add agents and products via Lovable Cloud to see live analytics here" />
      ) : (
        <div style={chartCard}>
          <div style={chartTitle}>Top Performing Agents</div>
          {agents.length === 0 ? (
            <div style={{ fontSize: 13, color: "#555", padding: 20, textAlign: "center" }}>No agents registered yet</div>
          ) : [...agents].sort((a: any, b: any) => b.earned - a.earned).slice(0, 4).map((a: any, i: number) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? "#FFD700" : "#444", width: 20 }}>#{i + 1}</div>
              <div style={avatar(a.tier)}>{a.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "#444" }}>{a.sales} sales · {a.tier}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#00D97E" }}>KSh {a.earned.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AgentsTab = () => {
    const filtered = agents.filter((a: any) => a.name.toLowerCase().includes(agentSearch.toLowerCase()));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>Agent Management</div>
            <div style={{ fontSize: 13, color: "#444" }}>View, manage and pay your seller agents</div>
          </div>
          <input style={{ background: "#0D0E14", border: "1px solid #1F1F2E", borderRadius: 10, padding: "10px 14px", color: "#E8E6F0", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", width: 220 }}
            placeholder="🔍  Search agents..." value={agentSearch} onChange={e => setAgentSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="👥" title="No agents yet" sub="Agents will appear here once they register via the platform" />
        ) : filtered.map((a: any) => (
          <div key={a.id} style={{ background: "#0D0E14", border: "1px solid #161720", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 10, cursor: "pointer" }}
            onClick={() => { setViewAgent(a); setAgentModal(true); }}>
            <div style={avatar(a.tier)}>{a.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</span>
                <span style={{ background: `${TIER_COLOR[a.tier]}22`, color: TIER_COLOR[a.tier], fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5 }}>{a.tier}</span>
                <span style={{ ...pill(a.status), fontSize: 9 }}>{a.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>{a.phone} · Joined {a.joined}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#555" }}>Sales: <b style={{ color: "#E8E6F0" }}>{a.sales}</b></span>
                <span style={{ fontSize: 11, color: "#555" }}>Earned: <b style={{ color: "#00D97E" }}>KSh {a.earned.toLocaleString()}</b></span>
                <span style={{ fontSize: 11, color: "#555" }}>Pending: <b style={{ color: "#FFD600" }}>KSh {a.pending.toLocaleString()}</b></span>
              </div>
            </div>
            <button style={{ background: "#FF4D00", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); setPayoutAgent(a); setPayoutModal(true); }}>💸 Pay Out</button>
          </div>
        ))}
      </div>
    );
  };

  const TransactionsTab = () => {
    const filters = ["All", "C2B", "B2C", "completed", "failed"];
    const filtered = txFilter === "All" ? transactions : transactions.filter((t: any) => t.type === txFilter || t.status === txFilter);
    return (
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>All Transactions</div>
        <div style={{ fontSize: 13, color: "#444", marginBottom: 24 }}>Every C2B and B2C transaction on PayLoom Instants</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setTxFilter(f)} style={{ background: txFilter === f ? "#FF4D00" : "#0D0E14", border: `1px solid ${txFilter === f ? "#FF4D00" : "#1F1F2E"}`, borderRadius: 8, padding: "6px 14px", color: txFilter === f ? "#fff" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="💳" title="No transactions" sub="Transactions will appear when payments are processed" />
        ) : (
          <div style={tableWrap}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr", padding: "12px 20px", background: "#0A0B10", borderBottom: "1px solid #161720", fontSize: 10, fontWeight: 800, color: "#444", letterSpacing: 1, textTransform: "uppercase" }}>
              <span>TX ID</span><span>Agent</span><span>Amount</span><span>Type</span><span>Status</span><span>M-Pesa Ref</span>
            </div>
            {filtered.map((t: any) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr", padding: "13px 20px", borderBottom: "1px solid #0F1018", fontSize: 13, alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", color: "#FF8C00", fontSize: 12 }}>{t.transaction_ref}</span>
                <span style={{ fontSize: 12 }}>{t.agent_name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.type === "B2C" ? "#FF8C00" : "#00D97E" }}>{t.type === "B2C" ? "−" : "+"}KSh {Number(t.amount).toLocaleString()}</span>
                <span style={pill(t.type)}>{t.type}</span>
                <span style={pill(t.status)}>{t.status}</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#333" }}>{t.mpesa_ref || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProductsTab = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>Product Catalog</div>
          <div style={{ fontSize: 13, color: "#444" }}>Manage PayLoom's inventory</div>
        </div>
      </div>
      {productsAdmin.length === 0 ? (
        <EmptyState icon="📦" title="No products" sub="Add products to the database via Lovable Cloud to see them here" />
      ) : (
        <div style={tableWrap}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", background: "#0A0B10", borderBottom: "1px solid #161720", fontSize: 10, fontWeight: 800, color: "#444", letterSpacing: 1, textTransform: "uppercase" }}>
            <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Sold</span>
          </div>
          {productsAdmin.map((p: any) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: "1px solid #0F1018", fontSize: 13, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.emoji || "📦"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{p.total_sold} sold</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>{(p as any).categories?.name || "—"}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>KSh {Number(p.price).toLocaleString()}</span>
              <span>{p.stock === 0 ? <span style={pill("failed")}>Out</span> : <span style={pill("completed")}>{p.stock}</span>}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#00D97E" }}>{p.total_sold}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PayoutsTab = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>B2C Payouts</div>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 24 }}>Disburse earnings to agents via M-Pesa B2C</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {([["Total Pending", `KSh ${pendingPayouts.toLocaleString()}`, "#FFD600"], ["Paid Out", `KSh ${totalPayoutsAmount.toLocaleString()}`, "#00D97E"], ["Agents Pending", `${agents.filter((a: any) => a.pending > 0).length} agents`, "#FF4D00"]] as const).map(([label, value, accent]) => (
          <div key={label} style={kpiCard(accent)}>
            <div style={kpiGlow(accent)} />
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: "-0.5px" }}>{value}</div>
          </div>
        ))}
      </div>
      {agents.filter((a: any) => a.pending > 0).length === 0 ? (
        <EmptyState icon="💸" title="No pending payouts" sub="Agent earnings will appear here when orders are processed" />
      ) : (
        <div style={chartCard}>
          <div style={chartTitle}>Agents Awaiting Payout</div>
          {agents.filter((a: any) => a.pending > 0).map((a: any) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #0F1018" }}>
              <div style={avatar(a.tier)}>{a.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#444" }}>M-Pesa: {a.phone}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#FFD600" }}>KSh {a.pending.toLocaleString()}</div>
              </div>
              <button style={{ background: "#FF4D00", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onClick={() => { setPayoutAgent(a); setPayoutModal(true); }}>Send via M-Pesa →</button>
            </div>
          ))}
        </div>
      )}
      {adminPayouts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...chartTitle, marginBottom: 12 }}>Recent Payouts</div>
          <div style={tableWrap}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "12px 20px", background: "#0A0B10", borderBottom: "1px solid #161720", fontSize: 10, fontWeight: 800, color: "#444", letterSpacing: 1, textTransform: "uppercase" }}>
              <span>Agent</span><span>Amount</span><span>Ref</span><span>Date</span><span>Status</span>
            </div>
            {adminPayouts.map((p: any) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: "1px solid #0F1018", fontSize: 13, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{p.agent_name}</span>
                <span style={{ fontWeight: 800, color: "#FF8C00" }}>KSh {Number(p.amount).toLocaleString()}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#444" }}>{p.payout_ref}</span>
                <span style={{ fontSize: 12, color: "#555" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                <span style={pill(p.status)}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const TABS: Record<string, React.FC> = { overview: Overview, agents: AgentsTab, transactions: TransactionsTab, products: ProductsTab, payouts: PayoutsTab };
  const ActiveTab = TABS[tab];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#07080C", minHeight: "100vh", color: "#E8E6F0" }}>
      {/* Sidebar */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "#0D0E14", borderRight: "1px solid #161720", display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 100 }}>
        <div style={{ padding: "0 20px 28px", borderBottom: "1px solid #161720" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #FF4D00, #FF8C00)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff" }}>P</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>PayLoom</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#FF4D00", letterSpacing: 2, textTransform: "uppercase" }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(({ id, icon, label }) => (
            <div key={id} style={navItem(tab === id)} onClick={() => setTab(id)}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #161720", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#FF4D00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>AD</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Admin</div>
            <div style={{ fontSize: 10, color: "#444" }}>PayLoom HQ</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, background: "#00D97E", borderRadius: "50%" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, padding: "28px 28px 60px" }}>
        <ActiveTab />
      </div>

      {/* Payout Modal */}
      {payoutModal && payoutAgent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => { setPayoutModal(false); setPaidDone(false); setPaying(false); }}>
          <div style={{ background: "#0D0E14", border: "1px solid #2A2A36", borderRadius: 20, padding: 28, width: 420, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            {paidDone ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Payout Sent!</div>
                <div style={{ fontSize: 13, color: "#555" }}>KSh {payoutAgent.pending.toLocaleString()} sent to {payoutAgent.phone} via M-Pesa B2C</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Confirm B2C Payout 💸</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>Send money via M-Pesa B2C API</div>
                {([["Agent", payoutAgent.name], ["M-Pesa", payoutAgent.phone], ["Amount", `KSh ${payoutAgent.pending.toLocaleString()}`]] as const).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #161720", fontSize: 13 }}>
                    <span style={{ color: "#555" }}>{label}</span>
                    <span style={{ fontWeight: 700, color: label === "Amount" ? "#FFD600" : "#E8E6F0" }}>{value}</span>
                  </div>
                ))}
                <button style={{ background: "#FF4D00", border: "none", borderRadius: 12, padding: 14, width: "100%", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 20, opacity: paying ? 0.7 : 1 }}
                  onClick={handlePayout} disabled={paying}>
                  {paying ? "⏳ Sending via M-Pesa B2C..." : `Confirm & Send KSh ${payoutAgent.pending.toLocaleString()} →`}
                </button>
                <button style={{ background: "#16161E", border: "1px solid #2A2A36", borderRadius: 12, padding: 12, width: "100%", color: "#888", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 8 }}
                  onClick={() => setPayoutModal(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {agentModal && viewAgent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setAgentModal(false)}>
          <div style={{ background: "#0D0E14", border: "1px solid #2A2A36", borderRadius: 20, padding: 28, width: 480, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ ...avatar(viewAgent.tier), width: 56, height: 56, fontSize: 18 }}>{viewAgent.avatar}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{viewAgent.name}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{viewAgent.phone} · Joined {viewAgent.joined}</div>
              </div>
            </div>
            {([["Total Sales", viewAgent.sales.toString()], ["Total Earned", `KSh ${viewAgent.earned.toLocaleString()}`], ["Pending Payout", `KSh ${viewAgent.pending.toLocaleString()}`]] as const).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #161720", fontSize: 13 }}>
                <span style={{ color: "#555" }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{value}</span>
              </div>
            ))}
            <button style={{ background: "#FF4D00", border: "none", borderRadius: 12, padding: 14, width: "100%", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 20 }}
              onClick={() => { setAgentModal(false); setPayoutAgent(viewAgent); setPayoutModal(true); }}>💸 Send Payout</button>
            <button style={{ background: "#16161E", border: "1px solid #2A2A36", borderRadius: 12, padding: 12, width: "100%", color: "#888", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 8 }}
              onClick={() => setAgentModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
