import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, MailIcon, LockIcon, PhoneIcon } from '@/components/icons';
import { useCloudAuth } from '@/contexts/CloudAuthContext';

type AuthMode = 'email' | 'otp';
type OtpStep = 'phone' | 'verify';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyOtp, isLoading: authLoading } = useCloudAuth();
  
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP login state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    // Validate phone format (Kenya format: +254...)
    const phoneRegex = /^\+254[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('Enter a valid Kenyan phone number (e.g., +254712345678)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOtp(phone);
      if (result.success) {
        setSuccess('OTP sent! Check your phone for the verification code.');
        setOtpStep('verify');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(phone, otpCode);
      if (result.success) {
        handleLoginSuccess();
      } else {
        setError(result.error || 'Invalid OTP');
        setIsLoading(false);
      }
    } catch {
      setError('OTP verification failed. Please try again.');
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

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setOtpStep('phone');
  };

  const resetOtpFlow = () => {
    setOtpStep('phone');
    setOtpCode('');
    setError('');
    setSuccess('');
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
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back! 👋</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => switchAuthMode('email')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                authMode === 'email'
                  ? 'bg-white text-[#254E58] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => switchAuthMode('otp')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                authMode === 'otp'
                  ? 'bg-white text-[#254E58] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#4F4A41]/10 border border-[#4F4A41]/30 rounded-xl text-[#4F4A41] text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Email Login Form */}
          {authMode === 'email' && (
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
          )}

          {/* OTP Login Form */}
          {authMode === 'otp' && (
            <>
              {otpStep === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-6 animate-in slide-in-from-right">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                      <input
                        type="tel"
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition"
                        placeholder="+254712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the phone number you registered with
                    </p>
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
                        Send OTP <ArrowRightIcon size={20} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {otpStep === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition font-mono"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Enter the 6-digit code sent to <span className="font-bold">{phone}</span>
                    </p>
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
                        Verify & Sign In <ArrowRightIcon size={20} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={resetOtpFlow}
                      className="text-sm text-[#254E58] hover:underline"
                    >
                      Change phone number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-sm text-[#254E58] hover:underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
          </div>

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