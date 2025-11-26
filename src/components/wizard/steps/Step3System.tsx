'use client';

import { useState, useEffect } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep, trackSystemSelected } from '@/lib/analytics';
import { SYSTEM_PACKAGES, BATTERY_OPTIONS, SystemPackage, BatteryOption, GrantType, getFitRate } from '@/lib/types';
import { recommendSystem, calculateAnnualSavingsWithGrant, calculateTotalPriceWithGrant, formatCurrency, formatNumber } from '@/lib/calculations';

export default function Step3System() {
  const { state, dispatch } = useWizard();
  const [selectedSystem, setSelectedSystem] = useState<SystemPackage | null>(state.selectedSystem);
  const [withBattery, setWithBattery] = useState(state.withBattery);
  const [selectedBattery, setSelectedBattery] = useState<BatteryOption | null>(
    state.batterySize ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize) || null : null
  );
  const [grantType, setGrantType] = useState<GrantType>(state.grantType || 'pv_only');

  // Get recommended system based on consumption
  useEffect(() => {
    if (!selectedSystem && state.consumptionKwh) {
      const recommended = recommendSystem(state.consumptionKwh, state.maxPanels, SYSTEM_PACKAGES);
      setSelectedSystem(recommended);
    }
  }, [state.consumptionKwh, state.maxPanels, selectedSystem]);

  const handleNext = () => {
    if (!selectedSystem) return;

    dispatch({
      type: 'SET_SYSTEM',
      payload: {
        system: selectedSystem,
        withBattery,
        batterySize: selectedBattery?.capacityKwh || null,
        grantType,
      },
    });

    trackSystemSelected(selectedSystem.systemSizeKw, withBattery, grantType !== 'none');
    trackWizardStep(3, 'System');
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  // Calculate pricing with new grant system
  const priceDetails = selectedSystem
    ? calculateTotalPriceWithGrant(
        selectedSystem,
        withBattery ? selectedBattery : null,
        grantType,
        state.location
      )
    : { totalPrice: 0, grantAmount: 0, grossPrice: 0 };

  const annualSavings = selectedSystem
    ? calculateAnnualSavingsWithGrant(selectedSystem.annualProductionKwh, grantType)
    : 0;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">
          Choose your solar system
        </h1>
        <p className="text-gray-400">
          Based on your consumption of {state.consumptionKwh} kWh/month, we recommend the highlighted option
        </p>
      </div>

      {/* Location & Grant Selection */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-medium">Your Location</div>
            <div className="text-gray-400 text-sm">
              Detected from your property address
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            state.location === 'gozo'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {state.location === 'gozo' ? 'Gozo' : 'Malta'}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="text-white font-medium mb-3">Government Grant Scheme</div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setGrantType('none')}
              className={`p-3 rounded-lg border text-center transition-all ${
                grantType === 'none'
                  ? 'bg-gray-500/20 border-gray-400'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-white font-medium text-sm">No Grant</div>
              <div className="text-gray-400 text-xs mt-1">Higher FIT rate</div>
              <div className="text-amber-400 text-xs mt-1">€0.15/kWh</div>
            </button>

            <button
              onClick={() => setGrantType('pv_only')}
              className={`p-3 rounded-lg border text-center transition-all ${
                grantType === 'pv_only'
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-white font-medium text-sm">Solar Only</div>
              <div className="text-gray-400 text-xs mt-1">Up to €3,000</div>
              <div className="text-green-400 text-xs mt-1">€0.105/kWh FIT</div>
            </button>

            <button
              onClick={() => {
                setGrantType('pv_battery');
                if (!withBattery) {
                  setWithBattery(true);
                  if (!selectedBattery) {
                    setSelectedBattery(BATTERY_OPTIONS[0]);
                  }
                }
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                grantType === 'pv_battery'
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-white font-medium text-sm">Solar + Battery</div>
              <div className="text-gray-400 text-xs mt-1">
                Up to €{state.location === 'gozo' ? '11,550' : '10,200'}
              </div>
              <div className="text-green-400 text-xs mt-1">€0.105/kWh FIT</div>
            </button>
          </div>

        </div>
      </div>

      {/* System Packages */}
      <div className="space-y-4 mb-6">
        {SYSTEM_PACKAGES.map((system) => {
          const isRecommended = state.consumptionKwh &&
            system.id === recommendSystem(state.consumptionKwh, state.maxPanels, SYSTEM_PACKAGES).id;

          const systemPricing = calculateTotalPriceWithGrant(
            system,
            null, // Don't include battery in per-system pricing
            grantType,
            state.location
          );

          // Calculate annual FIT income
          const fitRate = getFitRate(grantType);
          const annualFitIncome = Math.round(system.annualProductionKwh * fitRate);

          return (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(system)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selectedSystem?.id === system.id
                  ? 'bg-amber-500/20 border-amber-500'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              } ${isRecommended ? 'ring-2 ring-amber-500/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-lg">{system.name}</span>
                    <span className="text-amber-400 font-medium">{system.systemSizeKw} kWp</span>
                    {isRecommended && (
                      <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {system.panels} panels • {formatNumber(system.annualProductionKwh)} kWh/year • {system.inverterModel}
                  </div>
                </div>
                <div className="text-center px-4 border-l border-r border-white/10">
                  <div className="text-gray-400 text-xs">Annual Income</div>
                  <div className="text-green-400 font-bold text-lg">{formatCurrency(annualFitIncome)}</div>
                  <div className="text-gray-500 text-xs">@ €{fitRate.toFixed(3)}/kWh</div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="text-white font-bold text-xl">
                    {formatCurrency(systemPricing.totalPrice)}
                  </div>
                  {grantType !== 'none' && systemPricing.grantAmount > 0 && (
                    <div className="text-green-400 text-sm">
                      Grant: {formatCurrency(systemPricing.grantAmount)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Battery Add-on */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-medium">Add Battery Storage</div>
            <div className="text-gray-400 text-sm">Store excess solar energy for nighttime use</div>
          </div>
          <button
            onClick={() => {
              setWithBattery(!withBattery);
              if (!withBattery && !selectedBattery) {
                setSelectedBattery(BATTERY_OPTIONS[0]);
              }
            }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              withBattery ? 'bg-amber-500' : 'bg-white/20'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              withBattery ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>

        {withBattery && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {BATTERY_OPTIONS.map((battery) => (
              <button
                key={battery.id}
                onClick={() => setSelectedBattery(battery)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedBattery?.id === battery.id
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-white font-medium">{battery.capacityKwh} kWh</div>
                <div className="text-gray-400 text-sm">{formatCurrency(battery.price)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estimated Grant */}
      {grantType !== 'none' && priceDetails.grantAmount > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400 font-medium">Estimated Grant</div>
              {state.location === 'gozo' && grantType === 'pv_battery' && (
                <div className="text-purple-400 text-xs mt-1">
                  Gozo bonus: 95% battery subsidy (vs 80% Malta)
                </div>
              )}
            </div>
            <div className="text-green-400 font-bold text-2xl">{formatCurrency(priceDetails.grantAmount)}</div>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedSystem && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Total System Price</div>
              <div className="text-white font-bold text-2xl">{formatCurrency(priceDetails.totalPrice)}</div>
              {priceDetails.grantAmount > 0 && (
                <div className="text-green-400 text-xs">
                  After {formatCurrency(priceDetails.grantAmount)} grant
                </div>
              )}
            </div>
            <div>
              <div className="text-gray-400 text-sm">Est. Annual Savings</div>
              <div className="text-green-400 font-bold text-2xl">{formatCurrency(annualSavings)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8">
        <div className="max-w-3xl mx-auto flex gap-4">
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
            disabled={!selectedSystem}
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
