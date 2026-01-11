import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, PhoneIcon, RefreshCwIcon, MailIcon, LockIcon, ArrowLeftIcon } from '@/components/icons';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, requestOTP } = useAuth();
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

    const phoneSchema = z
        .string()
        .trim()
        .refine((val) => {
            const digits = val.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        }, 'Enter a valid phone number');

    const normalizePhone = (val: string) => val.replace(/\D/g, '');

    // Countdown timer effect
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        const normalizedPhone = normalizePhone(phone);

        setIsLoading(true);
        const result = await requestOTP(normalizedPhone, 'LOGIN');

        if (result.success) {
            setStep('otp');
            setCountdown(60);
            if (result.otp) {
                setDevOtp(result.otp);
            }
        } else {
            setError(result.error || 'Failed to send OTP');
        }
        setIsLoading(false);
    };

    // Use useCallback to prevent infinite loops
    const handleResendOTP = useCallback(async () => {
        if (countdown > 0 || isResending) return;

        setError('');
        setIsResending(true);

        const normalizedPhone = normalizePhone(phone);
        const result = await requestOTP(normalizedPhone, 'LOGIN');

        if (result.success) {
            setCountdown(60);
            if (result.otp) {
                setDevOtp(result.otp);
            }
        } else {
            setError(result.error || 'Failed to resend OTP');
        }
        setIsResending(false);
    }, [countdown, isResending, phone, requestOTP]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        setIsLoading(true);
        const normalizedPhone = normalizePhone(phone);
        const result = await login(normalizedPhone, otp);

        if (result.success) {
            handleLoginSuccess();
        } else {
            setError(result.error || 'Login failed');
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        try {
            const result = await api.loginWithEmail(email, password);
            if (result.success) {
                handleLoginSuccess();
            } else {
                setError(result.error || 'Invalid credentials');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        // Wait a brief moment for state to update
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
                        <p className="text-gray-500">
                            {loginMethod === 'phone'
                                ? (step === 'phone' ? 'Enter your phone number to receive OTP.' : 'Enter the OTP sent to your phone.')
                                : 'Enter your email and password to sign in.'}
                        </p>
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

                    {/* Method Selection Tabs */}
                    {step === 'phone' && (
                        <div className="flex p-1 mb-8 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setLoginMethod('phone')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition ${loginMethod === 'phone' ? 'bg-white shadow text-[#112D32]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <PhoneIcon size={18} />
                                Phone OTP
                            </button>
                            <button
                                onClick={() => setLoginMethod('email')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition ${loginMethod === 'email' ? 'bg-white shadow text-[#112D32]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <MailIcon size={18} />
                                Email & Password
                            </button>
                        </div>
                    )}

                    {/* Phone OTP Login Flow */}
                    {loginMethod === 'phone' && (
                        step === 'phone' ? (
                            <form onSubmit={handleRequestOTP} className="space-y-6 animate-in slide-in-from-right">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                                        <input
                                            type="tel"
                                            required
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition"
                                            placeholder="+254 7XX XXX XXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
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
                                            Send OTP <ArrowRightIcon size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full px-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition text-center text-2xl tracking-widest font-mono"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        OTP sent to {phone}
                                    </p>
                                </div>

                                {/* Resend OTP Button with Countdown */}
                                <div className="flex items-center justify-center">
                                    {countdown > 0 ? (
                                        <p className="text-sm text-[#6E6658]">
                                            Resend OTP in <span className="font-semibold text-[#254E58]">{countdown}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={isResending}
                                            className="flex items-center gap-2 text-sm font-semibold text-[#254E58] hover:text-[#112D32] transition disabled:opacity-50"
                                        >
                                            {isResending ? (
                                                <>
                                                    <RefreshCwIcon size={16} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCwIcon size={16} />
                                                    Resend OTP
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-full bg-[#254E58] text-white font-bold py-4 rounded-xl hover:bg-[#112D32] transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In <ArrowRightIcon size={20} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); setCountdown(0); }}
                                    className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
                                >
                                    ← Change phone number
                                </button>
                            </form>
                        )
                    )}

                    {/* Email Login Flow */}
                    {loginMethod === 'email' && (
                        <form onSubmit={handleEmailLogin} className="space-y-6 animate-in slide-in-from-right">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6658]" size={20} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#88BDBC]/30 focus:outline-none focus:border-[#254E58] focus:ring-4 focus:ring-[#88BDBC]/10 transition"
                                        placeholder="admin@payingzee.com"
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

                            <div className="flex justify-end">
                                <a href="#" className="text-sm font-semibold text-[#254E58] hover:underline">Forgot password?</a>
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

                    <div className="mt-8 text-center text-sm text-[#6E6658]">
                        Don't have an account?
                        <a href="/signup" className="font-bold text-[#254E58] hover:text-[#112D32] ml-1">Create free account</a>
                    </div>
                </div>
            </div>
        </div>
    );
}