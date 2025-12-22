'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWizardV2 } from '../WizardContextV2';
import { calculateTotalPriceWithGrant, calculateDeposit } from '@/lib/calculations';
import { calculateExtrasTotal, GRANT_DATA_V2 } from '@/lib/types-v2';
import { BATTERY_OPTIONS } from '@/lib/types';

// Simplified map component for address input
function AddressInput({
  address,
  onAddressChange,
  onCoordinatesChange,
}: {
  address: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null, link: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Wait for Google Maps to load
    const checkLoaded = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        clearInterval(checkLoaded);
      }
    }, 100);

    return () => clearInterval(checkLoaded);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'mt' },
      fields: ['formatted_address', 'geometry', 'name'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';
        const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

        onAddressChange(formattedAddress);
        onCoordinatesChange({ lat, lng }, googleMapsLink);
      }
    });
  }, [isLoaded, onAddressChange, onCoordinatesChange]);

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Enter your address..."
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
      />
    </div>
  );
}

export default function Step6Location() {
  const { state, dispatch } = useWizardV2();

  const [address, setAddress] = useState(state.address);
  const [coordinates, setCoordinates] = useState(state.coordinates);
  const [googleMapsLink, setGoogleMapsLink] = useState(state.googleMapsLink);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Calculate final pricing
  const selectedBattery = state.batterySize
    ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize) || BATTERY_OPTIONS[1]
    : null;

  const pricing = calculateTotalPriceWithGrant(
    state.selectedSystem,
    state.withBattery ? selectedBattery : null,
    state.grantType,
    state.location
  );

  const extrasTotal = calculateExtrasTotal(state.extras);
  const finalPrice = pricing.totalPrice + extrasTotal;
  const deposit = calculateDeposit(finalPrice);
  const grantInfo = GRANT_DATA_V2[state.location];

  const handleCoordinatesChange = useCallback((coords: { lat: number; lng: number } | null, link: string | null) => {
    setCoordinates(coords);
    setGoogleMapsLink(link);
  }, []);

  const handleSubmit = async () => {
    if (!address.trim()) return;

    triggerHaptic();
    setIsSubmitting(true);

    try {
      // Update context with location
      dispatch({
        type: 'SET_LOCATION',
        payload: { address, coordinates, googleMapsLink },
      });

      // Update the lead with complete information
      if (state.leadId) {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: state.leadId,
            address,
            coordinates,
            google_maps_link: googleMapsLink,
            // System details
            selected_system: state.selectedSystem?.id,
            system_size_kw: state.selectedSystem?.systemSizeKw || 0,
            with_battery: state.withBattery,
            battery_size_kwh: state.batterySize,
            grant_type: state.grantType,
            grant_amount: pricing.grantAmount,
            // Pricing
            total_price: finalPrice,
            deposit_amount: deposit,
            // Mark as completed
            wizard_step: 6,
            status: 'new',
          }),
        });
      }

      setSubmitted(true);

    } catch (error) {
      console.error('Error updating lead:', error);
      setSubmitted(true);  // Still show success to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    triggerHaptic();
    dispatch({ type: 'PREV_STEP' });
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Quote Request Received!
        </h1>

        <p className="text-gray-400 mb-8 max-w-md">
          Thanks {state.fullName.split(' ')[0]}! Our solar expert will call you within 24 hours with your personalized quote.
        </p>

        {/* Summary Card */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Selection</h3>

          <div className="space-y-3 text-left">
            {state.selectedSystem && (
              <div className="flex justify-between">
                <span className="text-gray-400">System</span>
                <span className="text-white">{state.selectedSystem.name} ({state.selectedSystem.systemSizeKw} kW)</span>
              </div>
            )}
            {state.withBattery && state.batterySize && (
              <div className="flex justify-between">
                <span className="text-gray-400">Battery</span>
                <span className="text-white">{state.batterySize} kWh</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Location</span>
              <span className="text-white capitalize">{state.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Grant</span>
              <span className="text-green-400">-€{pricing.grantAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10">
              <span className="text-white font-semibold">Estimated Price</span>
              <span className="text-xl font-bold text-amber-400">€{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="w-full max-w-md text-left">
          <h3 className="text-sm font-medium text-gray-400 mb-3">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-xs font-bold">1</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Expert Call</div>
                <div className="text-gray-500 text-xs">Within 24 hours</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-xs font-bold">2</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Site Assessment</div>
                <div className="text-gray-500 text-xs">Free home visit</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-xs font-bold">3</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Installation</div>
                <div className="text-gray-500 text-xs">Within 14 days of signing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Where Should We Install?
        </h1>
        <p className="text-gray-400">
          Enter your property address for the site assessment
        </p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Address Input */}
        <AddressInput
          address={address}
          onAddressChange={setAddress}
          onCoordinatesChange={handleCoordinatesChange}
        />

        {/* Address confirmation */}
        {coordinates && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400 text-sm">Address confirmed</span>
            </div>
          </div>
        )}

        {/* Quote Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <h3 className="text-white font-semibold mb-3">Your Quote Summary</h3>

          <div className="space-y-2 text-sm">
            {state.selectedSystem && (
              <div className="flex justify-between">
                <span className="text-gray-400">{state.selectedSystem.name} System</span>
                <span className="text-white">
                  €{(state.withBattery ? state.selectedSystem.priceWithBattery : state.selectedSystem.priceWithGrant).toLocaleString()}
                </span>
              </div>
            )}
            {state.withBattery && selectedBattery && (
              <div className="flex justify-between">
                <span className="text-gray-400">{selectedBattery.capacityKwh} kWh Battery</span>
                <span className="text-white">€{selectedBattery.price.toLocaleString()}</span>
              </div>
            )}
            {extrasTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Safety Add-ons</span>
                <span className="text-white">€{extrasTotal}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-green-400">{grantInfo.name} Grant</span>
              <span className="text-green-400">-€{pricing.grantAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white font-semibold">Total</span>
              <span className="text-xl font-bold text-amber-400">€{finalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Deposit (50%)</span>
              <span className="text-gray-400">€{deposit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Contact Summary */}
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <div className="text-white font-medium">{state.fullName}</div>
              <div className="text-gray-400 text-sm">{state.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-6 space-y-3 max-w-lg mx-auto w-full">
        <button
          onClick={handleSubmit}
          disabled={!address.trim() || isSubmitting}
          className={`w-full font-semibold text-lg py-4 rounded-full transition-all active:scale-[0.98] ${
            !address.trim() || isSubmitting
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
              Submitting...
            </span>
          ) : (
            'Get My Final Quote'
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
          6 of 6 • Final step!
        </p>
      </div>
    </div>
  );
}
