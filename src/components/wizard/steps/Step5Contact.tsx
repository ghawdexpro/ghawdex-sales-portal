'use client';

import { useState, useEffect } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep, trackLeadCreated } from '@/lib/analytics';
import { BATTERY_OPTIONS } from '@/lib/types';
import SocialLogin from '../SocialLogin';

export default function Step5Contact() {
  const { state, dispatch } = useWizard();
  const [fullName, setFullName] = useState(state.fullName);
  const [email, setEmail] = useState(state.email);
  const [phone, setPhone] = useState(state.phone);
  const [notes, setNotes] = useState(state.notes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Sync state when social login populates fields
  useEffect(() => {
    if (state.fullName && !fullName) setFullName(state.fullName);
    if (state.email && !email) setEmail(state.email);
  }, [state.fullName, state.email, fullName, email]);

  // Handle social login success
  const handleSocialLogin = async (data: { name: string; email: string; provider: 'google' | 'facebook' }) => {
    // Update local state
    setFullName(data.name);
    setEmail(data.email);
    setErrors({});

    // Update context
    dispatch({
      type: 'SET_SOCIAL_LOGIN',
      payload: {
        fullName: data.name,
        email: data.email,
        socialProvider: data.provider,
      },
    });

    // Show phone prompt since social login doesn't provide phone
    setShowPhonePrompt(true);

    // Create partial lead for recovery (in case they abandon)
    try {
      await fetch('/api/partial-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          social_provider: data.provider,
          last_step: 5,
          wizard_state: {
            address: state.address,
            coordinates: state.coordinates,
            householdSize: state.householdSize,
            monthlyBill: state.monthlyBill,
            selectedSystem: state.selectedSystem?.id,
            withBattery: state.withBattery,
            batterySize: state.batterySize,
            paymentMethod: state.paymentMethod,
          },
        }),
      });
    } catch (error) {
      // Non-blocking - don't interrupt user flow
      console.error('Failed to save partial lead:', error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[+]?[\d\s-]{8,}$/.test(phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Save contact info to state
      dispatch({
        type: 'SET_CONTACT',
        payload: { fullName, email, phone, notes },
      });

      // Create lead via API (writes to Supabase + Zoho CRM + sends Telegram)
      const battery = state.batterySize
        ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize)
        : null;

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          address: state.address,
          coordinates: state.coordinates,
          household_size: state.householdSize,
          monthly_bill: state.monthlyBill,
          consumption_kwh: state.consumptionKwh,
          roof_area: state.roofArea,
          selected_system: state.selectedSystem?.id || null,
          system_size_kw: state.selectedSystem?.systemSizeKw || null,
          with_battery: state.withBattery,
          battery_size_kwh: battery?.capacityKwh || null,
          grant_path: state.grantPath,
          payment_method: state.paymentMethod,
          loan_term: state.loanTerm,
          total_price: state.totalPrice,
          monthly_payment: state.monthlyPayment,
          annual_savings: state.annualSavings,
          notes: notes || null,
          zoho_lead_id: null,
          source: 'sales-portal',
          bill_file_url: state.billFileUrl || null,
          social_provider: state.socialProvider || null,
        }),
      });

      if (response.ok) {
        trackLeadCreated(state.selectedSystem?.systemSizeKw);
      }

      trackWizardStep(5, 'Contact');
      dispatch({ type: 'NEXT_STEP' });
    } catch (error) {
      console.error('Error creating lead:', error);
      // Continue anyway - don't block the user
      trackWizardStep(5, 'Contact');
      dispatch({ type: 'NEXT_STEP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <div className="max-w-xl mx-auto pb-24">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Get your full quote
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Enter your details to receive your personalized solar proposal
        </p>
      </div>

      {/* Social Login */}
      <SocialLogin onLogin={handleSocialLogin} />

      {/* Phone prompt after social login */}
      {showPhonePrompt && !phone && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <div className="text-amber-400 font-medium text-sm">Almost there!</div>
              <div className="text-gray-300 text-xs">Just add your phone number below to complete</div>
            </div>
          </div>
        </div>
      )}

      {/* What you'll get */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <div className="text-amber-400 font-medium text-sm mb-3">You&apos;ll receive:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">Full specs via email</div>
              <div className="text-gray-400 text-xs">Detailed system breakdown</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">SMS confirmation</div>
              <div className="text-gray-400 text-xs">Quick quote summary</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Smith"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              errors.fullName
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-white/20 focus:border-amber-500 focus:ring-amber-500'
            }`}
          />
          {errors.fullName && (
            <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-white/20 focus:border-amber-500 focus:ring-amber-500'
            }`}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79000000"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              errors.phone
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-white/20 focus:border-amber-500 focus:ring-amber-500'
            }`}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Additional Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any questions or special requirements..."
            rows={3}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-gray-400 text-sm">
            Your information is secure and will only be used to contact you about your solar quote.
            We never share your data with third parties.
          </p>
        </div>
      </div>

      {/* Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10">
        <div className="max-w-xl mx-auto flex gap-4 p-4">
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
            disabled={isSubmitting}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>View My Quote</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
