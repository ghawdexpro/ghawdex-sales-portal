'use client';

import { useState, useEffect, useRef } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep } from '@/lib/analytics';

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

export default function Step1Location() {
  const { state, dispatch } = useWizard();
  const [address, setAddress] = useState(state.address);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    window.initGoogleMaps = () => {
      setMapsLoaded(true);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      window.initGoogleMaps = undefined;
    };
  }, []);

  // Initialize autocomplete when maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google!.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'mt' },
      types: ['address'],
      fields: ['formatted_address', 'geometry'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();

      if (place.formatted_address && place.geometry?.location) {
        setAddress(place.formatted_address);
        dispatch({
          type: 'SET_ADDRESS',
          payload: {
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          },
        });
      }
    });
  }, [mapsLoaded, dispatch]);

  const handleNext = async () => {
    if (!address.trim()) {
      setError('Please enter your address');
      return;
    }

    if (!state.coordinates) {
      setError('Please select an address from the dropdown');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Fetch solar data from Google Solar API
      const response = await fetch('/api/solar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: state.coordinates.lat,
          lng: state.coordinates.lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not analyze roof. Please try a different address.');
      }

      const solarData = await response.json();

      dispatch({
        type: 'SET_SOLAR_DATA',
        payload: {
          roofArea: solarData.roofArea || 50,
          maxPanels: solarData.maxPanels || 20,
          annualSunshine: solarData.annualSunshine || 2000,
          solarPotential: solarData.solarPotential || null,
        },
      });

      trackWizardStep(1, 'Location');
      dispatch({ type: 'NEXT_STEP' });
    } catch (err) {
      // If Solar API fails, use defaults and continue
      console.warn('Solar API error, using defaults:', err);
      dispatch({
        type: 'SET_SOLAR_DATA',
        payload: {
          roofArea: 60,
          maxPanels: 24,
          annualSunshine: 2000,
          solarPotential: null,
        },
      });
      trackWizardStep(1, 'Location');
      dispatch({ type: 'NEXT_STEP' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">
          Where is your property located?
        </h1>
        <p className="text-gray-400">
          We&apos;ll analyze your roof using satellite imagery to determine the best solar setup
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Property Address
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Start typing your address..."
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}

        {state.coordinates && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 text-sm">Address confirmed</span>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-amber-200 text-sm">
              We only serve properties in Malta and Gozo. Your address will be used to analyze your roof and calculate potential solar generation.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleNext}
        disabled={isLoading || !address.trim()}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Analyzing your roof...</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
