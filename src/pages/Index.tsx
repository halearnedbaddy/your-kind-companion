import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "📱", title: "M-Pesa STK Push", desc: "One-tap mobile payments via Safaricom Daraja API" },
  { icon: "🤝", title: "Agent Commerce", desc: "Agents sell, earn commission, get paid via B2C" },
  { icon: "🔒", title: "PSP Compliant", desc: "Enterprise-grade security with role-based access" },
  { icon: "📊", title: "Real-time Analytics", desc: "Track revenue, payouts, and agent performance" },
  { icon: "🌍", title: "Pan-Africa Ready", desc: "Multi-currency with Flutterwave and M-Pesa" },
  { icon: "⚡", title: "Instant Payouts", desc: "B2C disbursements to agents in seconds" },
];

const STATS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<200ms", label: "API Response" },
  { value: "12+", label: "Payment Methods" },
  { value: "5M+", label: "Transactions" },
];

const APPS = [
  { id: "shop", title: "Customer Shop", subtitle: "Browse, cart & checkout", icon: "🛍️", route: "/shop", accent: "from-orange-500 to-amber-500" },
  { id: "agent", title: "Agent Dashboard", subtitle: "Sell, earn & track", icon: "⚡", route: "/agent", accent: "from-emerald-500 to-teal-500" },
  { id: "admin", title: "Admin Panel", subtitle: "Manage everything", icon: "🏢", route: "/admin", accent: "from-blue-500 to-indigo-500" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-payloom-orange-light rounded-xl flex items-center justify-center text-primary-foreground font-black text-sm">P</div>
            <div>
              <div className="text-base font-extrabold tracking-tight">PayLoom</div>
              <div className="text-[10px] font-bold text-primary tracking-[3px] uppercase -mt-0.5">Instants</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#platforms" className="hover:text-foreground transition-colors">Platforms</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Stats</a>
          </div>
          <button onClick={() => navigate("/shop")} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            Open Shop →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-primary/20">
              <span className="w-2 h-2 bg-payloom-success rounded-full animate-pulse" />
              Live — Production Ready
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              Commerce for
              <br />
              <span className="bg-gradient-to-r from-primary to-payloom-orange-light bg-clip-text text-transparent">Africa & Beyond</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              PSP-compliant C2B/B2C platform. Accept M-Pesa payments, manage agent networks, disburse earnings — all from one dashboard.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={() => navigate("/shop")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl text-base font-extrabold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
              Start Shopping 🛍️
            </button>
            <button onClick={() => navigate("/admin")} className="bg-card border border-border text-foreground px-8 py-3.5 rounded-2xl text-base font-bold hover:bg-accent transition-colors">
              Admin Dashboard →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="stats" className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center py-8 px-4 border-r border-border last:border-r-0"
            >
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Built for African Commerce</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Everything you need to run a modern, agent-driven commerce platform with mobile money at its core.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-extrabold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section id="platforms" className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Three Platforms, One Ecosystem</h2>
            <p className="text-muted-foreground">Customer shop, agent app, and admin panel — all connected.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {APPS.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                onClick={() => navigate(app.route)}
                className="bg-card border border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${app.accent} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className="text-4xl mb-5">{app.icon}</div>
                <h3 className="text-xl font-extrabold mb-1">{app.title}</h3>
                <p className="text-sm text-primary font-bold mb-3">{app.subtitle}</p>
                <p className="text-sm text-muted-foreground mb-6">Full-featured dashboard with real-time data from Lovable Cloud.</p>
                <span className="text-primary font-extrabold text-sm group-hover:underline">Open →</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 to-payloom-orange-light/5 border border-primary/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to Go Live?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Connect your M-Pesa credentials, add agents, and start processing payments today.</p>
            <button onClick={() => navigate("/shop")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl text-base font-extrabold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
              Launch PayLoom →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">P</div>
            <span className="text-sm font-bold">PayLoom Instants</span>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 PayLoom. PSP-compliant commerce for Africa.</div>
        </div>
      </footer>
    </div>
  );
}
