/**
 * Google Maps URL utilities
 * Uses the official Google Maps URLs API format for better compatibility
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */

/**
 * Generate a Google Maps link from coordinates
 * Uses the official Maps URLs API format which is more stable and feature-rich
 */
export function generateGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Generate a Google Maps link from coordinates object
 * Returns null if coordinates are null/undefined
 */
export function generateGoogleMapsLinkFromCoords(
  coordinates: { lat: number; lng: number } | null | undefined
): string | null {
  if (!coordinates) return null;
  return generateGoogleMapsLink(coordinates.lat, coordinates.lng);
}
