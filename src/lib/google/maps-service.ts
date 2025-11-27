import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const libraryCache: Record<string, unknown> = {}
let isConfigured = false

// NEXT_PUBLIC_ vars are inlined at build time, so this works on Railway
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

const configureGoogleMaps = () => {
  if (!isConfigured && typeof window !== 'undefined') {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly'
    })
    isConfigured = true
  }
}

export const loadGoogleMaps = async (): Promise<typeof google> => {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded on client side')
  }

  configureGoogleMaps()

  if (!libraryCache['core']) {
    libraryCache['core'] = await importLibrary('core')
  }

  return window.google
}

export const loadLibrary = async (name: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded on client side')
  }

  configureGoogleMaps()

  if (!libraryCache[name]) {
    libraryCache[name] = await importLibrary(name as Parameters<typeof importLibrary>[0])
  }

  return libraryCache[name]
}

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const google = await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].formatted_address)
      } else {
        resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    })
  })
}
