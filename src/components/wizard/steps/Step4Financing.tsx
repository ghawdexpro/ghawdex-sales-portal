'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep } from '@/lib/analytics';
import { trackTelegramWizardStep } from '@/lib/telegram-events';
import { BATTERY_OPTIONS } from '@/lib/types';
import {
  getFinancingOptions,
  calculateTotalPriceWithGrant,
  calculateAnnualSavingsWithGrant,
  calculatePaybackYears,
  calculate25YearSavings,
  calculateBatterySavings,
  formatCurrency,
} from '@/lib/calculations';

export default function Step4Financing() {
  const { state, dispatch } = useWizard();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'loan'>(state.paymentMethod || 'cash');
  const [selectedTerm, setSelectedTerm] = useState<number>(state.loanTerm || 60);

  const isBatteryOnly = state.grantType === 'battery_only';

  const battery = state.batterySize
    ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize) || null
    : null;

  // Calculate price for both solar+battery and battery-only modes
  const priceDetails = calculateTotalPriceWithGrant(
    state.selectedSystem,
    battery,
    state.grantType,
    state.location
  );

  const totalPrice = priceDetails.totalPrice;

  const financingOptions = getFinancingOptions(totalPrice);
  const selectedOption = financingOptions.find(f => f.term === selectedTerm);

  // For battery-only, calculate savings based on Malta's tiered electricity rates
  // Battery reduces grid consumption, avoiding higher tariff tiers
  const batterySavingsData = isBatteryOnly
    ? calculateBatterySavings(state.batterySize || 10, state.consumptionKwh, state.householdSize)
    : null;

  const annualSavings = isBatteryOnly
    ? batterySavingsData?.annualSavings || 0
    : state.selectedSystem
    ? calculateAnnualSavingsWithGrant(state.selectedSystem.annualProductionKwh, state.grantType)
    : 0;

  const paybackYears = calculatePaybackYears(totalPrice, annualSavings);
  const lifetimeSavings = calculate25YearSavings(annualSavings);

  const handleNext = () => {
    const monthlyPayment = paymentMethod === 'loan' && selectedOption
      ? selectedOption.monthlyPayment
      : null;

    dispatch({
      type: 'SET_FINANCING',
      payload: {
        paymentMethod,
        loanTerm: paymentMethod === 'loan' ? selectedTerm : null,
      },
    });

    dispatch({
      type: 'SET_CALCULATIONS',
      payload: {
        totalPrice,
        monthlyPayment,
        annualSavings,
        paybackYears,
      },
    });

    trackWizardStep(4, 'Financing');

    // Send rich data to Telegram
    trackTelegramWizardStep(4, 'Financing', {
      paymentMethod,
      loanTerm: paymentMethod === 'loan' ? selectedTerm : undefined,
      totalPrice,
      monthlyPayment: monthlyPayment || undefined,
    });

    // Skip Bill Upload (Step 5) and Contact (Step 6) if user came from Zoho CRM link
    if (state.isPrefilledLead) {
      dispatch({ type: 'SET_STEP', payload: 7 }); // Skip to Summary
    } else {
      dispatch({ type: 'NEXT_STEP' }); // Go to Bill Upload (Step 5)
    }
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">
          Choose your financing
        </h1>
        <p className="text-gray-400">
          {isBatteryOnly
            ? 'Choose how to pay for your battery storage system'
            : 'Choose between paying upfront or spreading the cost with BOV financing'
          }
        </p>
      </div>

      {/* YOUR PRICE - Hero display */}
      <div className={`bg-gradient-to-r ${isBatteryOnly ? 'from-purple-500/30 via-purple-500/20 to-blue-500/30' : 'from-amber-500/30 via-amber-500/20 to-orange-500/30'} rounded-2xl p-5 mb-6 border-2 ${isBatteryOnly ? 'border-purple-400 shadow-xl shadow-purple-500/20' : 'border-amber-400 shadow-xl shadow-amber-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider ${isBatteryOnly ? 'text-purple-300' : 'text-amber-300'} mb-1`}>Your Price</div>
            <div className={`font-bold text-4xl tracking-tight ${isBatteryOnly ? 'text-purple-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400'}`}>{formatCurrency(totalPrice)}</div>
            {priceDetails.grantAmount > 0 && (
              <div className="text-green-400 text-sm font-medium mt-1">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {formatCurrency(priceDetails.grantAmount)} grant applied
                </span>
              </div>
            )}
          </div>
          <div className={`w-16 h-16 rounded-full ${isBatteryOnly ? 'bg-purple-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
            <svg className={`w-8 h-8 ${isBatteryOnly ? 'text-purple-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setPaymentMethod('cash')}
          className={`p-6 rounded-xl border text-left transition-all ${
            paymentMethod === 'cash'
              ? 'bg-amber-500/20 border-amber-500'
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-white font-semibold text-lg mb-1">Pay in Full</div>
          <div className="text-gray-400 text-sm">One-time payment</div>
          <div className="text-white font-bold text-2xl mt-3">{formatCurrency(totalPrice)}</div>
        </button>

        <button
          onClick={() => setPaymentMethod('loan')}
          className={`p-6 rounded-xl border text-left transition-all ${
            paymentMethod === 'loan'
              ? 'bg-amber-500/20 border-amber-500'
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-white font-semibold text-lg mb-1">BOV Financing</div>
          <div className="text-gray-400 text-sm">Monthly payments</div>
          <div className="text-white font-bold text-2xl mt-3">
            {formatCurrency(selectedOption?.monthlyPayment || 0)}/mo
          </div>
        </button>
      </div>

      {/* Loan Terms */}
      {paymentMethod === 'loan' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-white font-medium mb-4">Select Loan Term</h3>
          <div className="grid grid-cols-4 gap-3">
            {financingOptions.map((option) => (
              <button
                key={option.term}
                onClick={() => setSelectedTerm(option.term)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedTerm === option.term
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-white font-medium">{option.term / 12} years</div>
                <div className="text-amber-400 font-semibold">{formatCurrency(option.monthlyPayment)}/mo</div>
                <div className="text-gray-500 text-xs">Total: {formatCurrency(option.totalCost)}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>BOV Green Loan at 4.75% APR • No deposit required</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Your Financial Benefits</h3>

        {/* Battery-only explanation */}
        {isBatteryOnly && batterySavingsData && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
            <div className="text-purple-400 text-sm font-medium mb-1">How Battery Saves You Money</div>
            <div className="text-gray-300 text-xs">
              Malta uses <strong>progressive electricity rates</strong> - the more you use, the higher the rate per kWh.
              Your battery stores energy and uses it at night, reducing your grid consumption and keeping you in lower tariff bands.
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-gray-400">Your estimated tier:</span>
              <span className="text-purple-300 font-medium">{batterySavingsData.explanation}</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-gray-400">Marginal rate avoided:</span>
              <span className="text-green-400 font-medium">€{batterySavingsData.marginalRate.toFixed(4)}/kWh</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-gray-400 text-sm">Annual Savings</div>
            <div className="text-green-400 font-bold text-2xl">{formatCurrency(annualSavings)}</div>
            {isBatteryOnly && (
              <div className="text-gray-500 text-xs">~{Math.round((state.batterySize || 10) * 0.95 * 0.9 * 300)} kWh/yr offset</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-sm">Payback Period</div>
            <div className="text-white font-bold text-2xl">{paybackYears} years</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">25-Year Savings</div>
            <div className="text-green-400 font-bold text-2xl">{formatCurrency(lifetimeSavings)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Return on Investment</div>
            <div className="text-white font-bold text-2xl">
              {Math.round((lifetimeSavings / totalPrice - 1) * 100)}%
            </div>
          </div>
        </div>

        {paymentMethod === 'loan' && selectedOption && (
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Monthly loan payment</span>
              <span className="text-white font-medium">{formatCurrency(selectedOption.monthlyPayment)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">
                {isBatteryOnly ? 'Monthly savings from battery' : 'Monthly savings from solar'}
              </span>
              <span className="text-green-400 font-medium">~{formatCurrency(Math.round(annualSavings / 12))}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-500/20">
              <span className="text-white font-medium">Net monthly cost</span>
              <span className={`font-bold ${
                selectedOption.monthlyPayment - annualSavings / 12 > 0
                  ? 'text-amber-400'
                  : 'text-green-400'
              }`}>
                {formatCurrency(Math.round(selectedOption.monthlyPayment - annualSavings / 12))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10">
        <div className="max-w-2xl mx-auto flex gap-4 p-4">
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
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 flex items-center justify-center gap-2"
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
