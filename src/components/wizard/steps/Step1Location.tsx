'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { useWizard } from '../WizardContext';
import { trackWizardStep } from '@/lib/analytics';

// Malta center coordinates
const MALTA_CENTER = { lat: 35.9375, lng: 14.3754 };
const INITIAL_ZOOM = 11; // Shows all of Malta and Gozo
const MAX_ZOOM = 20;

// Hardcoded temporarily - env var not being inlined properly by Turbopack
const GOOGLE_MAPS_API_KEY = 'AIzaSyBrFY-fUgljav3Mtc_scNjNh8Vq63MJRXU';

declare global {
  interface Window {
    google?: typeof google;
  }
}

export default function Step1Location() {
  const { state, dispatch } = useWizard();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(state.address || '');
  const [mapZoom, setMapZoom] = useState(INITIAL_ZOOM);
  const [scriptError, setScriptError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (window.google?.maps) {
      setMapsLoaded(true);
    }
  }, []);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!window.google?.maps) return '';

    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      });
    });
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !googleMapRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition(e.latLng);
    } else {
      markerRef.current = new window.google!.maps.Marker({
        position: e.latLng,
        map: googleMapRef.current,
        draggable: true,
        animation: window.google!.maps.Animation.DROP,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      // Handle marker drag
      markerRef.current.addListener('dragend', async () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          const address = await reverseGeocode(pos.lat(), pos.lng());
          setSelectedAddress(address);
          dispatch({
            type: 'SET_ADDRESS',
            payload: {
              address,
              coordinates: { lat: pos.lat(), lng: pos.lng() },
            },
          });
        }
      });
    }

    // Get address for this location
    const address = await reverseGeocode(lat, lng);
    setSelectedAddress(address);

    dispatch({
      type: 'SET_ADDRESS',
      payload: {
        address,
        coordinates: { lat, lng },
      },
    });

    // Zoom in if not already zoomed
    if (googleMapRef.current.getZoom()! < 18) {
      googleMapRef.current.setZoom(18);
      googleMapRef.current.panTo(e.latLng);
    }
  }, [dispatch, reverseGeocode]);

  // Initialize map when loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;

    const map = new window.google!.maps.Map(mapRef.current, {
      center: state.coordinates || MALTA_CENTER,
      zoom: state.coordinates ? 18 : INITIAL_ZOOM,
      mapTypeId: 'hybrid', // Satellite with labels - best for seeing roofs
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google!.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google!.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'hybrid'],
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      restriction: {
        latLngBounds: {
          north: 36.1,
          south: 35.7,
          east: 14.7,
          west: 14.1,
        },
        strictBounds: true,
      },
    });

    googleMapRef.current = map;

    // Add click listener
    map.addListener('click', handleMapClick);

    // Track zoom level
    map.addListener('zoom_changed', () => {
      setMapZoom(map.getZoom() || INITIAL_ZOOM);
    });

    // If we already have coordinates, place marker
    if (state.coordinates) {
      markerRef.current = new window.google!.maps.Marker({
        position: state.coordinates,
        map,
        draggable: true,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      markerRef.current.addListener('dragend', async () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          const address = await reverseGeocode(pos.lat(), pos.lng());
          setSelectedAddress(address);
          dispatch({
            type: 'SET_ADDRESS',
            payload: {
              address,
              coordinates: { lat: pos.lat(), lng: pos.lng() },
            },
          });
        }
      });
    }
  }, [mapsLoaded, state.coordinates, handleMapClick, dispatch, reverseGeocode]);

  const handleNext = async () => {
    if (!state.coordinates) {
      setError('Please click on the map to select your property location');
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
        throw new Error('Could not analyze roof. Please try a different location.');
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

  const handleReset = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    setSelectedAddress('');
    dispatch({
      type: 'SET_ADDRESS',
      payload: { address: '', coordinates: null },
    });
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(MALTA_CENTER);
      googleMapRef.current.setZoom(INITIAL_ZOOM);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Load Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Maps loaded successfully');
          setMapsLoaded(true);
        }}
        onError={(e) => {
          console.error('Google Maps failed to load:', e);
          setScriptError('Failed to load Google Maps. Please refresh the page.');
        }}
      />

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">
          Where is your property?
        </h1>
        <p className="text-gray-400">
          Click on the map to select your exact property location. Zoom in to see your roof clearly.
        </p>
      </div>

      {/* Script Error */}
      {scriptError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-red-400 text-sm">{scriptError}</p>
          <p className="text-gray-400 text-xs mt-2">API Key: {GOOGLE_MAPS_API_KEY ? 'Set' : 'Missing'}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-amber-200 text-sm">
            <strong>How to select your property:</strong>
            <ol className="mt-1 ml-4 list-decimal space-y-1">
              <li>Use the map to find your area in Malta or Gozo</li>
              <li>Zoom in until you can see your roof clearly</li>
              <li>Click directly on your property to place the marker</li>
              <li>Drag the marker to adjust if needed</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4">
        <div
          ref={mapRef}
          className="w-full h-[400px] md:h-[500px] bg-gray-900"
        />

        {/* Zoom indicator */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-white text-sm">
            Zoom: {mapZoom}/{MAX_ZOOM}
            {mapZoom < 16 && (
              <span className="text-amber-400 ml-2">← Zoom in more</span>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {!mapsLoaded && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location */}
      {selectedAddress && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Selected Location</p>
                <p className="text-gray-400 text-sm mt-1">{selectedAddress}</p>
                {state.coordinates && (
                  <p className="text-gray-500 text-xs mt-1">
                    {state.coordinates.lat.toFixed(6)}, {state.coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-white transition-colors p-2"
              title="Reset location"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleNext}
        disabled={isLoading || !state.coordinates}
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
