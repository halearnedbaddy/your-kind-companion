import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LayoutDashboard, Users, CreditCard, Package, Banknote, ChevronRight, TrendingUp, Clock, AlertCircle, LogOut } from "lucide-react";
import { MOCK_AGENTS, MOCK_TRANSACTIONS, MOCK_PRODUCTS_ADMIN, MOCK_MONTHLY } from "@/data/mockData";

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
  const { signOut } = useAuth();
  const [tab, setTab] = useState("overview");
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutAgent, setPayoutAgent] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paidDone, setPaidDone] = useState(false);
  const [agentModal, setAgentModal] = useState(false);
  const [viewAgent, setViewAgent] = useState<any>(null);
  const [txFilter, setTxFilter] = useState("All");
  const [agentSearch, setAgentSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: dbAgents = [] } = useQuery({
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

  const { data: dbTransactions = [] } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*, agents(profiles(full_name), mpesa_phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({ ...t, agent_name: t.agents?.profiles?.full_name || "Unknown" }));
    },
  });

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").order("total_sold", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dbPayouts = [] } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts").select("*, agents(profiles(full_name), mpesa_phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, agent_name: p.agents?.profiles?.full_name || "Unknown", agent_phone: p.agents?.mpesa_phone || "" }));
    },
  });

  // Use mock data as fallback
  const agents = dbAgents.length > 0 ? dbAgents : MOCK_AGENTS;
  const transactions = dbTransactions.length > 0 ? dbTransactions : MOCK_TRANSACTIONS;
  const productsAdmin = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS_ADMIN;
  const adminPayouts = dbPayouts;

  const totalRevenue = dbTransactions.length > 0
    ? transactions.filter((t: any) => t.type === "C2B" && t.status === "completed").reduce((s: number, t: any) => s + Number(t.amount), 0)
    : MOCK_MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalPayoutsAmount = dbPayouts.length > 0
    ? adminPayouts.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0)
    : MOCK_MONTHLY.reduce((s, m) => s + m.payouts, 0);
  const pendingPayouts = agents.reduce((s: number, a: any) => s + (a.pending || 0), 0);
  const activeAgents = agents.filter((a: any) => a.status === "active").length;
  const maxRevenue = Math.max(...MOCK_MONTHLY.map(m => m.revenue));

  const handlePayout = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); setPaidDone(true); }, 2500);
    setTimeout(() => { setPaidDone(false); setPayoutModal(false); setPayoutAgent(null); }, 5000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const pill = (type: string) => ({
    background: STATUS_STYLE[type]?.bg || "#1A1A1A", color: STATUS_STYLE[type]?.color || "#fff",
    fontSize: 10, fontWeight: 700 as const, padding: "3px 8px", borderRadius: 6, display: "inline-block" as const,
  });

  const NAV = [
    { id: "overview", icon: <LayoutDashboard size={18} />, label: "Overview" },
    { id: "agents", icon: <Users size={18} />, label: "Agents" },
    { id: "transactions", icon: <CreditCard size={18} />, label: "Transactions" },
    { id: "products", icon: <Package size={18} />, label: "Products" },
    { id: "payouts", icon: <Banknote size={18} />, label: "B2C Payouts" },
  ];

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <div className="text-center py-16 px-5">
      <div className="text-6xl mb-3">{icon}</div>
      <div className="text-lg font-extrabold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">{sub}</div>
    </div>
  );

  const KpiCard = ({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${accent}22`, color: accent }}>{icon}</div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</div>
    </div>
  );

  const Overview = () => (
    <div>
      <div className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">Dashboard Overview</div>
      <div className="text-sm text-muted-foreground mb-6">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} — PayLoom Instants HQ
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KpiCard label="Revenue" value={`KSh ${(totalRevenue / 1000).toFixed(0)}K`} accent="#00D97E" icon={<TrendingUp size={16} />} />
        <KpiCard label="Paid Out" value={`KSh ${(totalPayoutsAmount / 1000).toFixed(0)}K`} accent="#FF8C00" icon={<Banknote size={16} />} />
        <KpiCard label="Pending" value={`KSh ${(pendingPayouts / 1000).toFixed(1)}K`} accent="#FFD600" icon={<Clock size={16} />} />
        <KpiCard label="Agents" value={`${activeAgents} / ${agents.length}`} accent="#00B4FF" icon={<Users size={16} />} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-extrabold text-muted-foreground tracking-widest uppercase">Monthly Revenue vs Payouts</div>
          <div className="flex gap-4 text-[11px]">
            <span style={{ color: "#00D97E" }}>■ Revenue</span>
            <span style={{ color: "#FF8C00" }}>■ Payouts</span>
          </div>
        </div>
        <div className="flex gap-2 items-end h-[140px]">
          {MOCK_MONTHLY.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col gap-1">
              <div className="flex gap-0.5 items-end h-[120px]">
                <div className="flex-1 rounded-t" style={{ height: `${Math.round(m.revenue / maxRevenue * 100)}%`, minHeight: 4, background: "linear-gradient(180deg,#00D97E,#00A86B)", transition: "height 0.6s" }} />
                <div className="flex-1 rounded-t" style={{ height: `${Math.round(m.payouts / maxRevenue * 100)}%`, minHeight: 4, background: "linear-gradient(180deg,#FF8C00,#FF4D00)", transition: "height 0.6s" }} />
              </div>
              <div className="text-[10px] text-muted-foreground text-center">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="text-xs font-extrabold text-muted-foreground tracking-widest uppercase mb-4">Top Performing Agents</div>
        {[...agents].sort((a: any, b: any) => (b.earned || 0) - (a.earned || 0)).slice(0, 4).map((a: any, i: number) => (
          <div key={a.id} className="flex items-center gap-3 mb-3 last:mb-0">
            <div className="text-base font-extrabold w-5" style={{ color: i === 0 ? "#FFD700" : "#444" }}>#{i + 1}</div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
              style={{ background: `${TIER_COLOR[a.tier] || "#FF4D00"}22`, border: `2px solid ${TIER_COLOR[a.tier] || "#FF4D00"}44`, color: TIER_COLOR[a.tier] || "#FF4D00" }}>
              {a.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.sales} sales · {a.tier}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold" style={{ color: "#00D97E" }}>KSh {(a.earned || 0).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">total earned</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AgentsTab = () => {
    const filtered = agents.filter((a: any) => a.name.toLowerCase().includes(agentSearch.toLowerCase()));
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">Agent Management</div>
            <div className="text-sm text-muted-foreground">View, manage and pay your seller agents</div>
          </div>
          <input className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none w-full sm:w-56"
            placeholder="🔍  Search agents..." value={agentSearch} onChange={e => setAgentSearch(e.target.value)} />
        </div>
        {filtered.map((a: any) => (
          <div key={a.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-3 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => { setViewAgent(a); setAgentModal(true); }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
                style={{ background: `${TIER_COLOR[a.tier] || "#FF4D00"}22`, border: `2px solid ${TIER_COLOR[a.tier] || "#FF4D00"}44`, color: TIER_COLOR[a.tier] || "#FF4D00" }}>
                {a.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold">{a.name}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded" style={{ background: `${TIER_COLOR[a.tier]}22`, color: TIER_COLOR[a.tier] }}>{a.tier}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={pill(a.status)}>{a.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{a.phone} · Joined {a.joined}</div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Sales: <b className="text-foreground">{a.sales}</b></span>
                  <span className="text-xs text-muted-foreground">Earned: <b style={{ color: "#00D97E" }}>KSh {(a.earned || 0).toLocaleString()}</b></span>
                  <span className="text-xs text-muted-foreground">Pending: <b style={{ color: "#FFD600" }}>KSh {(a.pending || 0).toLocaleString()}</b></span>
                </div>
              </div>
            </div>
            <button className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-extrabold shrink-0 hover:opacity-90 transition-opacity"
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
        <div className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">All Transactions</div>
        <div className="text-sm text-muted-foreground mb-6">Every C2B and B2C transaction on PayLoom Instants</div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setTxFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${txFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-6 px-5 py-3 bg-accent/50 border-b border-border text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
                <span>TX ID</span><span>Agent</span><span>Amount</span><span>Type</span><span>Status</span><span>M-Pesa Ref</span>
              </div>
              {filtered.map((t: any) => (
                <div key={t.id} className="grid grid-cols-6 px-5 py-3 border-b border-border/50 text-sm items-center">
                  <span className="font-mono text-xs" style={{ color: "#FF8C00" }}>{t.transaction_ref}</span>
                  <span className="text-xs truncate">{t.agent_name}</span>
                  <span className="text-sm font-bold" style={{ color: t.type === "B2C" ? "#FF8C00" : "#00D97E" }}>{t.type === "B2C" ? "−" : "+"}KSh {Number(t.amount).toLocaleString()}</span>
                  <span style={pill(t.type)}>{t.type}</span>
                  <span style={pill(t.status)}>{t.status}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{t.mpesa_ref || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProductsTab = () => (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">Product Catalog</div>
          <div className="text-sm text-muted-foreground">Manage PayLoom's inventory</div>
        </div>
        <button className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-extrabold hover:opacity-90 transition-opacity">+ Add Product</button>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[550px]">
            <div className="grid grid-cols-5 px-5 py-3 bg-accent/50 border-b border-border text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span className="col-span-1">Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Sold</span>
            </div>
            {productsAdmin.map((p: any) => (
              <div key={p.id} className="grid grid-cols-5 px-5 py-3 border-b border-border/50 text-sm items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.emoji || "📦"}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.total_sold} sold</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{p.categories?.name || "—"}</span>
                <span className="text-sm font-bold">KSh {Number(p.price).toLocaleString()}</span>
                <span>{p.stock === 0 ? <span style={pill("failed")}>Out</span> : <span style={pill("completed")}>{p.stock}</span>}</span>
                <span className="text-sm font-extrabold" style={{ color: "#00D97E" }}>{p.total_sold}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const PayoutsTab = () => (
    <div>
      <div className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">B2C Payouts</div>
      <div className="text-sm text-muted-foreground mb-6">Disburse earnings to agents via M-Pesa B2C</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Total Pending" value={`KSh ${pendingPayouts.toLocaleString()}`} accent="#FFD600" icon={<Clock size={16} />} />
        <KpiCard label="Paid Out" value={`KSh ${totalPayoutsAmount.toLocaleString()}`} accent="#00D97E" icon={<TrendingUp size={16} />} />
        <KpiCard label="Agents Pending" value={`${agents.filter((a: any) => (a.pending || 0) > 0).length} agents`} accent="#FF4D00" icon={<AlertCircle size={16} />} />
      </div>

      {/* Agents awaiting payout */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs font-extrabold text-muted-foreground tracking-widest uppercase mb-4">Agents Awaiting Payout</div>
        {agents.filter((a: any) => (a.pending || 0) > 0).map((a: any) => (
          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
                style={{ background: `${TIER_COLOR[a.tier] || "#FF4D00"}22`, border: `2px solid ${TIER_COLOR[a.tier] || "#FF4D00"}44`, color: TIER_COLOR[a.tier] || "#FF4D00" }}>
                {a.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground">M-Pesa: {a.phone || a.mpesa_phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-base font-extrabold" style={{ color: "#FFD600" }}>KSh {(a.pending || 0).toLocaleString()}</div>
              <button className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-xs font-extrabold shrink-0 hover:opacity-90 transition-opacity"
                onClick={() => { setPayoutAgent(a); setPayoutModal(true); }}>Send via M-Pesa →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Payouts from B2C transactions */}
      <div className="text-xs font-extrabold text-muted-foreground tracking-widest uppercase mb-3">Recent Payouts</div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-5 px-5 py-3 bg-accent/50 border-b border-border text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span>Agent</span><span>Amount</span><span>M-Pesa Ref</span><span>Date</span><span>Status</span>
            </div>
            {(adminPayouts.length > 0 ? adminPayouts : MOCK_TRANSACTIONS.filter(t => t.type === "B2C")).map((t: any) => (
              <div key={t.id} className="grid grid-cols-5 px-5 py-3 border-b border-border/50 text-sm items-center">
                <span className="font-semibold truncate">{t.agent_name}</span>
                <span className="font-extrabold" style={{ color: "#FF8C00" }}>KSh {Number(t.amount).toLocaleString()}</span>
                <span className="font-mono text-xs text-muted-foreground">{t.payout_ref || t.mpesa_ref || "—"}</span>
                <span className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : t.time}</span>
                <span style={pill(t.status)}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TABS: Record<string, React.FC> = { overview: Overview, agents: AgentsTab, transactions: TransactionsTab, products: ProductsTab, payouts: PayoutsTab };
  const ActiveTab = TABS[tab];

  return (
    <div className="font-jakarta bg-background min-h-screen text-foreground">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border flex flex-col z-50 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-6 border-b border-border">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-payloom-orange-light rounded-xl flex items-center justify-center font-black text-base text-primary-foreground">P</div>
            <div>
              <div className="text-base font-extrabold tracking-tight">PayLoom</div>
              <div className="text-[9px] font-bold text-primary tracking-[2px] uppercase">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          {NAV.map(({ id, icon, label }) => (
            <button key={id}
              onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left border-l-[3px] ${tab === id ? 'bg-accent text-primary border-primary font-bold' : 'text-muted-foreground border-transparent hover:bg-accent/50'}`}>
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-payloom-orange-light flex items-center justify-center font-extrabold text-xs text-primary-foreground">AD</div>
            <div>
              <div className="text-xs font-bold">Admin</div>
              <div className="text-[10px] text-muted-foreground">PayLoom HQ</div>
            </div>
            <div className="ml-auto w-2 h-2 bg-payloom-success rounded-full" />
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-payloom-orange-light rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">P</div>
          <span className="text-sm font-extrabold">PayLoom Admin</span>
        </div>
      </div>

      {/* Main */}
      <main className="md:ml-[220px] pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-7 max-w-6xl">
          <ActiveTab />
        </div>
      </main>

      {/* Payout Modal */}
      {payoutModal && payoutAgent && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[999] p-4"
          onClick={() => { setPayoutModal(false); setPaidDone(false); setPaying(false); }}>
          <div className="bg-card border border-border rounded-2xl p-7 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {paidDone ? (
              <div className="text-center py-5">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl font-extrabold mb-2">Payout Sent!</div>
                <div className="text-sm text-muted-foreground">KSh {(payoutAgent.pending || 0).toLocaleString()} sent to {payoutAgent.phone || payoutAgent.mpesa_phone} via M-Pesa B2C</div>
                <div className="mt-4 bg-accent rounded-xl p-3 text-xs">
                  <span className="text-muted-foreground">Ref: </span>
                  <span className="text-primary font-mono">PLB{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-lg font-extrabold mb-1">Confirm B2C Payout 💸</div>
                <div className="text-sm text-muted-foreground mb-5">Send money via M-Pesa B2C API</div>
                {([
                  ["Agent", payoutAgent.name],
                  ["M-Pesa", payoutAgent.phone || payoutAgent.mpesa_phone],
                  ["Amount", `KSh ${(payoutAgent.pending || 0).toLocaleString()}`],
                  ["Commission", `${payoutAgent.tier === "Platinum" ? 18 : payoutAgent.tier === "Gold" ? 12 : payoutAgent.tier === "Silver" ? 10 : 8}% rate`],
                  ["Source", "PayLoom Merchant Account"],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-3 border-b border-border text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold" style={{ color: label === "Amount" ? "#FFD600" : undefined }}>{value}</span>
                  </div>
                ))}
                <button className="bg-primary text-primary-foreground rounded-xl py-3.5 w-full text-sm font-extrabold mt-5 hover:opacity-90 transition-opacity disabled:opacity-60"
                  onClick={handlePayout} disabled={paying}>
                  {paying ? "⏳ Sending via M-Pesa B2C..." : `Confirm & Send KSh ${(payoutAgent.pending || 0).toLocaleString()} →`}
                </button>
                <button className="bg-accent border border-border rounded-xl py-3 w-full text-sm font-bold text-muted-foreground mt-2 hover:bg-accent/80 transition-colors"
                  onClick={() => setPayoutModal(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {agentModal && viewAgent && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[999] p-4"
          onClick={() => setAgentModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-7 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg"
                style={{ background: `${TIER_COLOR[viewAgent.tier] || "#FF4D00"}22`, border: `2px solid ${TIER_COLOR[viewAgent.tier] || "#FF4D00"}44`, color: TIER_COLOR[viewAgent.tier] || "#FF4D00" }}>
                {viewAgent.avatar}
              </div>
              <div>
                <div className="text-lg font-extrabold">{viewAgent.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{viewAgent.phone || viewAgent.mpesa_phone} · Joined {viewAgent.joined}</div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded" style={{ background: `${TIER_COLOR[viewAgent.tier]}22`, color: TIER_COLOR[viewAgent.tier] }}>{viewAgent.tier}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={pill(viewAgent.status)}>{viewAgent.status}</span>
                </div>
              </div>
            </div>
            {([["Total Sales", (viewAgent.sales || 0).toString()], ["Total Earned", `KSh ${(viewAgent.earned || 0).toLocaleString()}`], ["Pending Payout", `KSh ${(viewAgent.pending || 0).toLocaleString()}`]] as const).map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 border-b border-border text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
            <button className="bg-primary text-primary-foreground rounded-xl py-3.5 w-full text-sm font-extrabold mt-5 hover:opacity-90 transition-opacity"
              onClick={() => { setAgentModal(false); setPayoutAgent(viewAgent); setPayoutModal(true); }}>💸 Send Payout to This Agent</button>
            <button className="bg-accent border border-border rounded-xl py-3 w-full text-sm font-bold text-muted-foreground mt-2 hover:bg-accent/80 transition-colors"
              onClick={() => setAgentModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
