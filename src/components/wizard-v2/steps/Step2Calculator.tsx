'use client';

import { useState, useEffect, useRef } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { calculateInstant, calculateBatteryOnly, InstantCalculation } from '@/lib/instant-calculator';

// Animated counter component
function AnimatedNumber({ value, duration = 1000, prefix = '€' }: { value: number; duration?: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Easing function for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return <span>{prefix}{displayValue.toLocaleString('en-MT')}</span>;
}

export default function Step2Calculator() {
  const { state, dispatch } = useWizardV2();
  const [monthlyBill, setMonthlyBill] = useState<string>(state.monthlyBill?.toString() || '');
  const [calculation, setCalculation] = useState<InstantCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Preset bill amounts for quick selection
  const presets = [50, 100, 150, 200, 300];

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Calculate on bill change (debounced)
  useEffect(() => {
    const bill = parseFloat(monthlyBill);
    if (bill >= 30) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        if (state.isBatteryOnly) {
          // Battery-only calculation
          const batteryCalc = calculateBatteryOnly(state.location, 10);
          setCalculation({
            monthlyBill: bill,
            annualBill: bill * 12,
            estimatedConsumptionKwh: 0,
            recommendedSystemKw: 0,
            recommendedPackageId: 'battery-only',
            recommendedPackageName: 'Battery Only',
            annualProduction: 0,
            annualSavings: batteryCalc.annualSavings,
            monthlySavings: Math.round(batteryCalc.annualSavings / 12),
            percentageSaved: Math.min(40, Math.round((batteryCalc.annualSavings / (bill * 12)) * 100)),
            paybackYears: batteryCalc.netPrice / batteryCalc.annualSavings,
            grossPrice: batteryCalc.grossPrice,
            grantAmount: batteryCalc.grantAmount,
            netPrice: batteryCalc.netPrice,
            location: state.location,
            batteryGrant: batteryCalc.grantAmount,
            batteryPercent: batteryCalc.grantPercent,
          });
        } else {
          // Full system calculation
          const calc = calculateInstant(bill, state.location, true);
          setCalculation(calc);
        }
        setIsCalculating(false);
        setShowResults(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
      setCalculation(null);
    }
  }, [monthlyBill, state.location, state.isBatteryOnly]);

  const handlePresetClick = (amount: number) => {
    triggerHaptic();
    setMonthlyBill(amount.toString());
  };

  const handleContinue = () => {
    if (!calculation) return;
    triggerHaptic();

    dispatch({
      type: 'SET_CALCULATOR',
      payload: {
        monthlyBill: calculation.monthlyBill,
        estimatedSavings: calculation.annualSavings,
        estimatedSystemSize: calculation.recommendedSystemKw,
        recommendedPackage: calculation.recommendedPackageId,
      },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    triggerHaptic();
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {state.isBatteryOnly ? 'Your Current Bill' : 'Calculate Your Savings'}
        </h1>
        <p className="text-gray-400">
          {state.isBatteryOnly
            ? 'See how much battery storage can save you'
            : 'Enter your monthly electricity bill'
          }
        </p>
      </div>

      {/* Bill Input */}
      <div className="max-w-lg mx-auto w-full">
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">€</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(e.target.value)}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-20 py-5 text-3xl font-bold text-white text-center focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">/month</span>
        </div>

        {/* Preset Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4">
          {presets.map((amount) => (
            <button
              key={amount}
              onClick={() => handlePresetClick(amount)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                monthlyBill === amount.toString()
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              €{amount}
            </button>
          ))}
        </div>

        {/* Results Card */}
        {showResults && calculation && (
          <div className={`transform transition-all duration-500 ${showResults ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Main Savings Display */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-4">
              <div className="text-center mb-4">
                <div className="text-gray-400 text-sm mb-1">You could save</div>
                <div className="text-4xl sm:text-5xl font-bold text-amber-400">
                  <AnimatedNumber value={calculation.annualSavings} duration={1200} />
                  <span className="text-2xl text-amber-400/70">/year</span>
                </div>
                <div className="text-green-400 text-lg mt-2">
                  €{calculation.monthlySavings}/month on your bill
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {!state.isBatteryOnly && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {calculation.recommendedSystemKw} kW
                    </div>
                    <div className="text-gray-400 text-sm">Recommended System</div>
                  </div>
                )}
                <div className={`text-center ${state.isBatteryOnly ? 'col-span-2' : ''}`}>
                  <div className="text-2xl font-bold text-white">
                    {calculation.paybackYears.toFixed(1)} years
                  </div>
                  <div className="text-gray-400 text-sm">Payback Period</div>
                </div>
              </div>
            </div>

            {/* Price Preview */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">System Value</span>
                <span className="text-white">€{calculation.grossPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">
                  Grant ({state.location === 'gozo' ? 'Gozo' : 'Malta'})
                </span>
                <span className="text-green-400">-€{calculation.grantAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white font-semibold">You Pay</span>
                <span className="text-xl font-bold text-amber-400">
                  €{calculation.netPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-2 justify-center mt-4 text-sm text-gray-400">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>2,000+ homeowners already saving</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isCalculating && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!showResults && !isCalculating && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💡</div>
            <p>Enter your monthly bill to see instant savings</p>
            <p className="text-sm mt-1">Minimum €30/month</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
        <button
          onClick={handleContinue}
          disabled={!calculation}
          className={`w-full font-semibold text-lg py-4 rounded-full transition-all active:scale-[0.98] ${
            calculation
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25'
              : 'bg-white/10 text-gray-500 cursor-not-allowed'
          }`}
        >
          {calculation ? `Save €${calculation.annualSavings}/year - Continue` : 'Enter Bill Amount'}
        </button>

        <button
          onClick={handleBack}
          className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <p className="text-center text-gray-500 text-sm">
          2 of 6 • Your info is secure
        </p>
      </div>
    </div>
  );
}
