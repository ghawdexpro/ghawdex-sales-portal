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
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo/Ghawdex engineering logo.svg"
              alt="GhawdeX Engineering"
              className="h-10 w-auto"
            />
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close wizard"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-white/10 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      state.step > step.num
                        ? 'bg-green-500 text-white'
                        : state.step === step.num
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-gray-500'
                    }`}
                  >
                    {state.step > step.num ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${
                    state.step >= step.num ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${
                    state.step > step.num ? 'bg-green-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
