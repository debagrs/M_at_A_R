// Air environmental data service for "Ar" work
// Fetches data on CO2, particulates, methane, and ozone

import { supabase } from "@/integrations/supabase/client";

export interface AirData {
  co2: number;        // 0-1 normalized (atmospheric CO2 concentration)
  particulates: number; // 0-1 normalized (PM2.5 particulate matter)
  methane: number;     // 0-1 normalized (CH4 atmospheric levels)
  ozone: number;       // 0-1 normalized (ozone layer depletion)
  timestamp: number;
  sources?: {
    co2: string;
    particulates: string;
    methane: string;
    ozone: string;
  };
}

let cachedApiData: AirData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000;

const fallbackData: AirData = {
  co2: 0.85,
  particulates: 0.55,
  methane: 0.94,
  ozone: 0.38,
  timestamp: Date.now(),
};

let temporalAccumulation = 0;
const ACCUMULATION_RATE = 0.00001;

export async function fetchAirData(): Promise<AirData | null> {
  const now = Date.now();
  
  if (cachedApiData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedApiData;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('air-data');
    
    if (error) {
      console.warn('Air edge function error:', error);
      return null;
    }
    
    if (data) {
      cachedApiData = data as AirData;
      lastFetchTime = now;
      console.log('Air data fetched:', data.sources);
      return cachedApiData;
    }
  } catch (err) {
    console.warn('Failed to fetch air data:', err);
  }
  
  return null;
}

export function getAirData(apiData?: AirData | null): AirData {
  const baseData = apiData || fallbackData;
  
  const now = Date.now();
  // Atmospheric drift — slower, more diffuse than ocean waves
  const breathCycle = Math.sin(now / 8000) * 0.02;
  const windCycle = Math.sin(now / 20000) * 0.018;
  const pressureCycle = Math.sin(now / 40000) * 0.012;
  
  temporalAccumulation = Math.min(temporalAccumulation + ACCUMULATION_RATE, 0.25);
  
  return {
    co2: Math.min(1, baseData.co2 + breathCycle + temporalAccumulation * 0.3),
    particulates: Math.min(1, baseData.particulates + windCycle + temporalAccumulation * 0.5),
    methane: Math.min(1, baseData.methane + pressureCycle + temporalAccumulation * 0.2),
    ozone: Math.min(1, baseData.ozone + breathCycle * 0.5 + temporalAccumulation * 0.4),
    timestamp: now,
    sources: apiData?.sources,
  };
}

export interface AirVisualParameters {
  noiseIntensity: number;    // From CO2 — density of visual noise
  particleDensity: number;   // From particulates — floating particle count
  formOpacity: number;       // From methane — forms become invisible
  hazeDepth: number;         // From ozone — atmospheric haze thickness
  overallDecay: number;
}

export interface AirHumanLayerData {
  transportUsage: number;
  energyConsumption: number;
  airQualityAwareness: number;
  climatePerception: number;
}

export function airDataToVisualParams(data: AirData, humanLayer?: AirHumanLayerData): AirVisualParameters {
  let params: AirVisualParameters = {
    noiseIntensity: data.co2 * 0.95,
    particleDensity: data.particulates * 0.9,
    formOpacity: data.methane * 0.85,
    hazeDepth: data.ozone * 0.75,
    overallDecay: (data.co2 + data.particulates + data.methane + data.ozone) / 3,
  };

  // Bidirectional human layer: Left (0) = More Noise/Decay, Right (1) = Less Noise/Clarity
  if (humanLayer) {
    const humanInfluence = (
      (0.5 - humanLayer.transportUsage) +
      (0.5 - humanLayer.energyConsumption) +
      (0.5 - humanLayer.airQualityAwareness) +
      (0.5 - humanLayer.climatePerception)
    ) * 0.25;

    const MAGNITUDE = 0.85; // Increased for better visibility of personalization
    params = {
      noiseIntensity: params.noiseIntensity + humanInfluence * MAGNITUDE,
      particleDensity: params.particleDensity + humanInfluence * MAGNITUDE * 0.85,
      formOpacity: params.formOpacity + humanInfluence * MAGNITUDE * 0.75,
      hazeDepth: params.hazeDepth + humanInfluence * MAGNITUDE * 0.7,
      overallDecay: params.overallDecay + humanInfluence * MAGNITUDE,
    };
  }

  return {
    noiseIntensity: Math.min(1, Math.max(0, params.noiseIntensity)),
    particleDensity: Math.min(1, Math.max(0, params.particleDensity)),
    formOpacity: Math.min(1, Math.max(0, params.formOpacity)),
    hazeDepth: Math.min(1, Math.max(0, params.hazeDepth)),
    overallDecay: Math.min(1, Math.max(0, params.overallDecay)),
  };
}

export const airDataSources = {
  co2: {
    label: 'CO₂ atmosférico',
    sources: ['NOAA GML', 'Copernicus CAMS'],
    unit: 'ppm',
  },
  particulates: {
    label: 'Material particulado',
    sources: ['Copernicus CAMS', 'WHO'],
    unit: 'µg/m³ PM2.5',
  },
  methane: {
    label: 'Metano atmosférico',
    sources: ['NOAA GML', 'Copernicus CAMS'],
    unit: 'ppb',
  },
  ozone: {
    label: 'Camada de ozônio',
    sources: ['Copernicus CAMS', 'NOAA'],
    unit: 'DU',
  },
};

export function resetAirAccumulation(): void {
  temporalAccumulation = 0;
}

export function getAirDataStatus(): { isLive: boolean; sources: AirData['sources'] | null } {
  return {
    isLive: cachedApiData !== null,
    sources: cachedApiData?.sources || null,
  };
}
