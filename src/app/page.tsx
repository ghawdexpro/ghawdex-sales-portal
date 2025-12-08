'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackWizardStart } from '@/lib/analytics';
import { WizardProvider } from '@/components/wizard/WizardContext';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1Location from '@/components/wizard/steps/Step1Location';
import Step2Consumption from '@/components/wizard/steps/Step2Consumption';
import Step3System from '@/components/wizard/steps/Step3System';
import Step4Financing from '@/components/wizard/steps/Step4Financing';
import Step5Contact from '@/components/wizard/steps/Step5Contact';
import Step6Summary from '@/components/wizard/steps/Step6Summary';
import { useWizard } from '@/components/wizard/WizardContext';
import { TestimonialCarouselDark, GrantCountdownDark } from '@/components/trust';

// Location-based grant data
const GRANT_DATA = {
  gozo: {
    name: 'Gozo',
    solarGrant: 3000,
    solarPercent: 50,
    batteryGrant: 8550,
    batteryPercent: 95,
    totalGrant: 11550,
    customerCost: 499,
    headline: 'Gozo Residents: €499 Battery with 95% Grant',
    subheadline: 'Up to €11,550 in grants available - Limited time offer',
  },
  malta: {
    name: 'Malta',
    solarGrant: 3000,
    solarPercent: 50,
    batteryGrant: 7200,
    batteryPercent: 80,
    totalGrant: 10200,
    customerCost: 1800,
    headline: 'Get Up to €10,200 in Solar Grants',
    subheadline: '50% Solar + 80% Battery grants - Don\'t miss out',
  },
};

// Prefill data from URL params (Zoho CRM links)
interface PrefillData {
  name: string;
  email: string;
  phone: string;
  zohoId: string;
}

// Component to handle prefill data dispatch on mount
function PrefillHandler({ prefillData }: { prefillData: PrefillData | null }) {
  const { dispatch } = useWizard();

  useEffect(() => {
    if (prefillData) {
      dispatch({
        type: 'SET_PREFILL',
        payload: {
          fullName: prefillData.name,
          email: prefillData.email,
          phone: prefillData.phone,
          zohoLeadId: prefillData.zohoId,
        },
      });
    }
  }, [prefillData, dispatch]);

  return null;
}

function WizardSteps() {
  const { state } = useWizard();

  switch (state.step) {
    case 1:
      return <Step1Location />;
    case 2:
      return <Step2Consumption />;
    case 3:
      return <Step3System />;
    case 4:
      return <Step4Financing />;
    case 5:
      return <Step5Contact />;
    case 6:
      return <Step6Summary />;
    default:
      return <Step1Location />;
  }
}

function Wizard({ onClose, prefillData }: { onClose: () => void; prefillData: PrefillData | null }) {
  return (
    <WizardProvider>
      <PrefillHandler prefillData={prefillData} />
      <WizardLayout onClose={onClose}>
        <WizardSteps />
      </WizardLayout>
    </WizardProvider>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const ctaButtonRef = useRef<HTMLButtonElement>(null);
  const [showStickyBtn, setShowStickyBtn] = useState(false);

  // Detect location from UTM params - default to Gozo (better deal to showcase)
  const location = useMemo(() => {
    const campaign = searchParams.get('utm_campaign')?.toLowerCase() || '';
    const content = searchParams.get('utm_content')?.toLowerCase() || '';
    const source = searchParams.get('location')?.toLowerCase() || '';

    if (campaign.includes('malta') || content.includes('malta') || source === 'malta') {
      return 'malta';
    }
    return 'gozo';
  }, [searchParams]);

  const grantInfo = GRANT_DATA[location];

  // Intersection Observer for sticky CTA
  useEffect(() => {
    if (!ctaButtonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky button when hero CTA is not visible
        setShowStickyBtn(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(ctaButtonRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute prefill data from URL params (derived state, no effect needed)
  const initialPrefillData = useMemo((): PrefillData | null => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const zohoId = searchParams.get('zoho_id');

    if (name && email && zohoId) {
      return {
        name: decodeURIComponent(name),
        email: decodeURIComponent(email),
        phone: phone ? decodeURIComponent(phone) : '',
        zohoId: zohoId,
      };
    }
    return null;
  }, [searchParams]);

  // Initialize wizard state based on prefill
  const [showWizard, setShowWizard] = useState(() => !!initialPrefillData);
  const [prefillData, setPrefillData] = useState<PrefillData | null>(initialPrefillData);

  // Track wizard start for prefilled users (one-time effect)
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (initialPrefillData && !hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackWizardStart('zoho_crm');
    }
  }, [initialPrefillData]);

  const handleStart = () => {
    trackWizardStart();
    setShowWizard(true);
  };

  const handleClose = () => {
    setShowWizard(false);
    setPrefillData(null);
  };

  // Show wizard if started
  if (showWizard) {
    return <Wizard onClose={handleClose} prefillData={prefillData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          <span className="animate-pulse inline-block mr-2">🔥</span>
          {location === 'gozo'
            ? 'Gozo 95% Battery Grant ending soon - Only 12 installation slots left for December!'
            : 'Malta 80% Battery Grant limited - Book your free assessment today!'
          }
          <span className="animate-pulse inline-block ml-2">🔥</span>
        </p>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden snap-section">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[128px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-16 sm:pb-24">
          {/* Hero Logo - Big and Bold (hidden on mobile) */}
          <div className="hidden sm:flex items-center justify-center mb-8 sm:mb-12">
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 scale-150" />
              <img
                src="/logo/Ghawdex engineering logo.svg"
                alt="GhawdeX Engineering"
                className="relative h-24 sm:h-32 lg:h-40 w-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-4xl mx-auto px-2">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-amber-200 text-xs sm:text-sm font-medium">
                {location === 'gozo' ? '🏝️ Gozo Exclusive Offer' : '☀️ Malta\'s #1 Solar Installer'}
              </span>
            </div>

            {/* Dynamic Headline based on location */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {grantInfo.headline}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mt-2">
                {location === 'gozo'
                  ? 'Full System from €499!'
                  : 'Save Thousands on Solar'
                }
              </span>
            </h1>

            <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {grantInfo.subheadline}
            </p>

            {/* Grant Breakdown Mini Cards */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="text-amber-400 font-bold text-lg sm:text-xl">€{grantInfo.solarGrant.toLocaleString()}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{grantInfo.solarPercent}% Solar Grant</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="text-amber-400 font-bold text-lg sm:text-xl">€{grantInfo.batteryGrant.toLocaleString()}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{grantInfo.batteryPercent}% Battery Grant</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl px-4 py-3">
                <div className="text-white font-bold text-lg sm:text-xl">€{grantInfo.totalGrant.toLocaleString()}</div>
                <div className="text-amber-200 text-xs sm:text-sm">Total Available</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              ref={ctaButtonRef}
              onClick={handleStart}
              className="group relative inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
            >
              <span>Calculate My Savings Now</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <p className="text-gray-500 text-xs sm:text-sm mt-4">
              Free assessment • No commitment • Results in 2 minutes
            </p>
          </div>

          {/* Stats - Updated to match ads */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mt-12 sm:mt-16">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-1">
                €{grantInfo.totalGrant.toLocaleString()}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Max Grant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">14 Days</div>
              <div className="text-gray-500 text-xs sm:text-sm">Guaranteed Install</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">2,000+</div>
              <div className="text-gray-500 text-xs sm:text-sm">Happy Customers</div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 opacity-70">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm">MRA Licensed</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm">ARMS Grant Certified</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="text-xs sm:text-sm">0% BOV Financing</span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="relative bg-[#111827] py-12 sm:py-20 snap-section">
        <div className="section-divider"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-amber-400">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Enter Your Address</h3>
              <p className="text-gray-400 text-sm sm:text-base">We&apos;ll analyze your roof using satellite imagery and AI</p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-amber-400">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Get Your Quote</h3>
              <p className="text-gray-400 text-sm sm:text-base">Instant pricing with savings calculations and financing options</p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-amber-400">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Book Installation</h3>
              <p className="text-gray-400 text-sm sm:text-base">Sign digitally and we&apos;ll schedule your installation</p>
            </div>
          </div>

          {/* Grant Countdown Timer */}
          <div className="mt-12 sm:mt-16 max-w-2xl mx-auto">
            <GrantCountdownDark />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative bg-[#0a0a0a] py-12 sm:py-20 snap-section">
        <div className="section-divider"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-400">Join 2,000+ happy homeowners who made the switch</p>
          </div>

          {/* Dynamic Testimonial Carousel with Photos */}
          <TestimonialCarouselDark
            gozoOnly={false}
            autoRotateInterval={6000}
          />

          {/* Social Proof Stats */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400">4.9/5</div>
              <div className="text-gray-500 text-sm mt-1">Google Reviews</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400">98%</div>
              <div className="text-gray-500 text-sm mt-1">Recommend Us</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400">€8M+</div>
              <div className="text-gray-500 text-sm mt-1">Grants Secured</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400">14 Days</div>
              <div className="text-gray-500 text-sm mt-1">Avg. Install Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grant Breakdown Section */}
      <div className="relative bg-[#111827] py-12 sm:py-20 snap-section">
        <div className="section-divider"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {location === 'gozo' ? 'Gozo Exclusive Grant Breakdown' : 'Your Grant Breakdown'}
            </h2>
            <p className="text-gray-400">See exactly how much you can save with government grants</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Grant Visualization */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Typical Full System Cost</h3>

              {/* Solar Grant Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Solar Panels ({grantInfo.solarPercent}% Grant)</span>
                  <span className="text-amber-400 font-medium">-€{grantInfo.solarGrant.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${grantInfo.solarPercent}%` }} />
                </div>
              </div>

              {/* Battery Grant Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Battery Storage ({grantInfo.batteryPercent}% Grant)</span>
                  <span className="text-amber-400 font-medium">-€{grantInfo.batteryGrant.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${grantInfo.batteryPercent}%` }} />
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Total Grant Value</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    €{grantInfo.totalGrant.toLocaleString()}
                  </span>
                </div>
                {location === 'gozo' && (
                  <p className="text-green-400 text-sm mt-3">
                    *Gozo residents get 95% battery grant vs 80% in Malta!
                  </p>
                )}
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Your Estimated Cost</h3>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Full System Value</span>
                  <span className="text-white">€{(grantInfo.totalGrant + grantInfo.customerCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Solar Grant ({grantInfo.solarPercent}%)</span>
                  <span className="text-green-400">-€{grantInfo.solarGrant.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Battery Grant ({grantInfo.batteryPercent}%)</span>
                  <span className="text-green-400">-€{grantInfo.batteryGrant.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-4 mt-4 bg-white/5 rounded-xl px-4">
                  <span className="text-white font-semibold">You Pay Only</span>
                  <span className="text-2xl font-bold text-amber-400">€{grantInfo.customerCost.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-3 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                Get My Exact Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0a0a0a]/95 to-[#1a1a2e]/95 backdrop-blur-md border-t border-white/10 p-4 transition-all duration-300 ${
          showStickyBtn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium">
              {location === 'gozo'
                ? `€${grantInfo.totalGrant.toLocaleString()} in grants available - Only €${grantInfo.customerCost} out of pocket!`
                : `Save up to €${grantInfo.totalGrant.toLocaleString()} with government grants`
              }
            </p>
          </div>
          <button
            onClick={handleStart}
            className="flex-1 sm:flex-none group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-sm sm:text-base px-6 py-3 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
          >
            <span>Get My Quote Now</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-amber-400">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
