import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import swiftlinersLogo from '@/assets/swiftliners-logo.png';
import whatsappImg from '@/assets/images/whatsapp.png';
import instagramImg from '@/assets/images/instagram.png';
import facebookImg from '@/assets/images/facebook.png';
import heroMainImg from '@/assets/images/hero-main.png';
import { BuyerIcon, EscrowIcon, SellerIcon, StoreIcon, LinkIcon, ArrowRightIcon } from '@/components/icons';

type Screen = 'splash' | 'onboarding1' | 'onboarding2' | 'onboarding3';

export function HomePage() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [fadeIn, setFadeIn] = useState(false);

  // Splash screen auto-advance
  useEffect(() => {
    if (currentScreen === 'splash') {
      setFadeIn(true);
      const timer = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => {
          setCurrentScreen('onboarding1');
          setFadeIn(true);
        }, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleNext = () => {
    setFadeIn(false);
    setTimeout(() => {
      if (currentScreen === 'onboarding1') setCurrentScreen('onboarding2');
      else if (currentScreen === 'onboarding2') setCurrentScreen('onboarding3');
      else if (currentScreen === 'onboarding3') navigate('/login');
      setFadeIn(true);
    }, 300);
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  // Splash Screen
  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-[#112D32] flex items-center justify-center overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#88BDBC]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#254E58]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Logo */}
        <div className={`relative z-10 transition-all duration-1000 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <img 
            src={swiftlinersLogo} 
            alt="Swiftliners" 
            className="w-72 md:w-96 h-auto drop-shadow-2xl"
          />
        </div>
      </div>
    );
  }

  // Onboarding Screens
  return (
    <div className="min-h-screen bg-[#112D32] flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#88BDBC]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#254E58]/5 rounded-full blur-3xl" />
      </div>

      {/* Skip button (not on last screen) */}
      {currentScreen !== 'onboarding3' && (
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={handleSkip}
            className="text-[#88BDBC]/70 hover:text-[#88BDBC] text-sm font-medium transition-colors px-4 py-2"
          >
            Skip
          </button>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Screen 1: The Core Promise */}
        {currentScreen === 'onboarding1' && (
          <div className="max-w-lg mx-auto text-center">
            {/* Visual: Escrow flow animation */}
            <div className="mb-12 relative">
              <div className="flex items-center justify-center gap-4 md:gap-8">
                {/* Buyer */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#88BDBC]/20 border border-[#88BDBC]/30 flex items-center justify-center backdrop-blur-sm">
                    <BuyerIcon className="text-[#88BDBC]" size={40} />
                  </div>
                  <span className="text-[#88BDBC] text-xs mt-2 font-medium">Buyer</span>
                </div>

                {/* Arrow to Escrow */}
                <div className="flex items-center">
                  <div className="w-8 md:w-16 h-0.5 bg-[#88BDBC]/50" />
                  <ArrowRightIcon className="text-[#88BDBC] -ml-1" size={20} />
                </div>

                {/* Escrow (center) */}
                <div className="flex flex-col items-center relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#254E58]/30 border-2 border-[#88BDBC]/50 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-[#88BDBC]/20">
                    <EscrowIcon className="text-[#88BDBC]" size={48} />
                  </div>
                  <span className="text-[#88BDBC] text-xs mt-2 font-bold">ESCROW</span>
                  <div className="absolute -inset-2 bg-[#88BDBC]/10 rounded-3xl blur-xl -z-10 animate-pulse" />
                </div>

                {/* Arrow to Seller */}
                <div className="flex items-center">
                  <div className="w-8 md:w-16 h-0.5 bg-[#88BDBC]/50" />
                  <ArrowRightIcon className="text-[#88BDBC] -ml-1" size={20} />
                </div>

                {/* Seller */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#88BDBC]/20 border border-[#88BDBC]/30 flex items-center justify-center backdrop-blur-sm">
                    <SellerIcon className="text-[#88BDBC]" size={40} />
                  </div>
                  <span className="text-[#88BDBC] text-xs mt-2 font-medium">Seller</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Sell Online With{' '}
              <span className="text-[#88BDBC]">
                Confidence
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-md mx-auto">
              Every payment is protected with escrow — buyers trust, sellers get paid.
            </p>
          </div>
        )}

        {/* Screen 2: One Platform, Two Ways */}
        {currentScreen === 'onboarding2' && (
          <div className="max-w-lg mx-auto text-center">
            {/* Visual: Split card design */}
            <div className="mb-12 flex items-center justify-center gap-6">
              {/* Storefront Card */}
              <div className="group relative">
                <div className="w-32 h-40 md:w-40 md:h-48 rounded-2xl bg-[#254E58]/20 border border-[#88BDBC]/30 flex flex-col items-center justify-center backdrop-blur-sm p-4 transition-all duration-300 hover:border-[#88BDBC]/60 hover:scale-105">
                  <StoreIcon className="text-[#88BDBC] mb-3" size={40} />
                  <span className="text-[#88BDBC] text-sm font-semibold">Storefront</span>
                  <span className="text-[#88BDBC]/70 text-xs mt-1">Full catalog</span>
                </div>
              </div>

              {/* Center connector */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-0.5 h-8 bg-[#88BDBC]/30" />
                <div className="w-10 h-10 rounded-full bg-[#254E58]/30 border border-[#88BDBC]/30 flex items-center justify-center">
                  <span className="text-[#88BDBC] text-xs font-bold">OR</span>
                </div>
                <div className="w-0.5 h-8 bg-[#88BDBC]/30" />
              </div>

              {/* Payment Link Card */}
              <div className="group relative">
                <div className="w-32 h-40 md:w-40 md:h-48 rounded-2xl bg-[#254E58]/20 border border-[#88BDBC]/30 flex flex-col items-center justify-center backdrop-blur-sm p-4 transition-all duration-300 hover:border-[#88BDBC]/60 hover:scale-105">
                  <LinkIcon className="text-[#88BDBC] mb-3" size={40} />
                  <span className="text-[#88BDBC] text-sm font-semibold">Payment Link</span>
                  <span className="text-[#88BDBC]/70 text-xs mt-1">Quick sales</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Start Simple.{' '}
              <span className="text-[#88BDBC]">
                Grow Anytime.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-md mx-auto">
              Create a storefront or generate a payment link — switch anytime.
            </p>
          </div>
        )}

        {/* Screen 3: Social Commerce */}
        {currentScreen === 'onboarding3' && (
          <div className="max-w-lg mx-auto text-center">
            {/* Visual: Social platforms with payment flow */}
            <div className="mb-12 relative">
              <div className="flex flex-col items-center justify-center gap-8">
                {/* Main Hero Image */}
                <div className="relative w-full max-w-[280px] aspect-video rounded-2xl overflow-hidden border-2 border-[#88BDBC]/40 shadow-2xl">
                  <img src={heroMainImg} alt="Hero Main" className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center justify-center">
                  {/* Payment link origin */}
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#254E58]/30 border-2 border-[#88BDBC]/40 flex items-center justify-center backdrop-blur-sm">
                      <LinkIcon className="text-[#88BDBC]" size={28} />
                    </div>
                    
                    {/* Flow lines to social icons */}
                    <div className="absolute top-1/2 left-full w-6 md:w-10 h-0.5 bg-[#88BDBC]/50" />
                  </div>

                  {/* Social platforms */}
                  <div className="flex flex-col gap-2 ml-6 md:ml-10">
                    {/* WhatsApp */}
                    <div className="flex items-center gap-3 bg-[#254E58]/20 rounded-xl px-3 py-1.5 border border-[#88BDBC]/30">
                      <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={whatsappImg} alt="WhatsApp" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[#88BDBC] text-xs font-medium">WhatsApp</span>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center gap-3 bg-[#254E58]/20 rounded-xl px-3 py-1.5 border border-[#88BDBC]/30">
                      <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={instagramImg} alt="Instagram" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[#88BDBC] text-xs font-medium">Instagram</span>
                    </div>

                    {/* Facebook */}
                    <div className="flex items-center gap-3 bg-[#254E58]/20 rounded-xl px-3 py-1.5 border border-[#88BDBC]/30">
                      <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={facebookImg} alt="Facebook" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[#88BDBC] text-xs font-medium">Facebook</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight mt-8">
              Built for How You{' '}
              <span className="text-[#88BDBC]">
                Sell Today
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-md mx-auto">
              Share links on WhatsApp, Instagram, or anywhere — payments stay secure.
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-10 pt-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {['onboarding1', 'onboarding2', 'onboarding3'].map((screen) => (
            <div 
              key={screen}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentScreen === screen 
                  ? 'w-8 bg-[#88BDBC]' 
                  : 'w-2 bg-[#88BDBC]/30'
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        {currentScreen === 'onboarding3' ? (
          <button
            onClick={handleGetStarted}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-[#88BDBC] text-[#112D32] font-bold py-4 px-8 rounded-2xl text-lg shadow-lg shadow-[#88BDBC]/30 hover:shadow-[#88BDBC]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
           
            Get Started
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-[#254E58]/30 backdrop-blur-sm border border-[#88BDBC]/30 text-[#88BDBC] font-semibold py-4 px-8 rounded-2xl text-lg hover:bg-[#254E58]/40 transition-all duration-300"
          >
            Continue
            <ArrowRightIcon size={20} />
          </button>
        )}

        {/* Login link on last screen */}
        {currentScreen === 'onboarding3' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full max-w-sm mx-auto mt-4 text-white/70 hover:text-[#88BDBC] text-sm font-medium transition-colors py-2"
          >
            Already have an account? <span className="text-[#88BDBC]">Log in</span>
          </button>
        )}
      </div>
    </div>
  );
}
