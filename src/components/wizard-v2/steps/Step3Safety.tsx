'use client';

import { useState } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { ExtrasSelection, EXTRAS_PRICING, calculateExtrasTotal } from '@/lib/types-v2';

export default function Step3Safety() {
  const { state, dispatch } = useWizardV2();

  const [hasOldFusebox, setHasOldFusebox] = useState<boolean | null>(state.hasOldFusebox);
  const [extras, setExtras] = useState<ExtrasSelection>(state.extras);
  const [showRecommendation, setShowRecommendation] = useState(false);

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleFuseboxAnswer = (answer: boolean) => {
    triggerHaptic();
    setHasOldFusebox(answer);
    setShowRecommendation(true);

    // Auto-recommend based on answer
    if (answer) {
      // Old fusebox - recommend full DB upgrade
      setExtras(prev => ({
        ...prev,
        dbUpgrade: true,
        salvaVita: false, // Included in bundle
        ovr: false,       // Included in bundle
      }));
    } else {
      // Modern fusebox - just recommend Salva Vita
      setExtras(prev => ({
        ...prev,
        dbUpgrade: false,
        salvaVita: true,
        ovr: false,
      }));
    }
  };

  const toggleExtra = (key: keyof ExtrasSelection) => {
    triggerHaptic();
    setExtras(prev => {
      const newExtras = { ...prev };

      if (key === 'dbUpgrade') {
        newExtras.dbUpgrade = !prev.dbUpgrade;
        // DB upgrade includes salva vita and ovr
        if (newExtras.dbUpgrade) {
          newExtras.salvaVita = false;
          newExtras.ovr = false;
        }
      } else if (key === 'salvaVita' || key === 'ovr') {
        // Can't select individual items if bundle is selected
        if (!prev.dbUpgrade) {
          newExtras[key] = !prev[key];
        }
      } else {
        newExtras[key] = !prev[key];
      }

      return newExtras;
    });
  };

  const handleContinue = () => {
    triggerHaptic();
    dispatch({
      type: 'SET_EXTRAS',
      payload: { extras, hasOldFusebox },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    triggerHaptic();
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSkip = () => {
    triggerHaptic();
    dispatch({
      type: 'SET_EXTRAS',
      payload: {
        extras: { salvaVita: false, ovr: false, dbUpgrade: false, emergencyBackup: true },
        hasOldFusebox: null,
      },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const extrasTotal = calculateExtrasTotal(extras);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Your Home&apos;s Safety First
        </h1>
        <p className="text-gray-400">
          We check this before every installation
        </p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Fusebox Question */}
        {hasOldFusebox === null ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Does your home have an older-style fusebox?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Older fuseboxes (10+ years) may need upgrading for solar compatibility and safety.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFuseboxAnswer(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-amber-500/50 transition-all"
              >
                <span className="text-2xl">🔌</span>
                <span className="text-white font-medium">Yes / Not Sure</span>
                <span className="text-gray-500 text-xs">10+ years old</span>
              </button>

              <button
                onClick={() => handleFuseboxAnswer(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-green-500/50 transition-all"
              >
                <span className="text-2xl">✅</span>
                <span className="text-white font-medium">No, It&apos;s Modern</span>
                <span className="text-gray-500 text-xs">Recently upgraded</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Recommendation Banner */}
            <div className={`rounded-xl p-4 mb-6 ${
              hasOldFusebox
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  hasOldFusebox ? 'bg-amber-500/20' : 'bg-green-500/20'
                }`}>
                  {hasOldFusebox ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`font-semibold ${hasOldFusebox ? 'text-amber-400' : 'text-green-400'}`}>
                    {hasOldFusebox ? 'We Recommend a Full DB Upgrade' : 'Great! Just One Safety Add-on'}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {hasOldFusebox
                      ? 'Our bundle includes Salva Vita (RCD), surge protection, and modern DB upgrade - everything for €399.'
                      : 'A Salva Vita (RCD) protects your family from electrical faults.'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setHasOldFusebox(null);
                  setShowRecommendation(false);
                }}
                className="text-sm text-gray-500 hover:text-white mt-2 ml-11"
              >
                Change answer
              </button>
            </div>

            {/* Safety Options */}
            <div className="space-y-3">
              {/* Full DB Upgrade Bundle */}
              <button
                onClick={() => toggleExtra('dbUpgrade')}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  extras.dbUpgrade
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span className="font-semibold text-white">Full DB Upgrade</span>
                      {hasOldFusebox && (
                        <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full">RECOMMENDED</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Complete safety package: Salva Vita + OVR + modern distribution board
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-500 line-through text-sm">€450</span>
                      <span className="text-amber-400 font-bold">€{EXTRAS_PRICING.dbUpgrade}</span>
                      <span className="text-green-400 text-xs">Save €51</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    extras.dbUpgrade ? 'border-amber-500 bg-amber-500' : 'border-gray-500'
                  }`}>
                    {extras.dbUpgrade && (
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>

              {/* Salva Vita (RCD) */}
              <button
                onClick={() => toggleExtra('salvaVita')}
                disabled={extras.dbUpgrade}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  extras.salvaVita
                    ? 'border-amber-500 bg-amber-500/10'
                    : extras.dbUpgrade
                    ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛡️</span>
                      <span className="font-semibold text-white">Salva Vita (RCD)</span>
                      {!hasOldFusebox && !extras.dbUpgrade && (
                        <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">RECOMMENDED</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Residual Current Device - protects against electric shock
                    </p>
                    <div className="text-amber-400 font-bold mt-2">€{EXTRAS_PRICING.salvaVita}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    extras.salvaVita ? 'border-amber-500 bg-amber-500' : 'border-gray-500'
                  } ${extras.dbUpgrade ? 'border-green-500 bg-green-500' : ''}`}>
                    {(extras.salvaVita || extras.dbUpgrade) && (
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                {extras.dbUpgrade && (
                  <div className="text-green-400 text-xs mt-2 ml-7">✓ Included in DB Upgrade</div>
                )}
              </button>

              {/* OVR (Surge Protection) */}
              <button
                onClick={() => toggleExtra('ovr')}
                disabled={extras.dbUpgrade}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  extras.ovr
                    ? 'border-amber-500 bg-amber-500/10'
                    : extras.dbUpgrade
                    ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span className="font-semibold text-white">Surge Protection (OVR)</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Protects your solar system from power surges
                    </p>
                    <div className="text-amber-400 font-bold mt-2">€{EXTRAS_PRICING.ovr}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    extras.ovr ? 'border-amber-500 bg-amber-500' : 'border-gray-500'
                  } ${extras.dbUpgrade ? 'border-green-500 bg-green-500' : ''}`}>
                    {(extras.ovr || extras.dbUpgrade) && (
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                {extras.dbUpgrade && (
                  <div className="text-green-400 text-xs mt-2 ml-7">✓ Included in DB Upgrade</div>
                )}
              </button>

              {/* Emergency Backup */}
              <button
                onClick={() => toggleExtra('emergencyBackup')}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  extras.emergencyBackup
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔋</span>
                      <span className="font-semibold text-white">Emergency Backup Circuit</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">95% choose this</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Keep lights & fridge running during power outages
                    </p>
                    <div className="text-amber-400 font-bold mt-2">€{EXTRAS_PRICING.emergencyBackup}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    extras.emergencyBackup ? 'border-amber-500 bg-amber-500' : 'border-gray-500'
                  }`}>
                    {extras.emergencyBackup && (
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Total */}
            {extrasTotal > 0 && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Safety Add-ons Total</span>
                  <span className="text-xl font-bold text-amber-400">+€{extrasTotal}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
        {hasOldFusebox !== null && (
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-lg py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98]"
          >
            {extrasTotal > 0 ? `Add Safety Package (+€${extrasTotal})` : 'Continue Without Extras'}
          </button>
        )}

        {hasOldFusebox === null && (
          <button
            onClick={handleSkip}
            className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        )}

        <button
          onClick={handleBack}
          className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <p className="text-center text-gray-500 text-sm">
          3 of 6 • We care about your safety
        </p>
      </div>
    </div>
  );
}
