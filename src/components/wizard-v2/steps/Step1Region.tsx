'use client';

import { useState, useEffect } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { GRANT_DATA_V2 } from '@/lib/types-v2';
import { Location } from '@/lib/types';

export default function Step1Region() {
  const { state, dispatch } = useWizardV2();
  const [selectedLocation, setSelectedLocation] = useState<Location>(state.location);
  const [isBatteryOnly, setIsBatteryOnly] = useState(state.isBatteryOnly);
  const [isAnimating, setIsAnimating] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleLocationSelect = (location: Location) => {
    triggerHaptic();
    setIsAnimating(true);
    setSelectedLocation(location);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleContinue = () => {
    triggerHaptic();
    dispatch({
      type: 'SET_REGION',
      payload: { location: selectedLocation, isBatteryOnly },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const grantInfo = GRANT_DATA_V2[selectedLocation];

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Where is your property?
        </h1>
        <p className="text-gray-400">
          Gozo residents get bigger battery grants!
        </p>
      </div>

      {/* Island Selector - Big Cards */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Malta Card */}
          <button
            onClick={() => handleLocationSelect('malta')}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedLocation === 'malta'
                ? 'border-amber-500 bg-amber-500/10 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="text-4xl mb-3">🏝️</div>
            <h3 className="text-xl font-bold text-white mb-1">Malta</h3>
            <div className="text-amber-400 font-semibold">
              {grantInfo.name === 'Malta' ? `${grantInfo.batteryPercent}%` : '80%'}
            </div>
            <div className="text-gray-400 text-sm">Battery Grant</div>

            {selectedLocation === 'malta' && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>

          {/* Gozo Card */}
          <button
            onClick={() => handleLocationSelect('gozo')}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedLocation === 'gozo'
                ? 'border-amber-500 bg-amber-500/10 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {/* Gozo Badge */}
            <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              BEST DEAL
            </div>

            <div className="text-4xl mb-3">🌴</div>
            <h3 className="text-xl font-bold text-white mb-1">Gozo</h3>
            <div className="text-green-400 font-semibold">
              {grantInfo.name === 'Gozo' ? `${grantInfo.batteryPercent}%` : '95%'}
            </div>
            <div className="text-gray-400 text-sm">Battery Grant</div>

            {selectedLocation === 'gozo' && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Grant Summary - Updates based on battery-only toggle */}
        <div className={`bg-gradient-to-r ${
          selectedLocation === 'gozo'
            ? 'from-green-500/10 to-emerald-500/10 border-green-500/20'
            : 'from-amber-500/10 to-orange-500/10 border-amber-500/20'
        } border rounded-xl p-4 mb-6 transition-all duration-300 ${isAnimating ? 'scale-[0.98]' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm">
                {isBatteryOnly ? 'Battery Grant' : 'Max Available Grant'}
              </div>
              <div className={`text-2xl font-bold ${
                selectedLocation === 'gozo' ? 'text-green-400' : 'text-amber-400'
              }`}>
                €{isBatteryOnly
                  ? grantInfo.batteryGrant.toLocaleString()
                  : grantInfo.totalGrant.toLocaleString()
                }
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {isBatteryOnly ? 'Coverage' : 'Battery Grant'}
              </div>
              <div className={`text-xl font-semibold ${
                selectedLocation === 'gozo' ? 'text-green-400' : 'text-amber-400'
              }`}>
                {grantInfo.batteryPercent}%
              </div>
            </div>
          </div>
          {selectedLocation === 'gozo' && !isBatteryOnly && (
            <div className="mt-2 text-green-400 text-sm">
              Gozo residents save €1,350 more on battery!
            </div>
          )}
          {isBatteryOnly && (
            <div className={`mt-2 text-sm ${selectedLocation === 'gozo' ? 'text-green-400' : 'text-amber-400'}`}>
              {selectedLocation === 'gozo'
                ? 'Gozo: 95% of battery cost covered!'
                : 'Malta: 80% of battery cost covered!'
              }
            </div>
          )}
        </div>

        {/* Battery-Only Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-white font-medium">Already have solar panels?</div>
              <div className="text-gray-400 text-sm">Get battery-only with {grantInfo.batteryPercent}% grant</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isBatteryOnly}
              onClick={() => {
                triggerHaptic();
                setIsBatteryOnly(!isBatteryOnly);
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isBatteryOnly ? 'bg-amber-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isBatteryOnly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-lg py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98]"
        >
          Continue
        </button>
        <p className="text-center text-gray-500 text-sm mt-3">
          1 of 6 • Takes 2 minutes
        </p>
      </div>
    </div>
  );
}
