'use client';

import { useState } from 'react';
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

function Wizard({ onClose }: { onClose: () => void }) {
  return (
    <WizardProvider>
      <WizardLayout onClose={onClose}>
        <WizardSteps />
      </WizardLayout>
    </WizardProvider>
  );
}

export default function Home() {
  const [showWizard, setShowWizard] = useState(false);

  const handleStart = () => {
    trackWizardStart();
    setShowWizard(true);
  };

  const handleClose = () => {
    setShowWizard(false);
  };

  // Show wizard if started
  if (showWizard) {
    return <Wizard onClose={handleClose} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[128px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-32">
          {/* Logo */}
          <div className="flex items-center justify-center mb-10 sm:mb-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">GhawdeX</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-4xl mx-auto px-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-amber-200 text-xs sm:text-sm font-medium">Malta&apos;s #1 Solar Installer</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Get Your Free Solar Quote
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                In Under 2 Minutes
              </span>
            </h1>

            <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto">
              AI-powered roof analysis, instant pricing, and flexible financing options.
              Professional installation in just 14 days.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleStart}
              className="group relative inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
            >
              <span>Get My Free Quote</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <p className="text-gray-500 text-xs sm:text-sm mt-4">
              No commitment required • Takes less than 2 minutes
            </p>

            <a
              href="/products"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 mt-4 text-sm"
            >
              <span>Browse all products</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mt-12 sm:mt-20">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">2,000+</div>
              <div className="text-gray-500 text-xs sm:text-sm">Installations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">14</div>
              <div className="text-gray-500 text-xs sm:text-sm">Days to Install</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">25yr</div>
              <div className="text-gray-500 text-xs sm:text-sm">Warranty</div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-16 opacity-60">
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
              <span className="text-xs sm:text-sm">Grant Eligible</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="text-xs sm:text-sm">BOV Financing</span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="bg-[#111827] py-12 sm:py-20">
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
        </div>
      </div>
    </div>
  );
}
