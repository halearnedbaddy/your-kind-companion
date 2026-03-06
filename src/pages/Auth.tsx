import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

// ── Animated particle background ──
function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.4 + 0.05,
    }));

    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      dots.forEach(d => {
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,77,0,${d.o})`;
        ctx!.fill();
        d.x += d.dx; d.y += d.dy;
        if (d.x < 0 || d.x > canvas!.width) d.dx *= -1;
        if (d.y < 0 || d.y > canvas!.height) d.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
}

// ── Left panel content config ──
const PANEL_CONTENT = {
  login: {
    badge: "Secure Login",
    headline: ["WELCOME", "BACK."],
    sub: "Sign in to your PayLoom account. Access your dashboard, track sales, and manage payouts.",
    stats: [{ val: "256", lbl: "Bit SSL" }, { val: "JWT", lbl: "Secured" }, { val: "24/7", lbl: "Access" }],
  },
  signup: {
    badge: "Join PayLoom",
    headline: ["START", "EARNING."],
    sub: "Create your account and join thousands of agents across Africa earning real income through PayLoom Instants.",
    stats: [{ val: "18%", lbl: "Max comm." }, { val: "Free", lbl: "To join" }, { val: "KES", lbl: "Payouts" }],
  },
};

// ── Left panel ──
function LeftPanel({ mode }: { mode: "login" | "signup" }) {
  const c = PANEL_CONTENT[mode];
  return (
    <div className="hidden lg:flex w-[42%] min-h-screen flex-col p-12 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #120800 0%, #0C0500 50%, #1A0900 100%)" }}>
      <ParticleBg />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,77,0,0.18)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,77,0,0.03) 60px,rgba(255,77,0,0.03) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,77,0,0.03) 60px,rgba(255,77,0,0.03) 61px)" }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-10 h-10 rounded-[11px] bg-[#FF4D00] flex items-center justify-center font-['Bebas_Neue',sans-serif] text-[22px] text-white shadow-[0_0_20px_rgba(255,77,0,0.5)]">P</div>
        <div>
          <div className="font-['Bebas_Neue',sans-serif] text-xl tracking-wide">PAYLOOM</div>
          <div className="text-[9px] text-[#FF4D00] font-bold tracking-[2px] uppercase">Instants</div>
        </div>
      </div>

      {/* Badge */}
      <div className="mt-auto inline-flex items-center gap-1.5 bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.25)] rounded-full px-3 py-1 text-[11px] font-bold text-[#FF4D00] tracking-wide w-fit relative z-10">
        <span className="w-[5px] h-[5px] rounded-full bg-[#FF4D00]" />
        {c.badge}
      </div>

      {/* Headline */}
      <h2 className="font-['Bebas_Neue',sans-serif] text-[clamp(48px,5vw,72px)] leading-[0.92] tracking-wide mt-4 relative z-10 transition-all duration-400">
        {c.headline.map((line, i) => (
          <span key={i} className={`block ${i === 1 ? "text-[#FF4D00]" : ""}`}>{line}</span>
        ))}
      </h2>

      {/* Sub */}
      <p className="text-sm text-[#7A6A5A] leading-relaxed mt-4 max-w-[300px] relative z-10">{c.sub}</p>

      {/* Stats */}
      <div className="flex gap-4 mt-10 relative z-10">
        {c.stats.map(s => (
          <div key={s.lbl} className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-xl p-3.5">
            <div className="font-['Bebas_Neue',sans-serif] text-[28px] text-[#FF4D00] leading-none">{s.val}</div>
            <div className="text-[10px] text-[#555] mt-1 font-semibold tracking-wide">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Decorative line */}
      <div className="mt-10 h-px bg-gradient-to-r from-[rgba(255,77,0,0.4)] to-transparent relative z-10" />
    </div>
  );
}

// ── Spinner ──
function Spinner() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!fullName.trim()) {
        toast({ title: "Name required", description: "Please enter your full name", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a verification link. Please verify to sign in." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full h-[54px] bg-[rgba(255,255,255,0.04)] border-[1.5px] border-[rgba(255,255,255,0.1)] rounded-xl px-4 text-[15px] text-white font-['Outfit',sans-serif] outline-none transition-all focus:border-[rgba(255,77,0,0.7)] focus:bg-[rgba(255,77,0,0.05)]";
  const inputWithIconClass = `${inputClass} pl-11`;

  return (
    <div className="min-h-screen flex font-['Outfit',sans-serif] bg-[#080808] text-[#F5F3EE] overflow-hidden">
      {/* Left Visual Panel */}
      <LeftPanel mode={mode} />

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-[60px] relative overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-[11px] bg-[#FF4D00] flex items-center justify-center font-['Bebas_Neue',sans-serif] text-[22px] text-white shadow-[0_0_20px_rgba(255,77,0,0.5)]">P</div>
            <div>
              <div className="font-['Bebas_Neue',sans-serif] text-xl tracking-wide">PAYLOOM</div>
              <div className="text-[9px] text-[#FF4D00] font-bold tracking-[2px] uppercase">Instants</div>
            </div>
          </div>

          <div className="mb-9" style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 className="text-[28px] font-extrabold tracking-tight mb-1.5">
              {mode === "login" ? "Sign in to PayLoom" : "Create your account"}
            </h1>
            <p className="text-sm text-[#666] leading-relaxed">
              {mode === "login" ? "Enter your credentials to access your dashboard." : "Join PayLoom Instants — start selling or shopping today."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="text-[11px] font-bold text-[#666] tracking-[1.5px] uppercase mb-2 block">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">👤</span>
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Amara Kamau"
                    className={inputWithIconClass} required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#666] tracking-[1.5px] uppercase mb-2 block">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">✉️</span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputWithIconClass} required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#666] tracking-[1.5px] uppercase mb-2 block">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`${inputWithIconClass} pr-12`} required minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-[54px] bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] border-none rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(255,77,0,0.3)] hover:shadow-[0_12px_40px_rgba(255,77,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <><Spinner /> Please wait...</> : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 text-[#333] text-xs">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
            <span>{mode === "login" ? "New to PayLoom?" : "Already have an account?"}</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
          </div>

          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full h-[54px] bg-transparent border-[1.5px] border-[rgba(255,255,255,0.1)] rounded-xl text-[#888] text-sm font-medium flex items-center justify-center gap-2 hover:border-[rgba(255,255,255,0.25)] hover:text-white transition-all cursor-pointer">
            {mode === "login" ? "Create an Account" : "Sign In Instead"}
          </button>

          {/* Country flags */}
          <div className="flex gap-3 justify-center text-lg mt-8">
            {["🇰🇪", "🇳🇬", "🇬🇭", "🇺🇬", "🇹🇿"].map(f => <span key={f}>{f}</span>)}
          </div>

          <div className="text-xs text-[#444] text-center mt-6 leading-relaxed">
            By continuing you agree to PayLoom's{" "}
            <span className="text-[#FF4D00] cursor-pointer">Terms of Service</span>
            {" "}and{" "}
            <span className="text-[#FF4D00] cursor-pointer">Privacy Policy</span>.
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className={`h-1.5 rounded-full transition-all ${mode === "login" ? "w-6 bg-[#FF4D00]" : "w-1.5 bg-[rgba(255,255,255,0.1)]"}`} />
          <div className={`h-1.5 rounded-full transition-all ${mode === "signup" ? "w-6 bg-[#FF4D00]" : "w-1.5 bg-[rgba(255,255,255,0.1)]"}`} />
        </div>

        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}
