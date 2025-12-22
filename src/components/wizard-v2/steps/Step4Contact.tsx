'use client';

import { useState, useEffect } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { calculateExtrasTotal } from '@/lib/types-v2';

export default function Step4Contact() {
  const { state, dispatch } = useWizardV2();

  const [fullName, setFullName] = useState(state.fullName);
  const [email, setEmail] = useState(state.email);
  const [phone, setPhone] = useState(state.phone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Skip this step if pre-filled from Zoho
  useEffect(() => {
    if (state.isPrefilledLead && state.fullName && state.email) {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [state.isPrefilledLead, state.fullName, state.email, dispatch]);

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!fullName.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else if (!/^[0-9+\s-]{8,}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    triggerHaptic();
    setIsSubmitting(true);

    try {
      // Update context first
      dispatch({
        type: 'SET_CONTACT',
        payload: { fullName, email, phone },
      });

      // Create partial lead in database
      // This captures the lead BEFORE the map step (Step 6)
      const leadData = {
        name: fullName,
        email,
        phone,
        source: 'wizard-v2',
        is_gozo: state.location === 'gozo',
        monthly_bill: state.monthlyBill,
        // Include extras selection
        extras: state.extras,
        extras_total: calculateExtrasTotal(state.extras),
        // System info from calculator
        estimated_system_size: state.estimatedSystemSize,
        estimated_savings: state.estimatedSavings,
        // Grant type
        grant_type: state.grantType,
        // Battery only flag
        battery_only: state.isBatteryOnly,
        // Status - partial lead
        status: 'new',
        wizard_step: 4,
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lead?.id) {
          dispatch({
            type: 'SET_LEAD_ID',
            payload: { leadId: data.lead.id },
          });
        }
      }

      // Continue to next step regardless of API result
      dispatch({ type: 'NEXT_STEP' });

    } catch (error) {
      console.error('Error creating lead:', error);
      // Still continue - don't block the user
      dispatch({ type: 'NEXT_STEP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    triggerHaptic();
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-full mb-3">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Almost There!
        </h1>
        <p className="text-gray-400">
          Get your personalized quote delivered instantly
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-amber-500 focus:ring-amber-500/20'
              }`}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-amber-500 focus:ring-amber-500/20'
              }`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+356 9999 9999"
              className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                errors.phone
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-amber-500 focus:ring-amber-500/20'
              }`}
            />
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Value Reminder */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="text-white font-medium">
                Saving €{state.estimatedSavings?.toLocaleString() || '1,200'}/year
              </div>
              <div className="text-gray-400 text-sm">
                Based on your €{state.monthlyBill}/month bill
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>No spam</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Free quote</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full font-semibold text-lg py-4 rounded-full transition-all active:scale-[0.98] ${
            isSubmitting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Get My Quote'
          )}
        </button>

        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="w-full text-gray-400 font-medium py-3 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <p className="text-center text-gray-500 text-sm">
          4 of 6 • Your quote is almost ready
        </p>
      </div>
    </div>
  );
}
