'use client';

import { useWizard } from '../WizardContext';
import { trackWizardComplete, trackQuoteGenerated } from '@/lib/analytics';
import { BATTERY_OPTIONS } from '@/lib/types';
import { formatCurrency, formatNumber, calculateCO2Offset } from '@/lib/calculations';
import { useEffect, useState } from 'react';

export default function Step6Summary() {
  const { state } = useWizard();
  const [showConfetti, setShowConfetti] = useState(true);

  const battery = state.batterySize
    ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize)
    : null;

  const co2Offset = state.selectedSystem
    ? calculateCO2Offset(state.selectedSystem.annualProductionKwh)
    : 0;

  useEffect(() => {
    if (state.totalPrice && state.selectedSystem) {
      trackQuoteGenerated(state.totalPrice, state.selectedSystem.systemSizeKw);
      trackWizardComplete();
    }

    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [state.totalPrice, state.selectedSystem]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I just completed my solar quote on your portal.\n\n` +
      `Name: ${state.fullName}\n` +
      `System: ${state.selectedSystem?.name} (${state.selectedSystem?.systemSizeKw} kWp)\n` +
      `Total: ${formatCurrency(state.totalPrice || 0)}\n\n` +
      `I'd like to proceed with my installation!`
    );
    window.open(`https://wa.me/35679055156?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+35679055156';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8 relative">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899'][i % 4],
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Your Quote is Ready, {state.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-400">
          Here&apos;s your personalized solar system recommendation
        </p>
      </div>

      {/* Quote Card */}
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-amber-400 text-sm font-medium mb-1">Selected System</div>
            <div className="text-white text-2xl font-bold">
              {state.selectedSystem?.name} Package
            </div>
            <div className="text-gray-400">
              {state.selectedSystem?.systemSizeKw} kWp • {state.selectedSystem?.panels} panels
            </div>
          </div>
          <div className="text-right">
            <div className="text-amber-400 text-sm font-medium mb-1">Total Price</div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(state.totalPrice || 0)}
            </div>
            {state.grantPath && state.selectedSystem && (
              <div className="text-green-400 text-sm">
                Includes €{state.selectedSystem.grantAmount} grant
              </div>
            )}
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm">Annual Production</div>
            <div className="text-white font-semibold text-xl">
              {formatNumber(state.selectedSystem?.annualProductionKwh || 0)} kWh
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm">Annual Savings</div>
            <div className="text-green-400 font-semibold text-xl">
              {formatCurrency(state.annualSavings || 0)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm">Payback Period</div>
            <div className="text-white font-semibold text-xl">
              {state.paybackYears} years
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-sm">CO₂ Offset</div>
            <div className="text-white font-semibold text-xl">
              {co2Offset} tonnes/year
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Payment Method</div>
              <div className="text-white font-semibold">
                {state.paymentMethod === 'loan'
                  ? `BOV Financing (${state.loanTerm ? state.loanTerm / 12 : 0} years)`
                  : 'Pay in Full'
                }
              </div>
            </div>
            {state.paymentMethod === 'loan' && state.monthlyPayment && (
              <div className="text-right">
                <div className="text-amber-400 font-bold text-xl">
                  {formatCurrency(state.monthlyPayment)}/mo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Battery if selected */}
        {battery && (
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Battery Storage</div>
                  <div className="text-gray-400 text-sm">{battery.name}</div>
                </div>
              </div>
              <div className="text-white font-semibold">{battery.capacityKwh} kWh</div>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="text-gray-400 text-sm mb-2">Installation Address</div>
        <div className="text-white">{state.address}</div>
      </div>

      {/* What's Next */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold text-lg mb-4">What&apos;s Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">1</span>
            </div>
            <div>
              <div className="text-white font-medium">We&apos;ll Call You</div>
              <div className="text-gray-400 text-sm">Our team will contact you within 24 hours to discuss your quote</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">2</span>
            </div>
            <div>
              <div className="text-white font-medium">Site Visit</div>
              <div className="text-gray-400 text-sm">We&apos;ll schedule a free site visit to finalize the design</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">3</span>
            </div>
            <div>
              <div className="text-white font-medium">Installation in 14 Days</div>
              <div className="text-gray-400 text-sm">Once approved, installation takes just 1-2 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-4 rounded-xl hover:bg-[#20bd5a] transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>Chat on WhatsApp</span>
        </button>
        <button
          onClick={handleCall}
          className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Call Us Now</span>
        </button>
      </div>

      {/* Email Copy */}
      <div className="text-center text-gray-400 text-sm">
        A copy of this quote has been sent to <span className="text-white">{state.email}</span>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
