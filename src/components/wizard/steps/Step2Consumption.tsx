'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep } from '@/lib/analytics';
import { estimateConsumption } from '@/lib/calculations';

const BILL_PRESETS = [
  { label: '€50-80', value: 65, description: 'Small apartment' },
  { label: '€80-120', value: 100, description: 'Medium home' },
  { label: '€120-180', value: 150, description: 'Large home' },
  { label: '€180-250', value: 215, description: 'Villa / AC heavy' },
  { label: '€250+', value: 300, description: 'Large villa / Pool' },
];

const HOUSEHOLD_SIZES = [
  { value: 1, label: '1', icon: '👤' },
  { value: 2, label: '2', icon: '👥' },
  { value: 3, label: '3', icon: '👨‍👩‍👦' },
  { value: 4, label: '4+', icon: '👨‍👩‍👧‍👦' },
];

export default function Step2Consumption() {
  const { state, dispatch } = useWizard();
  const [householdSize, setHouseholdSize] = useState<number | null>(state.householdSize || 2);
  const [isBusiness, setIsBusiness] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState<number | null>(state.monthlyBill);
  const [customBill, setCustomBill] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const selectedBill = useCustom ? (customBill ? parseInt(customBill) : null) : monthlyBill;

  const handlePresetClick = (value: number) => {
    setUseCustom(false);
    setMonthlyBill(value);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseCustom(true);
    setCustomBill(e.target.value);
    setMonthlyBill(null);
  };

  const handleNext = () => {
    if (!selectedBill || (!householdSize && !isBusiness)) return;

    // For business customers, use householdSize=0 to skip eco-reduction
    const effectiveHouseholdSize = isBusiness ? 0 : (householdSize || 2);
    const consumptionKwh = estimateConsumption(selectedBill, effectiveHouseholdSize);

    dispatch({
      type: 'SET_CONSUMPTION',
      payload: {
        householdSize: effectiveHouseholdSize,
        monthlyBill: selectedBill,
        consumptionKwh,
      },
    });

    trackWizardStep(2, 'Consumption');
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const estimatedConsumption = selectedBill && (householdSize || isBusiness)
    ? estimateConsumption(selectedBill, isBusiness ? 0 : (householdSize || 2))
    : null;

  return (
    <div className="max-w-xl mx-auto pb-24">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
          What&apos;s your monthly electricity bill?
        </h1>
        <p className="text-gray-400 text-sm sm:text-base px-2">
          This helps us recommend the right system size for your needs
        </p>
      </div>

      {/* Roof Analysis Results */}
      {state.roofArea && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">Roof Analysis Complete</div>
              <div className="text-green-400 text-sm">
                Your roof can fit up to {state.maxPanels} panels ({state.roofArea}m² usable area)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Household Size / Business */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 sm:mb-4">
          {isBusiness ? 'Business Customer' : 'How many people live in your household?'}
        </label>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {HOUSEHOLD_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => {
                setHouseholdSize(size.value);
                setIsBusiness(false);
              }}
              className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${
                !isBusiness && householdSize === size.value
                  ? 'bg-amber-500/20 border-amber-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
              }`}
            >
              <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">{size.icon}</div>
              <div className="text-[10px] sm:text-xs">{size.label}</div>
            </button>
          ))}
          {/* Business Button - stands out with blue/purple color */}
          <button
            onClick={() => {
              setIsBusiness(true);
              setHouseholdSize(null);
            }}
            className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${
              isBusiness
                ? 'bg-blue-500/30 border-blue-400 text-white ring-2 ring-blue-400/50'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:border-blue-400/50 hover:bg-blue-500/20'
            }`}
          >
            <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">🏢</div>
            <div className="text-[10px] sm:text-xs font-medium">Biz</div>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {isBusiness
            ? 'Commercial rates apply - no eco-reduction rebate'
            : 'This affects your eco-reduction rebate on electricity bills'
          }
        </p>
      </div>

      {/* Bill Presets */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 sm:mb-4">
          Select your typical monthly bill
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
          {BILL_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                !useCustom && monthlyBill === preset.value
                  ? 'bg-amber-500/20 border-amber-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
              }`}
            >
              <div className="font-semibold text-sm sm:text-base">{preset.label}</div>
              <div className="text-[10px] sm:text-xs text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>

        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Or enter exact amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            <input
              type="number"
              value={customBill}
              onChange={handleCustomChange}
              placeholder="Enter amount"
              className={`w-full bg-white/5 border rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                useCustom && customBill
                  ? 'border-amber-500 focus:ring-1 focus:ring-amber-500'
                  : 'border-white/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Consumption Estimate */}
      {estimatedConsumption && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Estimated monthly consumption</span>
            <span className="text-white font-semibold">{estimatedConsumption} kWh</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-400">Annual consumption</span>
            <span className="text-white font-semibold">{estimatedConsumption * 12} kWh</span>
          </div>
        </div>
      )}

      {/* Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8">
        <div className="max-w-xl mx-auto flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span>Back</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedBill || (!householdSize && !isBusiness)}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
