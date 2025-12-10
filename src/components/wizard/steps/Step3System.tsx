'use client';

import { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { trackWizardStep, trackSystemSelected } from '@/lib/analytics';
import { trackTelegramWizardStep } from '@/lib/telegram-events';
import { SYSTEM_PACKAGES, BATTERY_OPTIONS, EMERGENCY_BACKUP_COST, SystemPackage, BatteryOption, GrantType, getFitRate, GRANT_SCHEME_2025 } from '@/lib/types';
import { recommendSystem, calculateTotalPriceWithGrant, calculateDeposit, formatCurrency, formatNumber } from '@/lib/calculations';

export default function Step3System() {
  const { state, dispatch } = useWizard();
  const [batteryOnlyMode, setBatteryOnlyMode] = useState(state.grantType === 'battery_only' || state.grantType === 'battery_retrofit');
  // Initialize with existing selection or hardcoded default (5 kWp)
  const [selectedSystem, setSelectedSystem] = useState<SystemPackage | null>(() => {
    if (state.selectedSystem) return state.selectedSystem;
    // Hardcoded default to 5 kWp Essential system
    return SYSTEM_PACKAGES.find(s => s.id === 'essential-5kw') || SYSTEM_PACKAGES[1];
  });
  // Default to battery enabled with 10 kWh
  const [withBattery, setWithBattery] = useState(state.withBattery !== undefined ? state.withBattery : true);
  const [selectedBattery, setSelectedBattery] = useState<BatteryOption | null>(
    state.batterySize ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize) || null : BATTERY_OPTIONS[1] // Default to 10kWh
  );
  // Default to pv_battery grant since battery is enabled by default
  const [grantType, setGrantType] = useState<GrantType>(state.grantType || 'pv_battery');

  const handleNext = () => {
    // For battery-only mode, don't require a solar system
    if (!batteryOnlyMode && !selectedSystem) return;
    // For battery-only mode, require a battery
    if (batteryOnlyMode && !selectedBattery) return;

    // Determine battery size to save:
    // - Battery-only mode: always save battery size
    // - Solar mode with battery: save battery size
    // - Solar mode without battery: save null (clear any previous battery selection)
    const batteryToSave = batteryOnlyMode
      ? selectedBattery?.capacityKwh || null
      : withBattery
        ? selectedBattery?.capacityKwh || null
        : null;

    dispatch({
      type: 'SET_SYSTEM',
      payload: {
        system: batteryOnlyMode ? null : selectedSystem,
        withBattery: batteryOnlyMode ? true : withBattery,
        batterySize: batteryToSave,
        grantType: batteryOnlyMode ? 'battery_retrofit' : grantType,
      },
    });

    trackSystemSelected(batteryOnlyMode ? 0 : (selectedSystem?.systemSizeKw || 0), batteryOnlyMode || withBattery, grantType !== 'none');
    trackWizardStep(3, 'System');

    // Send rich data to Telegram
    trackTelegramWizardStep(3, 'System', {
      systemName: batteryOnlyMode ? 'Battery Only' : selectedSystem?.name,
      systemSizeKw: batteryOnlyMode ? 0 : selectedSystem?.systemSizeKw,
      withBattery: batteryOnlyMode || withBattery,
      batterySize: batteryToSave || undefined,
      grantType: batteryOnlyMode ? 'battery_retrofit' : grantType,
      estimatedPrice: priceDetails.totalPrice,
    });

    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  // Toggle battery-only mode
  const handleBatteryOnlyToggle = () => {
    const newMode = !batteryOnlyMode;
    setBatteryOnlyMode(newMode);
    if (newMode) {
      // Entering battery-only mode (uses battery_retrofit grant for maximum benefit)
      setGrantType('battery_retrofit');
      setWithBattery(true);
      if (!selectedBattery) {
        setSelectedBattery(BATTERY_OPTIONS[1]); // Default to 10kWh
      }
    } else {
      // Exiting battery-only mode - keep battery on by default
      setGrantType('pv_battery');
      setWithBattery(true); // Keep battery enabled by default
      // Re-recommend a system if we have consumption data
      if (state.consumptionKwh) {
        const recommended = recommendSystem(state.consumptionKwh, SYSTEM_PACKAGES);
        setSelectedSystem(recommended);
      }
    }
  };

  // Calculate pricing with new grant system
  const priceDetails = batteryOnlyMode
    ? calculateTotalPriceWithGrant(
        null,
        selectedBattery,
        'battery_retrofit',
        state.location
      )
    : selectedSystem
    ? calculateTotalPriceWithGrant(
        selectedSystem,
        withBattery ? selectedBattery : null,
        grantType,
        state.location
      )
    : { totalPrice: 0, grantAmount: 0, grossPrice: 0 };

  // Calculate annual income from FIT (all production × feed-in tariff rate) - not applicable for battery-only
  const fitRate = getFitRate(grantType);
  const annualIncome = batteryOnlyMode ? 0 : (selectedSystem
    ? Math.round(selectedSystem.annualProductionKwh * fitRate)
    : 0);

  return (
    <div className="max-w-3xl mx-auto pb-52">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
          {batteryOnlyMode ? 'Choose your battery storage' : 'Choose your solar system'}
        </h1>
        <p className="text-gray-400 text-sm sm:text-base px-2">
          {batteryOnlyMode
            ? 'Add battery storage to your existing solar system or for energy independence'
            : `Based on your consumption of ${state.consumptionKwh} kWh/month, we recommend the highlighted option`
          }
        </p>
      </div>

      {/* Battery Only Mode Toggle */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Battery Only (No Solar)
            </div>
            <div className="text-gray-400 text-sm">
              Already have solar? Add battery storage with up to {state.location === 'gozo' ? '95%' : '80%'} grant
            </div>
          </div>
          <button
            onClick={handleBatteryOnlyToggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              batteryOnlyMode ? 'bg-purple-500' : 'bg-white/20'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              batteryOnlyMode ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Location Override - Manual Gozo/Malta Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="text-white font-medium">Location</div>
              <div className="text-gray-400 text-xs">
                {state.locationSource === 'auto' ? (
                  <>Auto-detected: {state.locationAutoDetected === 'gozo' ? 'Gozo' : 'Malta'}</>
                ) : (
                  <span className="text-purple-400">Manual override active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-lg">
          <button
            onClick={() => dispatch({ type: 'OVERRIDE_LOCATION', payload: { location: 'malta' } })}
            className={`py-3 px-4 rounded-md font-medium transition-all ${
              state.location === 'malta'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold">Malta</div>
              <div className="text-xs opacity-80">80% battery grant</div>
            </div>
          </button>
          <button
            onClick={() => dispatch({ type: 'OVERRIDE_LOCATION', payload: { location: 'gozo' } })}
            className={`py-3 px-4 rounded-md font-medium transition-all ${
              state.location === 'gozo'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold">Gozo</div>
              <div className="text-xs opacity-80">95% battery grant</div>
            </div>
          </button>
        </div>

        {/* Grant Difference Info */}
        {state.location === 'gozo' && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Gozo bonus: +15% battery subsidy vs Malta</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Max grant: €{GRANT_SCHEME_2025.BATTERY.gozo.maxTotal.toLocaleString()} (vs €{GRANT_SCHEME_2025.BATTERY.malta.maxTotal.toLocaleString()} Malta)
            </div>
          </div>
        )}
      </div>

      {/* Battery-Only Premium Selection (CONVERSION OPTIMIZED) */}
      {batteryOnlyMode && (
        <div className="space-y-4 mb-6">
          {/* Premium Package Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              ⚡ COMPLETE PROTECTION PACKAGE
            </span>
            <span className="text-gray-400 text-xs">Includes Whole House Backup</span>
          </div>

          {/* Battery Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {BATTERY_OPTIONS.map((battery) => {
              // Calculate accurate pricing using the same logic as summary
              const cardPricing = calculateTotalPriceWithGrant(
                null,                    // No PV system (battery-only)
                battery,                 // Current battery option
                'battery_retrofit',      // Grant type for battery-only mode
                state.location           // Malta or Gozo
              );

              const finalPrice = cardPricing.totalPrice;
              const deposit = calculateDeposit(finalPrice);
              const remaining = finalPrice - deposit;
              const totalSystemValue = cardPricing.grossPrice;  // Includes battery + inverter + backup
              const grantSavings = cardPricing.grantAmount;     // Includes battery grant + inverter grant

              const isSelected = selectedBattery?.id === battery.id;

              return (
                <button
                  key={battery.id}
                  onClick={() => setSelectedBattery(battery)}
                  className={`relative p-4 sm:p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-green-500/50 hover:bg-white/10'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {/* Battery Size */}
                  <div className="text-center mb-3">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{battery.capacityKwh} kWh</div>
                    <div className="text-xs text-gray-400">Huawei LUNA</div>
                  </div>

                  {/* Value Display */}
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex justify-between text-gray-400">
                      <span>System Value:</span>
                      <span>{formatCurrency(totalSystemValue)}</span>
                    </div>
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Grant Savings:</span>
                      <span>-{formatCurrency(grantSavings)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1">
                      <span>You Pay:</span>
                      <span>{formatCurrency(finalPrice)}</span>
                    </div>
                  </div>

                  {/* Deposit CTA */}
                  <div className={`text-center p-2 rounded-lg ${isSelected ? 'bg-green-500/20' : 'bg-white/5'}`}>
                    <div className="text-green-400 font-bold">{formatCurrency(deposit)} deposit</div>
                    <div className="text-[10px] text-gray-400">+{formatCurrency(remaining)} on grant</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Battery - Premium Features Display */}
          {selectedBattery && (
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30 rounded-xl p-5 sm:p-6">
              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Left: Battery Features */}
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Battery Storage
                  </h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>✓ {state.location === 'gozo' ? '95%' : '80%'} Government Grant</p>
                    <p>✓ Store solar for night use</p>
                    <p>✓ Reduce grid dependence</p>
                    <p>✓ 10-year warranty</p>
                  </div>
                </div>

                {/* Right: Backup Protection (HERO FEATURE) */}
                <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Whole House Backup
                  </h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>✓ Never lose power during outages</p>
                    <p>✓ Switchover in 0.3 seconds</p>
                    <p>✓ Powers home for {Math.round(selectedBattery.capacityKwh / 1.5)}+ hours</p>
                    <p className="text-xs text-blue-400 font-medium">Included: €350 value</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white/5 rounded-lg p-3 border-l-2 border-blue-400">
                <p className="text-xs text-gray-300 italic">
                  "The backup saved us during last week's outage. Totally worth it!" - Maria, Sliema
                </p>
              </div>

              {/* Payment Breakdown (Value-First) */}
              <div className="mt-4 bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Your Investment:</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Total System Value:</span>
                    <span className="text-white font-semibold">{formatCurrency(selectedBattery.price + EMERGENCY_BACKUP_COST)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Government Grant ({state.location === 'gozo' ? '95%' : '80%'}):</span>
                    <span className="font-semibold">-{formatCurrency(priceDetails.grantAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-white/10 pt-2">
                    <span className="text-white font-bold">You Pay:</span>
                    <span className="text-white font-bold text-xl">{formatCurrency(priceDetails.totalPrice)}</span>
                  </div>

                  {/* 2-Part Payment Structure */}
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Part 1 - Sign Today:</span>
                      <span className="text-green-400 font-bold text-lg">{formatCurrency(calculateDeposit(priceDetails.totalPrice))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Part 2 - When Grant Assigned:</span>
                      <span className="text-gray-300 font-medium">{formatCurrency(priceDetails.totalPrice - calculateDeposit(priceDetails.totalPrice))}</span>
                    </div>
                  </div>

                  {/* Value Callout */}
                  <div className="text-xs text-gray-400 mt-2">
                    ✓ Includes hybrid inverter, backup protection, installation & 10-year warranty
                  </div>
                </div>
              </div>

              {/* Gozo Bonus */}
              {state.location === 'gozo' && (
                <div className="mt-3 text-center p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-400 text-xs font-medium">
                    🎁 Gozo Bonus: Extra 15% grant savings!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* System Packages (hidden in battery-only mode) */}
      {!batteryOnlyMode && (
      <div className="space-y-4 mb-6">
        {SYSTEM_PACKAGES.map((system) => {
          const isRecommended = state.consumptionKwh &&
            system.id === recommendSystem(state.consumptionKwh, SYSTEM_PACKAGES).id;

          // Calculate system-only pricing (use bundle price when battery selected)
          // Pass a minimal battery indicator to trigger bundle pricing, but don't add battery cost
          const systemBasePrice = withBattery ? system.priceWithBattery : system.priceWithoutGrant;
          const systemPricing = calculateTotalPriceWithGrant(
            system,
            withBattery ? selectedBattery : null, // Use battery to trigger bundle pricing
            grantType,
            state.location
          );
          // For card display: show system price only (subtract battery from total)
          const batteryPriceForCard = withBattery && selectedBattery ? selectedBattery.price : 0;
          const systemOnlyPrice = systemPricing.totalPrice - batteryPriceForCard + (withBattery ? systemPricing.grantAmount : 0);
          // Simpler: just show the base system price with PV grant applied
          const pvOnlyGrant = grantType !== 'none' ? Math.min(system.systemSizeKw * 750, 3000, systemBasePrice * 0.5) : 0;
          const displayPrice = systemBasePrice - pvOnlyGrant;

          // Calculate annual FIT income for both grant variants
          const annualIncomeWithGrant = Math.round(system.annualProductionKwh * 0.105);
          const annualIncomeNoGrant = Math.round(system.annualProductionKwh * 0.15);
          const fitRate = getFitRate(grantType);
          const annualFitIncome = grantType === 'none' ? annualIncomeNoGrant : annualIncomeWithGrant;

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
              {/* Mobile layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{system.name}</span>
                    <span className="text-amber-400 font-medium text-sm">{system.systemSizeKw} kWp</span>
                  </div>
                  {isRecommended && (
                    <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-xs mb-3">
                  {system.panels} panels • {formatNumber(system.annualProductionKwh)} kWh/year
                  {system.id === 'essential-5kw' && (
                    <span className="text-blue-400 ml-2">• Max for single phase</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div>
                    <div className="text-gray-400 text-xs">Price</div>
                    <div className="text-white font-bold">{formatCurrency(displayPrice)}</div>
                    {grantType !== 'none' && pvOnlyGrant > 0 && (
                      <div className="text-green-400 text-xs">Grant: {formatCurrency(pvOnlyGrant)}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">Annual Income</div>
                    <div className="text-green-400 font-bold">{formatCurrency(annualFitIncome)}</div>
                    <div className="text-amber-400/70 text-[10px]">
                      {grantType === 'none'
                        ? `${formatCurrency(annualIncomeWithGrant)} with grant`
                        : `${formatCurrency(annualIncomeNoGrant)} without grant`
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:flex items-start justify-between gap-4">
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
                    {system.panels} panels • {formatNumber(system.annualProductionKwh)} kWh/year
                    {system.id === 'essential-5kw' && (
                      <span className="text-blue-400 ml-2">• Max for single phase</span>
                    )}
                  </div>
                </div>
                <div className="text-center px-4 border-l border-r border-white/10">
                  <div className="text-gray-400 text-xs">Annual Income</div>
                  <div className="text-green-400 font-bold text-lg">{formatCurrency(annualFitIncome)}</div>
                  <div className="text-gray-500 text-xs">@ €{fitRate.toFixed(3)}/kWh</div>
                  <div className="text-amber-400/70 text-xs mt-0.5">
                    {grantType === 'none'
                      ? `${formatCurrency(annualIncomeWithGrant)} with grant`
                      : `${formatCurrency(annualIncomeNoGrant)} without grant`
                    }
                  </div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="text-white font-bold text-xl">
                    {formatCurrency(displayPrice)}
                  </div>
                  {grantType !== 'none' && pvOnlyGrant > 0 && (
                    <div className="text-green-400 text-sm">
                      Grant: {formatCurrency(pvOnlyGrant)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      )}

      {/* Battery Add-on (only shown when NOT in battery-only mode) */}
      {!batteryOnlyMode && (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-medium">Add Battery Storage</div>
            <div className="text-gray-400 text-sm">Store excess solar energy for nighttime use</div>
          </div>
          <button
            onClick={() => {
              const newWithBattery = !withBattery;
              setWithBattery(newWithBattery);
              if (newWithBattery) {
                // Turning battery ON - switch to pv_battery grant
                if (!selectedBattery) {
                  setSelectedBattery(BATTERY_OPTIONS[0]);
                }
                if (grantType !== 'none') {
                  setGrantType('pv_battery');
                }
              } else {
                // Turning battery OFF - switch back to pv_only grant
                if (grantType === 'pv_battery') {
                  setGrantType('pv_only');
                }
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-white/10">
            {BATTERY_OPTIONS.map((battery) => (
              <button
                key={battery.id}
                onClick={() => setSelectedBattery(battery)}
                className={`p-2 sm:p-3 rounded-lg border text-center transition-all ${
                  selectedBattery?.id === battery.id
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-white font-medium text-sm sm:text-base">{battery.capacityKwh} kWh</div>
                <div className="text-gray-400 text-xs sm:text-sm">{formatCurrency(battery.price)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Estimated Grant (shown for all modes with grants) */}
      {(grantType !== 'none' || batteryOnlyMode) && priceDetails.grantAmount > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400 font-medium">Estimated Grant</div>
              {state.location === 'gozo' && (grantType === 'pv_battery' || batteryOnlyMode) && (
                <div className="text-purple-400 text-xs mt-1">
                  Gozo bonus: 95% battery subsidy (vs 80% Malta)
                </div>
              )}
              {batteryOnlyMode && (
                <div className="text-gray-400 text-xs mt-1">
                  Includes battery + hybrid inverter grants
                </div>
              )}
            </div>
            <div className="text-green-400 font-bold text-2xl">{formatCurrency(priceDetails.grantAmount)}</div>
          </div>
        </div>
      )}

      {/* Fixed bottom section with Summary + Grant Selector + Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)]">
        {/* Amber/Purple glow divider based on mode */}
        <div className={`h-[2px] bg-gradient-to-r from-transparent ${batteryOnlyMode ? 'via-purple-500' : 'via-amber-500'} to-transparent shadow-[0_0_15px_${batteryOnlyMode ? 'rgba(168,85,247,0.6)' : 'rgba(245,158,11,0.6)'}]`} />
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          {/* Price Summary - show for both solar and battery-only modes */}
          {(selectedSystem || batteryOnlyMode) && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              {/* YOUR PRICE - Hero display */}
              <div className={`flex-1 bg-gradient-to-r ${batteryOnlyMode ? 'from-purple-500/30 to-blue-500/30' : 'from-amber-500/30 to-orange-500/30'} rounded-xl px-4 py-3 mr-3 border-2 ${batteryOnlyMode ? 'border-purple-400 shadow-lg shadow-purple-500/20' : 'border-amber-400 shadow-lg shadow-amber-500/20'}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${batteryOnlyMode ? 'text-purple-300' : 'text-amber-300'}`}>Your Price</div>
                <div className={`font-bold text-2xl sm:text-3xl tracking-tight ${batteryOnlyMode ? 'text-purple-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400'}`}>{formatCurrency(priceDetails.totalPrice)}</div>
                {priceDetails.grantAmount > 0 && (
                  <div className="text-green-400 text-xs font-medium">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {formatCurrency(priceDetails.grantAmount)} grant applied
                    </span>
                  </div>
                )}
              </div>
              {/* Secondary info */}
              {batteryOnlyMode ? (
                <div className="text-right">
                  <div className="text-gray-400 text-xs">Battery Storage</div>
                  <div className="text-purple-400 font-bold text-lg">{selectedBattery?.capacityKwh || 0} kWh</div>
                  <div className="text-gray-500 text-[10px]">
                    Store energy for nighttime use
                  </div>
                </div>
              ) : (
              <div className="text-right">
                <div className="text-gray-400 text-xs">Annual Income</div>
                <div className="text-green-400 font-bold text-lg">{formatCurrency(annualIncome)}/yr</div>
                <div className="text-gray-500 text-[10px]">
                  @ €{fitRate.toFixed(3)}/kWh
                </div>
              </div>
              )}
            </div>
          )}

          {/* Compact Grant Selector (hidden in battery-only mode) */}
          {!batteryOnlyMode && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400 text-xs whitespace-nowrap">Grant:</span>
            <div className="flex gap-1.5 flex-1">
              <button
                onClick={() => setGrantType('none')}
                className={`flex-1 px-2 py-1.5 rounded-lg border text-center transition-all ${
                  grantType === 'none'
                    ? 'bg-gray-500/30 border-gray-400 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-medium">No Grant</div>
                <div className="text-[10px] text-amber-400">€0.15/kWh</div>
              </button>

              <button
                onClick={() => setGrantType('pv_only')}
                className={`flex-1 px-2 py-1.5 rounded-lg border text-center transition-all ${
                  grantType === 'pv_only'
                    ? 'bg-green-500/30 border-green-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-medium">PV Grant</div>
                <div className="text-[10px] text-green-400">€0.105/kWh</div>
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
                className={`flex-1 px-2 py-1.5 rounded-lg border text-center transition-all ${
                  grantType === 'pv_battery'
                    ? 'bg-green-500/30 border-green-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-medium">PV+Battery</div>
                <div className="text-[10px] text-green-400">€0.105/kWh</div>
              </button>
            </div>
          </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              disabled={batteryOnlyMode ? !selectedBattery : !selectedSystem}
              className={`flex-[2] bg-gradient-to-r ${batteryOnlyMode ? 'from-purple-500 to-blue-500' : 'from-amber-500 to-orange-500'} text-black font-semibold py-3 rounded-xl hover:shadow-lg ${batteryOnlyMode ? 'hover:shadow-purple-500/25' : 'hover:shadow-amber-500/25'} transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              <span>Continue</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
