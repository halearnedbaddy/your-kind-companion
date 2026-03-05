import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Package, FileText, Banknote, User, Bell, Link2, Copy, Check, LogOut } from "lucide-react";
import { MOCK_ORDERS_AGENT, MOCK_PAYOUTS_AGENT, MOCK_PRODUCTS_SHOP, MOCK_WEEKLY } from "@/data/mockData";

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
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("home");
  const [shareModal, setShareModal] = useState(false);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: agentData } = useQuery({
    queryKey: ["agent-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*, profiles(full_name, phone)").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["agent-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dbOrders = [] } = useQuery({
    queryKey: ["agent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dbPayouts = [] } = useQuery({
    queryKey: ["agent-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Use mock data as fallback when DB is empty
  const products = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS_SHOP.slice(0, 5).map(p => ({ ...p, categories: { name: p.category_name } }));
  const orders = dbOrders.length > 0 ? dbOrders : MOCK_ORDERS_AGENT;
  const payouts = dbPayouts.length > 0 ? dbPayouts : MOCK_PAYOUTS_AGENT;

  const agent = agentData as any;
  const agentName = agent?.profiles?.full_name || user?.user_metadata?.full_name || "Agent";
  const agentPhone = agent?.profiles?.phone || agent?.mpesa_phone || "";
  const agentAvatar = agentName.split(" ").map((n: string) => n[0]).join("").substring(0, 2);
  const pendingEarnings = agent?.pending_earnings || 4572;
  const totalEarnings = agent?.total_earned || 42650;
  const totalSales = agent?.total_sales || 58;
  const commissionRate = agent?.commission_rate || 12;
  const tier = agent?.tier || "Gold";

  const maxEarnings = Math.max(...MOCK_WEEKLY.map(d => d.earnings));

  const statusPill = (s: string) => ({
    background: STATUS_STYLE[s]?.bg || "#1A1A1A", color: STATUS_STYLE[s]?.color || "#fff",
    fontSize: 10, fontWeight: 700 as const, padding: "3px 8px", borderRadius: 6,
  });

  const handleCopyLink = (productId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shop?ref=${agent?.id || 'agent'}&product=${productId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const NAV_ITEMS = [
    { id: "home", icon: <Home size={20} />, label: "Home" },
    { id: "products", icon: <Package size={20} />, label: "Products" },
    { id: "orders", icon: <FileText size={20} />, label: "Orders" },
    { id: "payouts", icon: <Banknote size={20} />, label: "Payouts" },
    { id: "profile", icon: <User size={20} />, label: "Profile" },
  ];

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <div className="text-center py-10 px-5">
      <div className="text-5xl mb-2">{icon}</div>
      <div className="text-base font-bold">{title}</div>
      <div className="text-sm text-[#555] mt-1">{sub}</div>
    </div>
  );

  const HomeTab = () => (
    <div>
      <div className="px-4 pt-4 flex items-center gap-2.5">
        <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-primary to-[#FF8C00] flex items-center justify-center font-black text-[15px] text-white">{agentAvatar || "AG"}</div>
        <div>
          <div className="text-[13px] text-[#666]">Good morning 👋</div>
          <div className="text-base font-extrabold">{agentName}</div>
        </div>
        <div className="ml-auto text-[11px] font-extrabold px-2.5 py-1 rounded-lg border" style={{ background: "#1A1000", borderColor: `${TIER_COLOR[tier]}33`, color: TIER_COLOR[tier] }}>⭐ {tier}</div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#1A0A00] via-[#2B1400] to-[#1A0A00] border border-[#3D1F00] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,77,0,0.3)_0%,transparent_70%)] rounded-full" />
        <div className="text-[11px] text-[#FF8C5A] font-bold tracking-widest uppercase">Pending Earnings</div>
        <div className="text-[34px] font-extrabold tracking-tighter text-white my-1.5">KSh {Number(pendingEarnings).toLocaleString()}</div>
        <div className="text-xs text-[#AA7755]">Commission rate: {commissionRate}% per sale</div>
        <button className="mt-3.5 bg-primary border-none rounded-xl py-3 w-full text-white text-sm font-extrabold cursor-pointer">
          Request Payout via M-Pesa →
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
        {[
          [`KSh ${Number(totalEarnings).toLocaleString()}`, "Total Earned", "#00D97E", "↑ 18% this month"],
          [totalSales.toString(), "Total Sales", "#FFD600", "↑ 7 this week"],
          [`${commissionRate}%`, "Conversion Rate", "#00B4FF", "↑ 4% vs last week"],
          [products.length.toString(), "Active Listings", "#FF4D00", "1 out of stock"],
        ].map(([value, label, color, sub]) => (
          <div key={label as string} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3.5">
            <div className="text-[22px] font-extrabold tracking-tight" style={{ color: color as string }}>{value}</div>
            <div className="text-[11px] text-[#666] font-semibold mt-0.5">{label}</div>
            <div className="text-[11px] font-bold mt-1.5" style={{ color: color as string }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="px-4 pt-5">
        <div className="text-xs font-extrabold text-[#888] tracking-widest uppercase mb-3">This Week</div>
        <div className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-4">
          <div className="flex justify-between mb-2.5">
            <span className="text-xs text-[#666]">Daily Earnings</span>
            <span className="text-xs text-primary font-bold">KSh 70,200 total</span>
          </div>
          <div className="flex items-end gap-1.5 h-20 mb-2">
            {MOCK_WEEKLY.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.round((d.earnings / maxEarnings) * 100)}%`,
                    minHeight: 4,
                    background: i === 4 ? "linear-gradient(180deg, #FF4D00, #FF8C00)" : "#1F1F2E",
                    transition: "height 0.6s ease",
                  }}
                />
                <div className="text-[10px] text-[#444]">{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-4 pt-5">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-extrabold text-[#888] tracking-widest uppercase">Recent Orders</div>
          <span onClick={() => setTab("orders")} className="text-xs text-primary cursor-pointer font-bold">See all →</span>
        </div>
        {orders.slice(0, 3).map((o: any) => (
          <div key={o.id} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#0C0C10] rounded-xl flex items-center justify-center text-xl">📦</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate">{o.customer_name || "Customer"}</div>
              <div className="text-[11px] text-[#555] mt-0.5">{o.order_number || o.product}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-extrabold" style={{ color: "#00D97E" }}>+KSh {Number(o.commission_amount || o.total_amount * 0.12).toLocaleString()}</div>
              <span style={statusPill(o.status)}>{STATUS_STYLE[o.status]?.label || o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProductsTab = () => (
    <div className="px-4 pt-4">
      <div className="text-xl font-extrabold mb-1">My Products</div>
      <div className="text-[13px] text-[#555] mb-4">Share your link to earn commission on every sale</div>
      {products.map((p: any) => (
        <div key={p.id} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3 flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-[#0C0C10] rounded-xl flex items-center justify-center text-[26px] shrink-0">{p.emoji || "📦"}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold truncate">{p.name}</div>
            <div className="text-[11px] text-[#555] mt-0.5">KSh {Number(p.price).toLocaleString()} · {p.total_sold} sold</div>
            <div className="flex gap-1.5 items-center mt-1.5 flex-wrap">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={statusPill(p.stock === 0 ? "cancelled" : "delivered")}>{p.stock === 0 ? "Out of Stock" : `${p.stock} in stock`}</span>
              <span className="text-[10px] text-primary font-bold">+KSh {Math.round(Number(p.price) * commissionRate / 100).toLocaleString()} commission</span>
            </div>
          </div>
          <button onClick={() => { setShareProduct(p); setShareModal(true); }}
            className="bg-[#1F1F2E] border border-[#2A2A36] rounded-xl px-3 py-2 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 shrink-0">
            <Link2 size={12} /> Share
          </button>
        </div>
      ))}
    </div>
  );

  const OrdersTab = () => (
    <div className="px-4 pt-4">
      <div className="text-xl font-extrabold mb-1">My Orders</div>
      <div className="text-[13px] text-[#555] mb-4">All customer orders and your commission earnings</div>
      {/* Summary pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {[["All", orders.length, "#FF4D00"], ["Delivered", orders.filter((o: any) => o.status === "delivered").length, "#00D97E"], ["Processing", orders.filter((o: any) => o.status === "processing").length, "#FFD600"], ["Cancelled", orders.filter((o: any) => o.status === "cancelled").length, "#FF4D4D"]].map(([label, count, color]) => (
          <div key={label as string} className="bg-[#16161E] border border-[#1F1F2E] rounded-xl px-3.5 py-2 whitespace-nowrap">
            <span className="text-sm font-extrabold" style={{ color: color as string }}>{count as number}</span>
            <span className="text-[11px] text-[#555] ml-1">{label as string}</span>
          </div>
        ))}
      </div>
      {orders.map((o: any) => (
        <div key={o.id} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#555] font-bold">{o.order_number}</span>
            <span style={statusPill(o.status)}>{STATUS_STYLE[o.status]?.label || o.status}</span>
          </div>
          <div className="flex justify-between items-center border-t border-[#1F1F2E] pt-2 mt-2">
            <div>
              <div className="text-xs text-[#555]">{o.customer_name || "Customer"}</div>
              <div className="text-xs text-[#444] mt-0.5">{new Date(o.created_at).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#555]">Sale: KSh {Number(o.total_amount).toLocaleString()}</div>
              <div className="text-[13px] font-extrabold mt-0.5" style={{ color: "#00D97E" }}>Your cut: KSh {Number(o.commission_amount).toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const PayoutsTab = () => (
    <div className="px-4 pt-4">
      <div className="text-xl font-extrabold mb-1">Payouts</div>
      <div className="text-[13px] text-[#555] mb-4">Earnings sent to your M-Pesa</div>
      <div className="bg-gradient-to-br from-[#1A0A00] via-[#2B1400] to-[#1A0A00] border border-[#3D1F00] rounded-2xl p-5 relative overflow-hidden mb-4">
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,77,0,0.3)_0%,transparent_70%)] rounded-full" />
        <div className="text-[11px] text-[#FF8C5A] font-bold tracking-widest uppercase">Available to Request</div>
        <div className="text-[28px] font-extrabold tracking-tighter text-white my-1.5">KSh {Number(pendingEarnings).toLocaleString()}</div>
        <div className="text-xs text-[#AA7755]">Will be sent to {agentPhone || "your M-Pesa"}</div>
        <button className="mt-3.5 bg-primary border-none rounded-xl py-3 w-full text-white text-sm font-extrabold cursor-pointer">
          Request Payout Now →
        </button>
      </div>
      <div className="text-xs font-extrabold text-[#888] tracking-widest uppercase mb-3">Payout History</div>
      {payouts.map((p: any) => (
        <div key={p.id} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-extrabold" style={{ color: "#00D97E" }}>KSh {Number(p.amount).toLocaleString()}</span>
            <span style={statusPill(p.status)}>{STATUS_STYLE[p.status]?.label || p.status}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-[#1F1F2E]">
            <span className="text-[11px] text-[#555]">{new Date(p.created_at).toLocaleDateString()}</span>
            <span className="text-[11px] text-[#444] font-mono">Ref: {p.payout_ref}</span>
          </div>
        </div>
      ))}
      <div className="text-center py-5 text-xs text-[#333]">
        Total paid out: <span className="text-[#00D97E] font-extrabold">KSh {payouts.reduce((s: number, p: any) => s + Number(p.amount), 0).toLocaleString()}</span>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="px-4 pt-4">
      <div className="flex flex-col items-center py-6">
        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary to-[#FF8C00] flex items-center justify-center font-black text-[26px] text-white mb-3">{agentAvatar}</div>
        <div className="text-xl font-extrabold">{agentName}</div>
        <div className="text-[13px] text-[#555] mt-1">{agentPhone || user?.email}</div>
        <div className="mt-2 px-3.5 py-1 rounded-xl text-xs font-extrabold border" style={{ background: "#1A1000", borderColor: `${TIER_COLOR[tier]}44`, color: TIER_COLOR[tier] }}>⭐ {tier} Agent · {commissionRate}% Commission</div>
      </div>
      {([
        ["📱", "M-Pesa Number", agentPhone || "Not set"],
        ["💼", "Total Sales", `${totalSales} orders`],
        ["💰", "Total Earned", `KSh ${Number(totalEarnings).toLocaleString()}`],
        ["📦", "Active Products", `${products.length} listings`],
        ["🧾", "Total Orders", `${orders.length} orders`],
      ] as const).map(([icon, label, value]) => (
        <div key={label} className="bg-[#16161E] border border-[#1F1F2E] rounded-2xl p-3 flex items-center gap-3 mb-2">
          <span className="text-[22px]">{icon}</span>
          <div className="flex-1">
            <div className="text-[11px] text-[#555] font-semibold">{label}</div>
            <div className="text-sm font-bold mt-0.5">{value}</div>
          </div>
        </div>
      ))}

      {/* Upgrade Banner */}
      <div className="bg-gradient-to-br from-[#1A1000] to-[#2B1A00] border border-[#3D2A00] rounded-2xl p-4 mt-2">
        <div className="text-[13px] font-extrabold text-[#FFD700] mb-1">🚀 Upgrade to Platinum</div>
        <div className="text-xs text-[#AA8844] leading-relaxed">Sell 100+ items to unlock 18% commission rate and priority payouts</div>
        <div className="mt-2.5 bg-[#3D2A00] rounded-lg h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-[#FFD700] rounded-lg" style={{ width: "58%" }} />
        </div>
        <div className="text-[10px] text-[#666] mt-1">{totalSales} / 100 sales to Platinum</div>
      </div>

      <button onClick={handleSignOut} className="mt-4 bg-[#1C1C24] border-none rounded-xl py-3 w-full text-[#FF4D4D] text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );

  const TABS: Record<string, React.FC> = { home: HomeTab, products: ProductsTab, orders: OrdersTab, payouts: PayoutsTab, profile: ProfileTab };
  const ActiveTab = TABS[tab];

  return (
    <div className="font-['DM_Sans',sans-serif] bg-[#0C0C10] min-h-screen max-w-[430px] mx-auto text-[#F0EEF8] relative pb-[72px]">
      {/* Top Bar */}
      <div className="px-5 py-4 bg-[#0C0C10] sticky top-0 z-50 border-b border-[#1C1C24]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-[#FF8C00] rounded-[9px] flex items-center justify-center text-sm font-black text-white">P</div>
            <div>
              <div className="text-[15px] font-extrabold tracking-tight">PayLoom Agent</div>
              <div className="text-[9px] font-bold text-primary tracking-widest uppercase">Instants</div>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#16161E] border border-[#2A2A36] flex items-center justify-center cursor-pointer relative">
            <Bell size={16} className="text-[#666]" />
            <div className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-primary border-2 border-[#0C0C10]" />
          </div>
        </div>
      </div>

      <div className="pb-5">
        <ActiveTab />
      </div>

      {/* Share Modal */}
      {shareModal && shareProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-[999]" onClick={() => setShareModal(false)}>
          <div className="bg-[#16161E] rounded-t-2xl p-6 pb-10 w-full max-w-[430px] mx-auto border border-[#2A2A36]" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-extrabold mb-1">Share Product Link 🔗</div>
            <div className="text-[13px] text-[#555] mb-4">Share this link to earn +KSh {Math.round(Number(shareProduct.price) * commissionRate / 100).toLocaleString()} commission per sale</div>
            <div className="flex items-center gap-2.5 bg-[#0C0C10] rounded-xl p-3">
              <span className="text-[28px]">{shareProduct.emoji || "📦"}</span>
              <div>
                <div className="text-[13px] font-bold">{shareProduct.name}</div>
                <div className="text-xs text-primary font-bold">KSh {Number(shareProduct.price).toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-[#0C0C10] border border-[#2A2A36] rounded-xl p-3 text-xs text-[#FF8C5A] break-all mt-3">
              {window.location.origin}/shop?ref={agent?.id || 'agent'}&product={shareProduct.id}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              {["WhatsApp 💬", "Facebook 📘", "Twitter/X 🐦", "Copy Link 📋"].map(platform => (
                <button key={platform} onClick={() => platform.includes("Copy") && handleCopyLink(shareProduct.id)}
                  className="bg-[#1F1F2E] border border-[#2A2A36] rounded-xl py-2.5 text-white text-xs font-bold cursor-pointer">
                  {platform}
                </button>
              ))}
            </div>
            <button onClick={() => setShareModal(false)}
              className="bg-primary border-none rounded-xl py-3 w-full text-white text-sm font-extrabold cursor-pointer mt-3.5">
              {copied ? <><Check size={16} className="inline mr-1" /> Copied!</> : "Done ✓"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0C0C10] border-t border-[#1C1C24] flex py-2.5 pb-4 z-50">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <div key={id} className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer text-[10px] ${tab === id ? 'text-primary font-extrabold' : 'text-[#3A3A4A] font-medium'}`}
            onClick={() => setTab(id)}>
            {icon}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
