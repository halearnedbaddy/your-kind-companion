import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, MailIcon, LockIcon } from '@/components/icons';
import { useCloudAuth } from '@/contexts/CloudAuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useCloudAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        handleLoginSuccess();
      } else {
        setError(result.error || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setTimeout(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'SELLER') {
        navigate('/seller');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/buyer');
      }
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#254E58]/30 border-t-[#254E58] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 bg-[#112D32] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#254E58]/90 to-[#112D32]/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000"
          alt="Secure Payment"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-20 flex flex-col justify-center px-16 text-white h-full">
          <h1 className="text-5xl font-black mb-6 leading-tight">Secure Payments for <br /> Social Commerce.</h1>
          <p className="text-xl text-[#88BDBC] max-w-md leading-relaxed">
            Join thousands of Kenyans buying and selling safely on Instagram, WhatsApp, and TikTok with SWIFTLINE Escrow.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back! 👋</h2>
            <p className="text-gray-500">Enter your email and password to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#4F4A41]/10 border border-[#4F4A41]/30 rounded-xl text-[#4F4A41] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6 animate-in slide-in-from-right">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#254E58] text-white font-bold py-4 rounded-xl hover:bg-[#112D32] transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRightIcon size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500">
            Don't have an account?{' '}
            <a href="/signup" className="font-bold text-[#254E58] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
