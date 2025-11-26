'use client';

import { useState, useEffect } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep, trackSystemSelected } from '@/lib/analytics';
import { SYSTEM_PACKAGES, BATTERY_OPTIONS, SystemPackage, BatteryOption } from '@/lib/types';
import { recommendSystem, calculateAnnualSavings, formatCurrency, formatNumber } from '@/lib/calculations';

export default function Step3System() {
  const { state, dispatch } = useWizard();
  const [selectedSystem, setSelectedSystem] = useState<SystemPackage | null>(state.selectedSystem);
  const [withBattery, setWithBattery] = useState(state.withBattery);
  const [selectedBattery, setSelectedBattery] = useState<BatteryOption | null>(
    state.batterySize ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize) || null : null
  );
  const [grantPath, setGrantPath] = useState(state.grantPath);

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
        grantPath,
      },
    });

    trackSystemSelected(selectedSystem.systemSizeKw, withBattery, grantPath);
    trackWizardStep(3, 'System');
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const getSystemPrice = (system: SystemPackage) => {
    return grantPath ? system.priceWithGrant : system.priceWithoutGrant;
  };

  const getTotalPrice = () => {
    if (!selectedSystem) return 0;
    const systemPrice = getSystemPrice(selectedSystem);
    const batteryPrice = withBattery && selectedBattery ? selectedBattery.price : 0;
    return systemPrice + batteryPrice;
  };

  const annualSavings = selectedSystem
    ? calculateAnnualSavings(selectedSystem.annualProductionKwh, grantPath)
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

      {/* Grant Path Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Government Grant</div>
            <div className="text-gray-400 text-sm">Save up to €2,400 with the solar grant scheme</div>
          </div>
          <button
            onClick={() => setGrantPath(!grantPath)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              grantPath ? 'bg-green-500' : 'bg-white/20'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              grantPath ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* System Packages */}
      <div className="space-y-4 mb-6">
        {SYSTEM_PACKAGES.map((system) => {
          const isRecommended = state.consumptionKwh &&
            system.id === recommendSystem(state.consumptionKwh, state.maxPanels, SYSTEM_PACKAGES).id;

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
              <div className="flex items-start justify-between">
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
                <div className="text-right">
                  <div className="text-white font-bold text-xl">
                    {formatCurrency(getSystemPrice(system))}
                  </div>
                  {grantPath && (
                    <div className="text-green-400 text-sm">
                      Save {formatCurrency(system.grantAmount)}
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

      {/* Summary */}
      {selectedSystem && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Total System Price</div>
              <div className="text-white font-bold text-2xl">{formatCurrency(getTotalPrice())}</div>
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
