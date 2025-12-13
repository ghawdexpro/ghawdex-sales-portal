'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWizard } from '../WizardContext';
import { trackWizardStep } from '@/lib/analytics';
import { trackTelegramWizardStep } from '@/lib/telegram-events';
import { loadGoogleMaps, reverseGeocode, loadPlacesLibrary } from '@/lib/google/maps-service';
import { generateGoogleMapsLink } from '@/lib/google/maps-utils';
import { detectLocation } from '@/lib/types';

// Malta center coordinates
const MALTA_CENTER = { lat: 35.9375, lng: 14.3754 };
const INITIAL_ZOOM = 11;

// Quick-select locality centers (zoom to area, user clicks to pin exact location)
const LOCALITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Valletta': { lat: 35.8989, lng: 14.5146 },
  'Sliema': { lat: 35.9125, lng: 14.5044 },
  "St Julian's": { lat: 35.9186, lng: 14.4903 },
  'Birkirkara': { lat: 35.8958, lng: 14.4611 },
  'Victoria (Gozo)': { lat: 36.0444, lng: 14.2397 },
  'Marsalforn': { lat: 36.0722, lng: 14.2556 },
  'Xlendi': { lat: 36.0283, lng: 14.2153 },
};

export default function Step1Location() {
  const { state, dispatch } = useWizard();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(state.address || '');
  const [mapZoom, setMapZoom] = useState(INITIAL_ZOOM);
  const [loadError, setLoadError] = useState('');
  // searchQuery state removed - Google Autocomplete manages input value directly
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  // Handle map click
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !googleMapRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition(e.latLng);
    } else {
      markerRef.current = new google.maps.Marker({
        position: e.latLng,
        map: googleMapRef.current,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
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
              googleMapsLink: generateGoogleMapsLink(pos.lat(), pos.lng()),
              location: detectLocation(pos.lat()),
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
        googleMapsLink: generateGoogleMapsLink(lat, lng),
        location: detectLocation(lat),
      },
    });

    // Gradual zoom - don't place marker until zoomed in enough
    const currentZoom = googleMapRef.current.getZoom() || INITIAL_ZOOM;

    if (currentZoom < 20) {
      // Zoom in gradually: +1 level per click, max 21
      const nextZoom = Math.min(currentZoom + 1, 21);
      // Set center first, then zoom to avoid drift
      googleMapRef.current.setCenter(e.latLng);
      googleMapRef.current.setZoom(nextZoom);

      // Remove marker if not zoomed in enough - user needs to click again when closer
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      setSelectedAddress('');
      dispatch({
        type: 'SET_ADDRESS',
        payload: { address: '', coordinates: null, googleMapsLink: null, location: 'malta' },
      });
      return;
    }
  }, [dispatch]);

  // Place marker at specific coordinates (used by autocomplete and geolocation)
  const placeMarkerAt = useCallback(async (lat: number, lng: number, zoomLevel: number = 19) => {
    if (!googleMapRef.current) return;

    const position = new google.maps.LatLng(lat, lng);

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new google.maps.Marker({
        position,
        map: googleMapRef.current,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
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
              googleMapsLink: generateGoogleMapsLink(pos.lat(), pos.lng()),
              location: detectLocation(pos.lat()),
            },
          });
        }
      });
    }

    // Get address and update state
    const address = await reverseGeocode(lat, lng);
    setSelectedAddress(address);

    dispatch({
      type: 'SET_ADDRESS',
      payload: {
        address,
        coordinates: { lat, lng },
        googleMapsLink: generateGoogleMapsLink(lat, lng),
        location: detectLocation(lat),
      },
    });

    // Center and zoom the map
    googleMapRef.current.setCenter(position);
    googleMapRef.current.setZoom(zoomLevel);
  }, [dispatch]);

  // Handle "Use my location" button
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Check if location is in Malta/Gozo area (roughly)
        const isInMalta = latitude >= 35.7 && latitude <= 36.1 && longitude >= 14.1 && longitude <= 14.6;

        if (!isInMalta) {
          setLocationError('Your location appears to be outside Malta. Please search for your address or click on the map.');
          setIsLocating(false);
          return;
        }

        await placeMarkerAt(latitude, longitude, 19);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions or search for your address.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please search for your address.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or search for your address.');
            break;
          default:
            setLocationError('Could not get your location. Please search for your address.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [placeMarkerAt]);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || googleMapRef.current) return;

      try {
        const google = await loadGoogleMaps();
        setMapsLoaded(true);

        const map = new google.maps.Map(mapRef.current, {
          center: state.coordinates || MALTA_CENTER,
          zoom: state.coordinates ? 18 : INITIAL_ZOOM,
          mapTypeId: 'hybrid',
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'hybrid'],
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false, // Disable POI clicks so they don't interfere with pin placement
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
          markerRef.current = new google.maps.Marker({
            position: state.coordinates,
            map,
            draggable: true,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
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
                  googleMapsLink: generateGoogleMapsLink(pos.lat(), pos.lng()),
                  location: detectLocation(pos.lat()),
                },
              });
            }
          });
        }
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setLoadError('Failed to load Google Maps. Please refresh the page.');
      }
    };

    initMap();
  }, [state.coordinates, handleMapClick, dispatch]);

  // Initialize Places Autocomplete (new PlaceAutocompleteElement API)
  useEffect(() => {
    const initAutocomplete = async () => {
      if (!searchContainerRef.current || autocompleteElementRef.current || !mapsLoaded) return;

      try {
        await loadPlacesLibrary();

        // Create the new PlaceAutocompleteElement web component
        const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: 'mt' },
          // Using 'geocode' instead of 'address' to include Gozo locations
          types: ['geocode'],
        });

        // Style the web component to match our dark theme
        autocompleteElement.style.cssText = `
          width: 100%;
          --gmpx-color-surface: rgba(255, 255, 255, 0.05);
          --gmpx-color-on-surface: white;
          --gmpx-color-on-surface-variant: rgb(156, 163, 175);
          --gmpx-color-outline: rgba(255, 255, 255, 0.1);
          --gmpx-color-primary: rgb(245, 158, 11);
        `;

        // Listen for place selection using the new event
        autocompleteElement.addEventListener('gmp-select', async (event: Event) => {
          console.log('🔍 Event fired:', event.type);

          // The event passes placePrediction directly (per Google Maps docs)
          const { placePrediction } = event as unknown as { placePrediction: google.maps.places.PlacePrediction };
          console.log('🎯 PlacePrediction:', placePrediction);

          if (!placePrediction) {
            console.error('No placePrediction in event');
            return;
          }

          try {
            // Convert prediction to full Place object
            const place = placePrediction.toPlace();
            console.log('🏠 Place object:', place);

            // Fetch the fields we need
            await place.fetchFields({ fields: ['location', 'viewport', 'formattedAddress', 'displayName'] });
            console.log('✅ Fields fetched - location:', place.location, 'viewport:', place.viewport);

            if (place.location && googleMapRef.current) {
              const lat = place.location.lat();
              const lng = place.location.lng();

              // Clear any existing marker first
              if (markerRef.current) {
                markerRef.current.setMap(null);
                markerRef.current = null;
              }

              // Try to use viewport for localities, fallback to center + zoom
              if (place.viewport) {
                googleMapRef.current.fitBounds(place.viewport);
                console.log('🗺️ Fitted to viewport');
              } else {
                googleMapRef.current.setCenter({ lat, lng });
                googleMapRef.current.setZoom(15);
                console.log('🗺️ Centered on location with zoom 15');
              }

              // Clear address state - let user click to pin exact location
              setSelectedAddress('');
              dispatch({
                type: 'SET_ADDRESS',
                payload: { address: '', coordinates: null, googleMapsLink: null, location: detectLocation(lat) },
              });
            }
          } catch (err) {
            console.error('Error processing place selection:', err);
          }
        });

        // Append to container
        searchContainerRef.current.appendChild(autocompleteElement);
        autocompleteElementRef.current = autocompleteElement;
      } catch (err) {
        console.error('Failed to initialize autocomplete:', err);
      }
    };

    initAutocomplete();

    // Cleanup on unmount
    return () => {
      if (autocompleteElementRef.current && searchContainerRef.current) {
        try {
          searchContainerRef.current.removeChild(autocompleteElementRef.current);
        } catch {
          // Element may already be removed
        }
        autocompleteElementRef.current = null;
      }
    };
  }, [mapsLoaded, placeMarkerAt, dispatch]);

  const handleNext = async () => {
    if (!state.coordinates) {
      setError('Please click on the map to select your property location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
          isFallback: solarData.isFallback || false,
        },
      });

      trackWizardStep(1, 'Location');
      trackTelegramWizardStep(1, 'Location', {
        address: state.address,
        region: state.location,
        roofArea: solarData.roofArea || 50,
        maxPanels: solarData.maxPanels || 20,
      });
      dispatch({ type: 'NEXT_STEP' });
    } catch (err) {
      console.warn('Solar API error, using defaults:', err);
      dispatch({
        type: 'SET_SOLAR_DATA',
        payload: {
          roofArea: 60,
          maxPanels: 24,
          annualSunshine: 2000,
          solarPotential: null,
          isFallback: true,
        },
      });
      trackWizardStep(1, 'Location');
      trackTelegramWizardStep(1, 'Location', {
        address: state.address,
        region: state.location,
        roofArea: 60,
        maxPanels: 24,
      });
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
      payload: { address: '', coordinates: null, googleMapsLink: null, location: 'malta' },
    });
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(MALTA_CENTER);
      googleMapRef.current.setZoom(INITIAL_ZOOM);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Pin Your Exact Roof
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Click directly on your roof for accurate solar analysis
        </p>
      </div>

      {/* Search bar and location button */}
      <div className="flex gap-2 mb-4">
        {/* Container for Google Places Autocomplete web component */}
        <div
          ref={searchContainerRef}
          className="flex-1 [&_gmp-place-autocomplete]:w-full [&_input]:w-full [&_input]:bg-white/5 [&_input]:border [&_input]:border-white/10 [&_input]:rounded-xl [&_input]:py-3 [&_input]:px-4 [&_input]:text-white [&_input]:placeholder-gray-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-amber-500/50 [&_input]:focus:border-amber-500/50 [&_input]:transition-all"
        />
        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          aria-label="Use my current location"
          className={`rounded-xl px-4 py-3 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap ${mapZoom <= INITIAL_ZOOM + 2 && !state.coordinates
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold animate-pulse hover:animate-none hover:shadow-lg hover:shadow-amber-500/25'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
        >
          {isLocating ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
            </svg>
          )}
          <span className="text-sm font-medium">{isLocating ? 'Finding you...' : <><span className="sm:hidden">Find Me</span><span className="hidden sm:inline">Find My Location</span></>}</span>
        </button>
      </div>

      {/* Google attribution and quick-select localities */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="hidden sm:flex flex-wrap gap-2">
          {Object.keys(LOCALITY_CENTERS).map((locality) => (
            <button
              key={locality}
              onClick={() => {
                const coords = LOCALITY_CENTERS[locality];
                if (googleMapRef.current && coords) {
                  // Zoom to locality center at neighborhood level
                  googleMapRef.current.panTo(coords);
                  googleMapRef.current.setZoom(15);
                  // Clear any existing marker so user can place new one
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
                  }
                  setSelectedAddress('');
                  dispatch({
                    type: 'SET_ADDRESS',
                    payload: { address: '', coordinates: null, googleMapsLink: null, location: detectLocation(coords.lat) },
                  });
                }
              }}
              aria-label={`Zoom to ${locality}`}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {locality}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Powered by Google
        </span>
      </div>

      {locationError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <p className="text-amber-400 text-sm">{locationError}</p>
        </div>
      )}

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="text-red-400 text-sm">{loadError}</p>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4">
        <div
          ref={mapRef}
          className="w-full h-[400px] md:h-[500px] bg-gray-900"
        />

        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-sm">
            {state.coordinates ? (
              <span className="text-green-400">Location selected</span>
            ) : mapZoom >= 19 ? (
              <span className="text-green-400">Click to place pin</span>
            ) : mapZoom >= 16 ? (
              <span className="text-amber-400">Almost there - zoom in a bit more</span>
            ) : (
              <span className="text-gray-400">Click or search to find your property</span>
            )}
          </div>
        </div>

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

        {/* Continue button overlay - only shows after pin is placed */}
        {state.coordinates && (
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="absolute bottom-4 left-4 right-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-fade-in backdrop-blur-sm"
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
        )}
      </div>

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
    </div>
  );
}
