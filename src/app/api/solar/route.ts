import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SOLAR_API_KEY = process.env.GOOGLE_SOLAR_API_KEY;

interface SolarApiResponse {
  solarPotential?: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    roofSegmentStats?: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: {
        areaMeters2: number;
        sunshineQuantiles: number[];
        groundAreaMeters2: number;
      };
    }>;
    solarPanelConfigs?: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        pitchDegrees: number;
        azimuthDegrees: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
      }>;
    }>;
  };
  imageryDate?: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate?: {
    year: number;
    month: number;
    day: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_SOLAR_API_KEY) {
      console.error('GOOGLE_SOLAR_API_KEY not configured');
      // Return fallback data for development
      return NextResponse.json(getFallbackData());
    }

    // Call Google Solar API - Building Insights endpoint
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${GOOGLE_SOLAR_API_KEY}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Solar API error:', response.status, errorText);

      // If location not covered by Solar API, return fallback
      if (response.status === 404 || response.status === 400) {
        return NextResponse.json(getFallbackData());
      }

      return NextResponse.json(
        { error: 'Failed to fetch solar data', details: errorText },
        { status: response.status }
      );
    }

    const data: SolarApiResponse = await response.json();

    // Extract relevant data
    const solarPotential = data.solarPotential;

    if (!solarPotential) {
      return NextResponse.json(getFallbackData());
    }

    // Calculate total roof area from segments
    const totalRoofArea = solarPotential.roofSegmentStats?.reduce(
      (sum, segment) => sum + (segment.stats?.areaMeters2 || 0),
      0
    ) || solarPotential.maxArrayAreaMeters2 || 50;

    // Get the best configuration (usually the one with most panels)
    const bestConfig = solarPotential.solarPanelConfigs?.[
      solarPotential.solarPanelConfigs.length - 1
    ];

    const result = {
      roofArea: Math.round(totalRoofArea),
      maxPanels: solarPotential.maxArrayPanelsCount || 20,
      annualSunshine: Math.round(solarPotential.maxSunshineHoursPerYear || 2000),
      yearlyEnergyDcKwh: bestConfig?.yearlyEnergyDcKwh || null,
      panelCapacityWatts: solarPotential.panelCapacityWatts || 400,
      carbonOffsetFactor: solarPotential.carbonOffsetFactorKgPerMwh || 500,
      solarPotential: {
        maxArrayPanelsCount: solarPotential.maxArrayPanelsCount,
        maxArrayAreaMeters2: solarPotential.maxArrayAreaMeters2,
        maxSunshineHoursPerYear: solarPotential.maxSunshineHoursPerYear,
        carbonOffsetFactorKgPerMwh: solarPotential.carbonOffsetFactorKgPerMwh,
        panelCapacityWatts: solarPotential.panelCapacityWatts,
        panelHeightMeters: solarPotential.panelHeightMeters,
        panelWidthMeters: solarPotential.panelWidthMeters,
        yearlyEnergyDcKwh: bestConfig?.yearlyEnergyDcKwh,
      },
      imageryDate: data.imageryDate,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Solar API error:', error);
    return NextResponse.json(getFallbackData());
  }
}

// Fallback data for when Solar API is unavailable or location not covered
function getFallbackData() {
  return {
    roofArea: 60,
    maxPanels: 24,
    annualSunshine: 2000,
    yearlyEnergyDcKwh: 12000,
    panelCapacityWatts: 500,
    carbonOffsetFactor: 500,
    solarPotential: null,
    isFallback: true,
    message: 'Using estimated values. Actual analysis will be performed during site visit.',
  };
}
