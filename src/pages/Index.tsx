import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

// ── Reveal wrapper ──
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Custom cursor ──
function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      setRingPos(prev => ({
        x: prev.x + (pos.x - prev.x) * 0.12,
        y: prev.y + (pos.y - prev.y) * 0.12,
      }));
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [pos]);

  return (
    <>
      <div className="hidden md:block fixed w-3 h-3 bg-[#FF4D00] rounded-full pointer-events-none z-[9999] mix-blend-difference transition-[width,height,background] duration-300" style={{ left: pos.x, top: pos.y, transform: "translate(-50%,-50%)" }} />
      <div className="hidden md:block fixed w-10 h-10 border border-[rgba(255,77,0,0.5)] rounded-full pointer-events-none z-[9998] transition-all duration-150" style={{ left: ringPos.x, top: ringPos.y, transform: "translate(-50%,-50%)" }} />
    </>
  );
}

// ── Marquee items ──
const MARQUEE_ITEMS = ["M-PESA PAYMENTS", "INSTANT PAYOUTS", "STRIPE GLOBAL", "FLUTTERWAVE", "FIREBASE PUSH", "AFRICA'S TALKING SMS", "KYC VERIFIED AGENTS", "REAL-TIME ANALYTICS"];

// ── Features ──
const FEATURES = [
  { num: "01", icon: "📱", title: "M-Pesa STK Push", desc: "Customers pay via Safaricom M-Pesa with a single tap. No bank card needed." },
  { num: "02", icon: "💼", title: "Agent Network", desc: "Agents share product links, earn commission on every sale. Zero inventory risk." },
  { num: "03", icon: "🔐", title: "Secure Platform", desc: "JWT auth, OTP verification, role-based access. Built for trust." },
  { num: "04", icon: "⚡", title: "Instant Payouts", desc: "B2C disbursements hit agent M-Pesa wallets in seconds. No delays." },
  { num: "05", icon: "📊", title: "Real-Time Analytics", desc: "Live dashboards for revenue, agent performance, and inventory management." },
  { num: "06", icon: "🌍", title: "Multi-Country", desc: "Kenya, Nigeria, Ghana, Uganda, Tanzania — and growing across Africa." },
];

// ── Testimonials ──
const TESTIMONIALS = [
  { text: "I used to sell in Gikomba market. Now I share PayLoom links on WhatsApp and earn more than I did in a month, in a week.", bold: "The M-Pesa payouts are instant.", name: "Amara Kamau", role: "Gold Agent · 142 sales", avatar: "AK", gradient: "from-[#FF4D00] to-[#FF8C00]", flag: "🇰🇪" },
  { text: "As a Platinum agent I earn 18% on every sale.", bold: "PayLoom paid KSh 98,200 to my M-Pesa this year — all from sharing product links.", name: "Fatima Abubakar", role: "Platinum Agent · 134 sales", avatar: "FA", gradient: "from-[#00C4FF] to-[#005FFF]", flag: "🇳🇬" },
  { text: "The customer experience is seamless.", bold: "They pay via M-Pesa, get notified by SMS, and track their order.", name: "Cynthia Mwangi", role: "Gold Agent · 71 sales", avatar: "CM", gradient: "from-[#FFD700] to-[#FF8C00]", flag: "🇰🇪" },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAF8] font-['Outfit',sans-serif] overflow-x-hidden md:cursor-none">
      <CustomCursor />

      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none z-[9997]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] flex items-center px-6 md:px-12 h-[72px] transition-all duration-300 ${scrolled ? "bg-[rgba(8,8,8,0.92)] backdrop-blur-[20px] border-b border-[rgba(255,77,0,0.1)]" : "bg-gradient-to-b from-[rgba(8,8,8,0.95)] to-transparent"}`}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 bg-[#FF4D00] rounded-[10px] flex items-center justify-center font-['Bebas_Neue',sans-serif] text-xl text-white shadow-[0_0_20px_rgba(255,77,0,0.4)]">P</div>
          <div className="font-['Bebas_Neue',sans-serif] text-[22px] tracking-wide">PAY<span className="text-[#FF4D00]">LOOM</span></div>
        </div>
        <div className="hidden md:flex items-center gap-9 ml-auto text-sm text-[#A89880]">
          <a href="#how" className="hover:text-white transition-colors relative group">How It Works<span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF4D00] group-hover:w-full transition-all duration-300" /></a>
          <a href="#features" className="hover:text-white transition-colors relative group">Features<span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF4D00] group-hover:w-full transition-all duration-300" /></a>
          <a href="#testimonials" className="hover:text-white transition-colors relative group">Stories<span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF4D00] group-hover:w-full transition-all duration-300" /></a>
        </div>
        <div className="flex items-center gap-3 ml-auto md:ml-9">
          {user ? (
            <>
              <button onClick={() => navigate("/agent")} className="text-sm text-[#A89880] hover:text-white transition-colors hidden sm:block">Dashboard</button>
              <button onClick={() => signOut()} className="text-sm text-[#A89880] hover:text-white transition-colors">Sign Out</button>
            </>
          ) : (
            <button onClick={() => navigate("/auth")} className="text-sm text-[#A89880] hover:text-white transition-colors hidden sm:block">Sign In</button>
          )}
          <button onClick={() => navigate("/auth")} className="bg-[#FF4D00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-[0_0_20px_rgba(255,77,0,0.25)] hover:bg-[#FF8C00] hover:shadow-[0_0_30px_rgba(255,77,0,0.4)] transition-all">
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-[140px] pb-20 relative overflow-hidden">
        {/* Radial glow */}
        <div className="absolute top-[20%] -left-[10%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,77,0,0.12)_0%,transparent_65%)] pointer-events-none" />
        {/* Diagonal stripe */}
        <div className="hidden md:block absolute top-0 right-0 w-[45%] h-full bg-[#161310] overflow-hidden" style={{ clipPath: "polygon(15% 0,100% 0,100% 100%,0% 100%)" }}>
          <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(-45deg,transparent,transparent 40px,rgba(255,77,0,0.03) 40px,rgba(255,77,0,0.03) 41px)" }} />
        </div>

        {/* Floating UI card */}
        <div className="hidden lg:block absolute right-[6%] top-1/2 -translate-y-1/2 rotate-2 w-[300px] bg-[#13110E] border border-[rgba(255,77,0,0.2)] rounded-[20px] p-5 shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_60px_rgba(255,77,0,0.1)] animate-[float_6s_ease-in-out_infinite] z-10">
          <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-[rgba(255,255,255,0.05)]">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#FF4D00] to-[#FF8C00] flex items-center justify-center font-extrabold text-[13px]">AK</div>
            <div><div className="text-[13px] font-semibold">Amara Kamau</div><div className="text-[10px] text-[#666]">Gold Agent · Nairobi</div></div>
            <div className="ml-auto bg-[rgba(0,217,126,0.15)] text-[#00D97E] text-[9px] font-bold px-2 py-0.5 rounded tracking-wide">ACTIVE</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="bg-[#0C0B0A] rounded-[10px] p-3"><div className="text-base font-bold text-[#FF4D00]">KSh 42K</div><div className="text-[9px] text-[#555] mt-0.5 font-medium">Earned</div></div>
            <div className="bg-[#0C0B0A] rounded-[10px] p-3"><div className="text-base font-bold text-[#FF4D00]">142</div><div className="text-[9px] text-[#555] mt-0.5 font-medium">Sales</div></div>
          </div>
          <div className="bg-[rgba(255,77,0,0.08)] border border-[rgba(255,77,0,0.15)] rounded-[10px] p-2.5 flex items-center gap-2.5 animate-[pulse-border_2s_ease-in-out_infinite]">
            <div className="w-2 h-2 rounded-full bg-[#FF4D00] shadow-[0_0_8px_#FF4D00] shrink-0 animate-pulse" />
            <div className="text-[11px] text-[#AAA]">New sale! <b className="text-[#FF4D00]">Samsung A15</b> — Commission: <b className="text-[#FF4D00]">KSh 2,220</b></div>
          </div>
        </div>

        {/* Second floating card */}
        <div className="hidden lg:block absolute right-[18%] top-[20%] w-[200px] bg-[#13110E] border border-[rgba(255,184,0,0.15)] rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-[float2_5s_ease-in-out_infinite_1s] z-10">
          <div className="text-[9px] font-bold text-[#555] tracking-[1.5px] uppercase mb-2">Monthly Revenue</div>
          <div className="font-['Bebas_Neue',sans-serif] text-4xl text-[#FFB800] leading-none">356K</div>
          <div className="text-[11px] text-[#666] mt-1">KSh · March 2026</div>
          <div className="h-[3px] bg-[#1A1510] rounded mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#FF4D00] to-[#FFB800] rounded animate-[fill-bar_3s_ease-in-out_infinite]" /></div>
        </div>

        {/* Hero content */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(255,77,0,0.1)] border border-[rgba(255,77,0,0.25)] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#FF4D00] tracking-wide mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
            Now live across Africa
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="font-['Bebas_Neue',sans-serif] text-[clamp(64px,9vw,130px)] leading-[0.92] tracking-wide max-w-[700px] relative z-10">
          <span>SELL</span>
          <span className="block text-[#FF4D00]">INSTANTLY.</span>
          <span className="block" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>GET PAID.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg text-[#A89880] max-w-[480px] leading-relaxed mt-7 relative z-10">
          PayLoom Instants is a <b className="text-white font-semibold">C2B + B2C commerce platform</b> built for Africa.
          Customers pay via M-Pesa. Agents earn commissions. Everyone wins — instantly.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center gap-4 mt-11 relative z-10">
          <button onClick={() => navigate("/auth")} className="bg-[#FF4D00] text-white px-9 py-4 rounded-[10px] text-[15px] font-bold shadow-[0_0_40px_rgba(255,77,0,0.35)] hover:bg-[#FF8C00] hover:shadow-[0_0_60px_rgba(255,77,0,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            Start Selling <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
          <a href="#how" className="text-[#A89880] px-7 py-4 rounded-[10px] text-[15px] font-medium border border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition-all">
            See How It Works
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-12 mt-16 pt-10 border-t border-[rgba(255,255,255,0.06)] relative z-10 flex-wrap">
          {[{ val: "1.4", unit: "B", label: "African market" }, { val: "3", unit: "s", label: "Avg. payment time" }, { val: "0", unit: "%", label: "Escrow risk" }, { val: "18", unit: "%", label: "Max commission" }].map(s => (
            <div key={s.label}>
              <div className="font-['Bebas_Neue',sans-serif] text-[42px] leading-none">{s.val}<span className="text-[#FF4D00]">{s.unit}</span></div>
              <div className="text-xs text-[#A89880] mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-[#FF4D00] overflow-hidden">
        <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-8 py-3.5 font-['Bebas_Neue',sans-serif] text-lg tracking-widest text-[rgba(0,0,0,0.7)] shrink-0">
              {item} <span className="w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.4)]" />
            </span>
          ))}
        </div>
      </div>

      {/* ── MONEY FLOW ── */}
      <section className="py-[120px] px-6 md:px-12" id="how">
        <Reveal><div className="flex items-center gap-2.5 text-[11px] font-bold text-[#FF4D00] tracking-[3px] uppercase mb-4"><span className="w-6 h-0.5 bg-[#FF4D00]" />The Money Flow</div></Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-wide">
            CLEAN.<br /><span className="text-[#FF4D00]">PSP-SAFE.</span><br />ALWAYS.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6 mt-[72px]">
            {[
              { icon: "🛒", title: "Customer Pays", desc: "Pays via M-Pesa STK Push, Stripe card, or mobile money. Zero friction.", tag: null },
              null, // arrow
              { icon: "🏦", title: "PayLoom Settles", desc: "Money hits PayLoom's merchant account. Commission calculated in real time.", tag: "ESCROW" },
              null, // arrow
              { icon: "💸", title: "Agent Earns", desc: "Agents request payout. B2C hits their M-Pesa within seconds.", tag: null },
            ].map((item, i) => item === null ? (
              <div key={i} className="text-3xl text-[#FF4D00] opacity-60 text-center animate-[arrow-pulse_2s_ease-in-out_infinite] hidden md:block">→</div>
            ) : (
              <div key={i} className={`bg-[#161310] border rounded-[20px] p-8 text-center relative transition-all hover:-translate-y-1 ${item.tag ? "border-[rgba(255,77,0,0.4)] bg-gradient-to-br from-[#1A0A00] to-[#0C0800] shadow-[0_0_60px_rgba(255,77,0,0.15)]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,77,0,0.3)]"}`}>
                {item.tag && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4D00] text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">{item.tag}</div>}
                <span className="text-[40px] block mb-3.5">{item.icon}</span>
                <div className="text-lg font-bold mb-1.5">{item.title}</div>
                <div className="text-[13px] text-[#A89880] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-[120px] px-6 md:px-12 bg-[#0C0B0A] relative overflow-hidden" id="features">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,77,0,0.06)_0%,transparent_65%)]" />
        <div className="grid md:grid-cols-2 items-end gap-10 mb-[72px]">
          <div>
            <Reveal><div className="flex items-center gap-2.5 text-[11px] font-bold text-[#FF4D00] tracking-[3px] uppercase mb-4"><span className="w-6 h-0.5 bg-[#FF4D00]" />Platform</div></Reveal>
            <Reveal delay={0.1}><h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-wide">SIX THINGS<br /><span className="text-[#FF4D00]">WE NAIL.</span></h2></Reveal>
          </div>
          <Reveal delay={0.2}><p className="text-base text-[#A89880] leading-relaxed max-w-[400px] md:ml-auto">Everything you need to run an agent-driven commerce platform with mobile money across Africa.</p></Reveal>
        </div>
        <div className="grid md:grid-cols-3 gap-0.5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.num} delay={i * 0.08}>
              <div className={`bg-[#161310] p-10 relative overflow-hidden hover:bg-[#131009] transition-colors group ${i === 0 ? "rounded-tl-[20px]" : ""} ${i === 2 ? "rounded-tr-[20px]" : ""} ${i === 3 ? "rounded-bl-[20px]" : ""} ${i === 5 ? "rounded-br-[20px]" : ""}`}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="font-['Bebas_Neue',sans-serif] text-[56px] text-[rgba(255,77,0,0.12)] leading-none mb-5 group-hover:text-[rgba(255,77,0,0.25)] transition-colors">{f.num}</div>
                <span className="text-[28px] block mb-4">{f.icon}</span>
                <div className="text-xl font-bold mb-2.5">{f.title}</div>
                <div className="text-sm text-[#A89880] leading-relaxed">{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS (Agent Steps) ── */}
      <section className="py-[120px] px-6 md:px-12" id="agents">
        <Reveal><div className="flex items-center gap-2.5 text-[11px] font-bold text-[#FF4D00] tracking-[3px] uppercase mb-4"><span className="w-6 h-0.5 bg-[#FF4D00]" />For Agents</div></Reveal>
        <Reveal delay={0.1}><h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-wide">SIGN UP.<br /><span className="text-[#FF4D00]">SELL. EARN.</span></h2></Reveal>
        <div className="grid md:grid-cols-2 gap-20 items-center mt-[72px]">
          <div className="flex flex-col">
            {[
              { num: "01", title: "Register & Verify", desc: "Sign up with email. Verify your identity to unlock agent access.", tag: "SECURE AUTH" },
              { num: "02", title: "Get Your Product Links", desc: "Browse the catalog. Every product generates a unique share link tied to you.", tag: "UNIQUE REFERRAL CODE" },
              { num: "03", title: "Share & Sell", desc: "Share links on WhatsApp, TikTok, markets. Customers pay PayLoom directly.", tag: "ZERO UPFRONT COST" },
              { num: "04", title: "Get Paid via M-Pesa", desc: "Commission accumulates. Request payout — money hits your M-Pesa in minutes.", tag: "UP TO 18% COMMISSION" },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div className="flex gap-6 py-7 border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:pl-2 transition-all group">
                  <div className="font-['Bebas_Neue',sans-serif] text-[52px] text-[rgba(255,77,0,0.15)] leading-none shrink-0 w-[50px] group-hover:text-[rgba(255,77,0,0.5)] transition-colors">{step.num}</div>
                  <div>
                    <div className="text-lg font-bold mb-2">{step.title}</div>
                    <div className="text-sm text-[#A89880] leading-relaxed">{step.desc}</div>
                    <span className="inline-block mt-2.5 bg-[rgba(255,77,0,0.1)] text-[#FF4D00] text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded">{step.tag}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Phone mockup */}
          <Reveal className="hidden md:flex justify-center">
            <div className="relative">
              <div className="absolute -inset-10 bg-[radial-gradient(circle,rgba(255,77,0,0.08)_0%,transparent_65%)] pointer-events-none" />
              <div className="w-[280px] h-[560px] bg-[#0C0B0A] rounded-[44px] border border-[rgba(255,255,255,0.1)] relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_0_8px_rgba(255,255,255,0.03)]">
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#0C0B0A] rounded-full z-10" />
                <div className="absolute inset-0 bg-[#0C0C10] p-4 pt-10 overflow-hidden">
                  <div className="flex justify-between text-[9px] text-[#555] mb-4"><span>9:41</span><span>●●●</span></div>
                  <div className="flex items-center gap-2 bg-[#13110E] rounded-xl p-2.5 mb-3">
                    <div className="w-6 h-6 bg-[#FF4D00] rounded-md flex items-center justify-center text-[11px] font-black">P</div>
                    <div><div className="text-[11px] font-bold">PayLoom Agent</div><div className="text-[9px] text-[#555]">Instants</div></div>
                    <div className="ml-auto bg-[rgba(255,77,0,0.2)] rounded-md px-2 py-1 text-[9px] text-[#FF4D00] font-bold">🔔 3</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1A0A00] to-[#0C0600] border border-[rgba(255,77,0,0.2)] rounded-[14px] p-3.5 mb-3">
                    <div className="text-[8px] text-[#FF8C5A] font-bold tracking-widest uppercase">Pending Earnings</div>
                    <div className="font-['Bebas_Neue',sans-serif] text-[28px] my-1">KSh 4,572</div>
                    <div className="text-[9px] text-[#AA7755]">Commission rate: 12%</div>
                    <div className="bg-[#FF4D00] rounded-lg p-2 text-center text-[10px] font-bold mt-2.5">Request Payout via M-Pesa →</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ emoji: "📱", name: "Samsung A15", price: "KSh 18,500" }, { emoji: "👟", name: "Nike AF1", price: "KSh 7,200" }, { emoji: "🔊", name: "JBL Clip 4", price: "KSh 5,800" }, { emoji: "👗", name: "Ankara Dress", price: "KSh 3,200" }].map(p => (
                      <div key={p.name} className="bg-[#13110E] rounded-[10px] overflow-hidden">
                        <div className="h-[50px] flex items-center justify-center text-2xl bg-[#1A1510]">{p.emoji}</div>
                        <div className="p-2"><div className="text-[9px] font-bold leading-tight">{p.name}</div><div className="text-[10px] text-[#FF4D00] font-bold mt-0.5">{p.price}</div><div className="bg-[#1A1510] rounded p-1 text-center text-[8px] text-[#AAA] mt-1">Share 🔗</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-[120px] px-6 md:px-12 bg-[#161310]" id="testimonials">
        <Reveal><div className="flex items-center gap-2.5 text-[11px] font-bold text-[#FF4D00] tracking-[3px] uppercase mb-4"><span className="w-6 h-0.5 bg-[#FF4D00]" />Real Stories</div></Reveal>
        <Reveal delay={0.1}><h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-wide">AGENTS. <span className="text-[#FF4D00]">WINNING.</span></h2></Reveal>
        <div className="grid md:grid-cols-3 gap-5 mt-16">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <div className="bg-[#080808] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-8 hover:border-[rgba(255,77,0,0.2)] hover:-translate-y-1 transition-all">
                <div className="text-[#FFB800] text-sm mb-4 tracking-widest">★★★★★</div>
                <p className="text-[15px] text-[#A89880] leading-relaxed mb-6">"{t.text} <b className="text-white">{t.bold}</b>"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center font-extrabold text-sm`}>{t.avatar}</div>
                  <div><div className="text-sm font-bold">{t.name}</div><div className="text-[11px] text-[#A89880] mt-0.5">{t.role}</div></div>
                  <div className="ml-auto text-xl">{t.flag}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-[120px] px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(255,77,0,0.1)_0%,transparent_65%)]" />
        <Reveal>
          <h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(56px,8vw,110px)] leading-[0.95] tracking-wide relative">
            <span className="block">YOUR</span>
            <span className="block text-[#FF4D00]">HUSTLE.</span>
            <span className="block" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.2)", color: "transparent" }}>AMPLIFIED.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}><p className="text-[17px] text-[#A89880] max-w-[480px] mx-auto mt-6 leading-relaxed">Join thousands of agents across Africa earning real income through PayLoom Instants. No stock. No risk. Just sell.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="flex justify-center gap-4 mt-12">
            <button onClick={() => navigate("/auth")} className="bg-[#FF4D00] text-white px-9 py-4 rounded-[10px] text-[15px] font-bold shadow-[0_0_40px_rgba(255,77,0,0.35)] hover:bg-[#FF8C00] hover:shadow-[0_0_60px_rgba(255,77,0,0.5)] hover:-translate-y-0.5 transition-all">
              Become an Agent →
            </button>
            <button onClick={() => navigate("/shop")} className="text-[#A89880] px-7 py-4 rounded-[10px] text-[15px] font-medium border border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition-all">
              Browse Shop
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 pt-[60px] pb-10 border-t border-[rgba(255,255,255,0.06)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-[60px] mb-[60px]">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[#FF4D00] rounded-[10px] flex items-center justify-center font-['Bebas_Neue',sans-serif] text-xl text-white shadow-[0_0_20px_rgba(255,77,0,0.4)]">P</div>
              <div className="font-['Bebas_Neue',sans-serif] text-[22px] tracking-wide">PAY<span className="text-[#FF4D00]">LOOM</span></div>
            </div>
            <p className="text-sm text-[#A89880] leading-relaxed max-w-[280px]">Commerce infrastructure for Africa. Customers pay. Agents earn. Everyone wins — instantly.</p>
            <div className="flex gap-3 text-lg mt-5">🇰🇪 🇳🇬 🇬🇭 🇺🇬 🇹🇿</div>
          </div>
          {[
            { title: "Product", links: [["Customer Shop", "/shop"], ["Agent Dashboard", "/agent"], ["Admin Panel", "/admin"]] },
            { title: "Company", links: [["About Us", "#"], ["Blog", "#"], ["Careers", "#"]] },
            { title: "Support", links: [["Help Centre", "#"], ["Contact", "#"], ["Privacy Policy", "#"], ["Terms of Use", "#"]] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold tracking-[1.5px] uppercase mb-5">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}><a href={href} onClick={e => { if (href.startsWith("/")) { e.preventDefault(); navigate(href); } }} className="text-sm text-[#A89880] hover:text-[#FF4D00] transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-[rgba(255,255,255,0.05)] text-xs text-[#333] gap-2">
          <span>© 2026 PayLoom Instants. All rights reserved.</span>
          <span>Built for Africa. Powered by M-Pesa, Stripe & Flutterwave.</span>
        </div>
      </footer>

      {/* Custom keyframes */}
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(-50%) rotate(2deg); } 50% { transform: translateY(calc(-50% - 12px)) rotate(2deg); } }
        @keyframes float2 { 0%,100% { transform: rotate(-3deg) translateY(0); } 50% { transform: rotate(-3deg) translateY(-10px); } }
        @keyframes fill-bar { 0% { width: 30%; } 50% { width: 85%; } 100% { width: 30%; } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes arrow-pulse { 0%,100% { opacity: 0.4; transform: translateX(0); } 50% { opacity: 1; transform: translateX(4px); } }
        @keyframes pulse-border { 0%,100% { border-color: rgba(255,77,0,0.15); } 50% { border-color: rgba(255,77,0,0.4); } }
      `}</style>
    </div>
  );
}
