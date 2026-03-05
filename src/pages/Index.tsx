import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, Users, Smartphone, Globe, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: <Smartphone size={24} />, title: "M-Pesa Payments", desc: "Accept mobile money payments via STK Push integration" },
  { icon: <Users size={24} />, title: "Agent Network", desc: "Agents sell products, earn commission on every sale" },
  { icon: <Shield size={24} />, title: "Secure Platform", desc: "Role-based access with encrypted transactions" },
  { icon: <Zap size={24} />, title: "Instant Payouts", desc: "B2C disbursements to agent M-Pesa accounts" },
  { icon: <Globe size={24} />, title: "Multi-Platform", desc: "Customer shop, agent app, and admin panel in one" },
  { icon: <ArrowRight size={24} />, title: "Real-Time Data", desc: "Live order tracking, earnings, and inventory management" },
];

const APPS = [
  { id: "shop", title: "Customer Shop", subtitle: "Browse, add to cart & pay via M-Pesa", icon: "🛍️", route: "/shop", accent: "from-primary to-payloom-orange-light" },
  { id: "agent", title: "Agent Dashboard", subtitle: "Track sales, earnings & request payouts", icon: "⚡", route: "/agent", accent: "from-payloom-success to-emerald-600" },
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
              Platform Active
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              Agent-Powered
              <br />
              <span className="bg-gradient-to-r from-primary to-payloom-orange-light bg-clip-text text-transparent">M-Pesa Commerce</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A commerce platform where agents sell products, customers pay via M-Pesa, and agents earn commission — all managed from one system.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={() => navigate("/shop")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl text-base font-extrabold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
              Browse Shop 🛍️
            </button>
            <button onClick={() => navigate("/agent")} className="bg-card border border-border text-foreground px-8 py-3.5 rounded-2xl text-base font-bold hover:bg-accent transition-colors">
              Agent Dashboard →
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Strip */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3">
          {[
            { step: "1", title: "Customer Shops", desc: "Browse products and add to cart" },
            { step: "2", title: "Pay via M-Pesa", desc: "Complete payment with STK Push" },
            { step: "3", title: "Agent Earns", desc: "Commission deposited automatically" },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center py-8 px-6 border-b md:border-b-0 md:border-r border-border last:border-0"
            >
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-lg mx-auto mb-3">{s.step}</div>
              <div className="text-base font-extrabold mb-1">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Everything needed to run an agent-driven commerce platform with mobile money.</p>
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
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">{f.icon}</div>
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Two Dashboards, One Platform</h2>
            <p className="text-muted-foreground">Customer shop and agent dashboard — connected to the same backend.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                <p className="text-sm text-muted-foreground mb-6">Full-featured dashboard with real-time data from the database.</p>
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Start Using PayLoom</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Browse the shop, check the agent dashboard, and explore what the platform can do.</p>
            <button onClick={() => navigate("/shop")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl text-base font-extrabold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
              Open Shop →
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
          <div className="text-xs text-muted-foreground">© 2026 PayLoom. Agent-powered M-Pesa commerce platform.</div>
        </div>
      </footer>
    </div>
  );
}
