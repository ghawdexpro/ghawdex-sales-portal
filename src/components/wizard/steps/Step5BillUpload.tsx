'use client';

import { useWizard } from '../WizardContext';
import BillUpload from '../BillUpload';
import { trackWizardStep } from '@/lib/analytics';
import { trackTelegramWizardStep } from '@/lib/telegram-events';

export default function Step5BillUpload() {
  const { state, dispatch } = useWizard();

  const handleSkip = () => {
    trackWizardStep(5, 'Bill Upload - Skipped');
    trackTelegramWizardStep(5, 'Bill Upload', {});

    // Skip to Contact (now Step 6) or Step 7 if prefilled
    if (state.isPrefilledLead) {
      dispatch({ type: 'SET_STEP', payload: 7 });
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handleContinue = () => {
    trackWizardStep(5, 'Bill Upload');
    trackTelegramWizardStep(5, 'Bill Upload', {});

    // Same logic as skip - bill upload is tracked in state
    if (state.isPrefilledLead) {
      dispatch({ type: 'SET_STEP', payload: 7 });
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Upload Your Electricity Bill
        </h2>
        <p className="text-gray-400">
          <span className="inline-block bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-sm font-medium mr-2">
            Optional
          </span>
          Help us speed things up! We'll use your bill to automatically fill out grant applications and paperwork.
        </p>
      </div>

      <BillUpload />

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleContinue}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-4 px-6 rounded-xl transition-colors"
        >
          {state.billFileUrl ? 'Continue with Bill' : 'Skip Bill Upload'}
        </button>
        <button
          onClick={handleSkip}
          className="sm:w-auto bg-white/5 hover:bg-white/10 text-white font-medium py-4 px-6 rounded-xl border border-white/20 transition-colors"
        >
          Skip This Step →
        </button>
      </div>

      <div className="text-center text-gray-500 text-sm">
        <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your bill is stored securely and only used for grant paperwork
      </div>
    </div>
  );
}
