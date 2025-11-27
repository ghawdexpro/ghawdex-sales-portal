'use client';

import { useWizard } from './WizardContext';

const STEPS = [
  { num: 1, label: 'Location' },
  { num: 2, label: 'Consumption' },
  { num: 3, label: 'System' },
  { num: 4, label: 'Financing' },
  { num: 5, label: 'Contact' },
  { num: 6, label: 'Summary' },
];

interface WizardLayoutProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export default function WizardLayout({ children, onClose }: WizardLayoutProps) {
  const { state } = useWizard();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Combined Header with Progress */}
      <header className="border-b border-white/10 bg-black/70">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close wizard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Progress Steps - centered and compact */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center">
                {STEPS.map((step, index) => (
                  <div key={step.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                          state.step > step.num
                            ? 'bg-green-500 text-white'
                            : state.step === step.num
                            ? 'bg-amber-500 text-black'
                            : 'bg-white/10 text-gray-500'
                        }`}
                      >
                        {state.step > step.num ? (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.num
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-1 hidden sm:block ${
                        state.step >= step.num ? 'text-white' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-4 sm:w-10 h-0.5 mx-0.5 sm:mx-1.5 ${
                        state.step > step.num ? 'bg-green-500' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer for symmetry */}
            <div className="w-8" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
