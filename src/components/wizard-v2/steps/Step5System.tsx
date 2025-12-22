'use client';

import { useState, useEffect } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { SYSTEM_PACKAGES, BATTERY_OPTIONS, SystemPackage, BatteryOption, GrantType } from '@/lib/types';
import { calculateTotalPriceWithGrant } from '@/lib/calculations';
import { GRANT_DATA_V2, calculateExtrasTotal } from '@/lib/types-v2';

export default function Step5System() {
  const { state, dispatch } = useWizardV2();

  // Find recommended package from calculator
  const recommendedPackage = SYSTEM_PACKAGES.find(p => p.id === state.recommendedPackage) || SYSTEM_PACKAGES[1];

  const [selectedSystem, setSelectedSystem] = useState<SystemPackage>(state.selectedSystem || recommendedPackage);
  const [withBattery, setWithBattery] = useState(state.isBatteryOnly ? true : state.withBattery);
  const [selectedBattery, setSelectedBattery] = useState<BatteryOption>(
    BATTERY_OPTIONS.find(b => b.capacityKwh === (state.batterySize || 10)) || BATTERY_OPTIONS[1]
  );

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Calculate pricing
  const grantType: GrantType = state.isBatteryOnly
    ? 'battery_only'
    : withBattery
    ? 'pv_battery'
    : 'pv_only';

  const pricing = calculateTotalPriceWithGrant(
    state.isBatteryOnly ? null : selectedSystem,
    withBattery ? selectedBattery : null,
    grantType,
    state.location
  );

  const extrasTotal = calculateExtrasTotal(state.extras);
  const finalPrice = pricing.totalPrice + extrasTotal;
  const grantInfo = GRANT_DATA_V2[state.location];

  const handleContinue = () => {
    triggerHaptic();
    dispatch({
      type: 'SET_SYSTEM',
      payload: {
        system: state.isBatteryOnly ? null : selectedSystem,
        withBattery,
        batterySize: withBattery ? selectedBattery.capacityKwh : null,
        grantType,
      },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    triggerHaptic();
    dispatch({ type: 'PREV_STEP' });
  };

  // Battery-only flow
  if (state.isBatteryOnly) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Choose Your Battery
          </h1>
          <p className="text-gray-400">
            {grantInfo.batteryPercent}% grant for {state.location === 'gozo' ? 'Gozo' : 'Malta'} residents
          </p>
        </div>

        {/* Battery Options */}
        <div className="flex-1 max-w-lg mx-auto w-full">
          <div className="space-y-3">
            {BATTERY_OPTIONS.map((battery) => {
              const batteryPricing = calculateTotalPriceWithGrant(
                null,
                battery,
                'battery_only',
                state.location
              );
              const isSelected = selectedBattery.id === battery.id;
              const isRecommended = battery.capacityKwh === 10;

              return (
                <button
                  key={battery.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedBattery(battery);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{battery.capacityKwh} kWh</span>
                        {isRecommended && (
                          <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">MAX GRANT</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">{battery.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 line-through text-sm">€{battery.price.toLocaleString()}</div>
                      <div className="text-xl font-bold text-amber-400">
                        €{batteryPricing.totalPrice.toLocaleString()}
                      </div>
                      <div className="text-green-400 text-xs">
                        -{grantInfo.batteryPercent}% grant
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Price Summary */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Battery</span>
                <span className="text-white">€{selectedBattery.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Emergency Backup</span>
                <span className="text-white">€350</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{grantInfo.batteryPercent}% Grant</span>
                <span className="text-green-400">-€{pricing.grantAmount.toLocaleString()}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Safety Add-ons</span>
                  <span className="text-white">€{extrasTotal}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-semibold">You Pay</span>
                <span className="text-2xl font-bold text-amber-400">€{finalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-lg py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98]"
          >
            Continue with {selectedBattery.capacityKwh} kWh Battery
          </button>

          <button
            onClick={handleBack}
            className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
          >
            ← Back
          </button>

          <p className="text-center text-gray-500 text-sm">
            5 of 6 • Final system configuration
          </p>
        </div>
      </div>
    );
  }

  // Full PV system flow
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Choose Your System
        </h1>
        <p className="text-gray-400">
          Based on your €{state.monthlyBill}/month bill
        </p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full overflow-y-auto">
        {/* System Packages */}
        <div className="space-y-3 mb-6">
          {SYSTEM_PACKAGES.map((pkg) => {
            const isSelected = selectedSystem.id === pkg.id;
            const isRecommended = pkg.id === recommendedPackage.id;
            const pkgPricing = calculateTotalPriceWithGrant(
              pkg,
              withBattery ? selectedBattery : null,
              withBattery ? 'pv_battery' : 'pv_only',
              state.location
            );

            return (
              <button
                key={pkg.id}
                onClick={() => {
                  triggerHaptic();
                  setSelectedSystem(pkg);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">{pkg.name}</span>
                      {isRecommended && (
                        <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full">FOR YOU</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {pkg.systemSizeKw} kW • {pkg.panels} panels • {(pkg.annualProductionKwh / 1000).toFixed(1)}k kWh/year
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-400">
                      €{pkgPricing.totalPrice.toLocaleString()}
                    </div>
                    <div className="text-green-400 text-xs">
                      After grant
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Battery Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-white font-medium">Add Battery Storage</div>
              <div className="text-gray-400 text-sm">
                {grantInfo.batteryPercent}% grant - up to €{grantInfo.batteryGrant.toLocaleString()} off
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={withBattery}
              onClick={() => {
                triggerHaptic();
                setWithBattery(!withBattery);
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                withBattery ? 'bg-amber-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  withBattery ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Battery Size Selection */}
        {withBattery && (
          <div className="space-y-2 mb-6">
            <div className="text-sm text-gray-400 mb-2">Battery Size</div>
            <div className="flex gap-2">
              {BATTERY_OPTIONS.map((battery) => (
                <button
                  key={battery.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedBattery(battery);
                  }}
                  className={`flex-1 py-3 rounded-xl text-center transition-all ${
                    selectedBattery.id === battery.id
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {battery.capacityKwh} kWh
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{selectedSystem.name} System</span>
              <span className="text-white">
                €{(withBattery ? selectedSystem.priceWithBattery : selectedSystem.priceWithGrant).toLocaleString()}
              </span>
            </div>
            {withBattery && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{selectedBattery.capacityKwh} kWh Battery</span>
                <span className="text-white">€{selectedBattery.price.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Total Grant</span>
              <span className="text-green-400">-€{pricing.grantAmount.toLocaleString()}</span>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Safety Add-ons</span>
                <span className="text-white">€{extrasTotal}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white font-semibold">You Pay</span>
              <span className="text-2xl font-bold text-amber-400">€{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
        <button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-lg py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98]"
        >
          Continue - €{finalPrice.toLocaleString()}
        </button>

        <button
          onClick={handleBack}
          className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <p className="text-center text-gray-500 text-sm">
          5 of 6 • Final system configuration
        </p>
      </div>
    </div>
  );
}
