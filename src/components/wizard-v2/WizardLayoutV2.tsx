'use client';

import { ReactNode } from 'react';
import { useWizardV2 } from './WizardContextV2';
import { WIZARD_V2_STEPS } from '@/lib/types-v2';

function ProgressBarV2() {
  const { state } = useWizardV2();
  const progress = (state.step / state.totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators - only on larger screens */}
      <div className="hidden sm:flex justify-between mt-3 px-2">
        {WIZARD_V2_STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex flex-col items-center ${
              step.number <= state.step ? 'text-amber-400' : 'text-gray-600'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                step.number < state.step
                  ? 'bg-amber-500 text-black'
                  : step.number === state.step
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                  : 'bg-white/5 border border-white/10 text-gray-500'
              }`}
            >
              {step.number < state.step ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs mt-1">{step.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WizardLayoutV2Props {
  children: ReactNode;
  onClose?: () => void;
}

export default function WizardLayoutV2({ children, onClose }: WizardLayoutV2Props) {
  const { state } = useWizardV2();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <img
              src="/logo/Ghawdex engineering logo.svg"
              alt="GhawdeX"
              className="h-8 w-auto"
            />

            {/* Step indicator (mobile) */}
            <div className="sm:hidden text-sm text-gray-400">
              Step {state.step} of {state.totalSteps}
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close wizard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <ProgressBarV2 />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Footer - Trust badges */}
      <footer className="py-4 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>MRA Licensed</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>ARMS Certified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-400">★</span>
            <span>4.9/5 Rating</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
