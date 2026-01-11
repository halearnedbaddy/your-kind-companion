import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon, BuyerIcon, ShoppingBagIcon, PhoneIcon, MailIcon, LockIcon, ArrowLeftIcon } from '@/components/icons';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

type SignupMethod = 'phone' | 'email';

export function SignupPage() {
  const navigate = useNavigate();
  const { register, requestOTP } = useAuth();
  const [step, setStep] = useState<'role' | 'method' | 'details' | 'otp'>('role');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | null>(null);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const phoneSchema = z
    .string()
    .trim()
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }, 'Enter a valid phone number');

  const emailSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

  const normalizePhone = (val: string) => val.replace(/\D/g, '');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const handleRoleSelect = (selectedRole: 'BUYER' | 'SELLER') => {
    setRole(selectedRole);
    setStep('method');
  };

  const handleMethodSelect = (method: SignupMethod) => {
    setSignupMethod(method);
    setStep('details');
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = phoneSchema.safeParse(formData.phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
      return;
    }

    const normalizedPhone = normalizePhone(formData.phone);

    setIsLoading(true);
    const result = await requestOTP(normalizedPhone, 'REGISTRATION');

    if (result.success) {
      setStep('otp');
      if (result.otp) {
        setDevOtp(result.otp);
      }
    } else {
      setError(result.error || 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = phoneSchema.safeParse(formData.phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
      return;
    }

    setIsLoading(true);

    const result = await register({
      phone: normalizePhone(formData.phone),
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email || undefined,
      role: role || 'BUYER',
      otp: formData.otp,
    });

    if (result.success) {
      navigate(role === 'SELLER' ? '/seller' : '/buyer');
    } else {
      setError(result.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = emailSchema.safeParse({
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.registerWithEmail({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        role: role || 'BUYER',
      });

      if (response.success && response.data) {
        // User is stored in localStorage by api.registerWithEmail
        // AuthContext will pick it up via the storage listener
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate(role === 'SELLER' ? '/seller' : '/buyer');
        }, 200);
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    }

    setIsLoading(false);
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('details');
      setFormData({ ...formData, otp: '' });
      setDevOtp(null);
    } else if (step === 'details') {
      setStep('method');
    } else if (step === 'method') {
      setStep('role');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 bg-[#112D32] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#254E58]/90 to-[#112D32]/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=2000"
          alt="Growth"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-20 flex flex-col justify-center px-16 text-white h-full">
          <div className="mb-6 inline-flex p-3 bg-[#254E58]/30 backdrop-blur-md rounded-xl border border-[#88BDBC]/30 w-fit">
            <CheckCircleIcon className="text-[#88BDBC] mr-2" size={20} />
            <span className="font-bold">Trusted by 10,000+ Users</span>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Start Your Journey <br /> with Confidence.</h1>
          <p className="text-xl text-[#88BDBC] max-w-md leading-relaxed">
            Whether you're buying kicks or selling electronics, we ensure every shilling is safe.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account </h2>
            <p className="text-gray-500">Join SWIFTLINE today.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#4F4A41]/10 border border-[#4F4A41]/30 rounded-xl text-[#4F4A41] text-sm">
              {error}
            </div>
          )}

          {devOtp && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
              <strong>ONE TIME OTP:</strong> Your OTP is <code className="font-mono bg-green-100 px-2 py-1 rounded text-green-900">{devOtp}</code>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <p className="text-lg font-bold text-gray-900 mb-4">I want to...</p>

              <button
                onClick={() => handleRoleSelect('BUYER')}
                className="w-full p-6 rounded-2xl border-2 border-[#88BDBC]/30 hover:border-[#254E58] hover:bg-[#88BDBC]/10 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#88BDBC]/20 text-[#254E58] rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <ShoppingBagIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#254E58]">Buy Safely</h3>
                    <p className="text-sm text-[#6E6658]">I want to shop without getting scammed.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('SELLER')}
                className="w-full p-6 rounded-2xl border-2 border-[#88BDBC]/30 hover:border-[#254E58] hover:bg-[#88BDBC]/10 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#88BDBC]/20 text-[#254E58] rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <BuyerIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#254E58]">Sell Securely</h3>
                    <p className="text-sm text-[#6E6658]">I want to build trust with customers.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Method Selection */}
          {step === 'method' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#88BDBC]/20 text-[#254E58]">
                  {role === 'BUYER' ? 'Buyer Account' : 'Seller Account'}
                </span>
                <button type="button" onClick={() => setStep('role')} className="text-xs text-[#6E6658] hover:underline">Change</button>
              </div>

              <p className="text-lg font-bold text-gray-900 mb-4">Choose signup method</p>

              <button
                onClick={() => handleMethodSelect('phone')}
                className="w-full p-6 rounded-2xl border-2 border-[#88BDBC]/30 hover:border-[#254E58] hover:bg-[#88BDBC]/10 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#88BDBC]/20 text-[#254E58] rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <PhoneIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Phone + OTP</h3>
                    <p className="text-sm text-[#6E6658]">Quick verification via SMS code</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('email')}
                className="w-full p-6 rounded-2xl border-2 border-[#88BDBC]/30 hover:border-[#254E58] hover:bg-[#88BDBC]/10 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#88BDBC]/20 text-[#254E58] rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <MailIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email + Password</h3>
                    <p className="text-sm text-[#6E6658]">Traditional login credentials</p>
                  </div>
                </div>
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                OTP delayed? Try email signup as fallback.
              </p>
            </div>
          )}

          {/* Step 3: Details Form - Phone Method */}
          {step === 'details' && signupMethod === 'phone' && (
            <form onSubmit={handleRequestOTP} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#88BDBC]/20 text-[#254E58]">
                  {role === 'BUYER' ? 'Buyer' : 'Seller'} • Phone OTP
                </span>
                <button type="button" onClick={goBack} className="text-xs text-[#6E6658] hover:underline flex items-center gap-1">
                  <ArrowLeftIcon size={12} /> Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] transition"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] transition"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                  <input
                    type="tel"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                    placeholder="+254 7XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
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

          {/* Step 3: Details Form - Email Method */}
          {step === 'details' && signupMethod === 'email' && (
            <form onSubmit={handleEmailRegister} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#88BDBC]/20 text-[#254E58]">
                  {role === 'BUYER' ? 'Buyer' : 'Seller'} • Email
                </span>
                <button type="button" onClick={goBack} className="text-xs text-[#6E6658] hover:underline flex items-center gap-1">
                  <ArrowLeftIcon size={12} /> Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] transition"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] transition"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                    Create Account <ArrowRightIcon size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 4: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handlePhoneRegister} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.otp.length !== 6}
                className={`w-full text-white font-bold py-4 rounded-xl transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 ${role === 'BUYER' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRightIcon size={20} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
              >
                ← Back to details
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-[#6E6658]">
            Already have an account?
            <a href="/login" className="font-bold text-[#254E58] hover:underline ml-1">Sign in here</a>
          </div>
        </div>
      </div>
    </div>
  );
}
