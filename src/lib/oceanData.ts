// Ocean environmental data service for "Mar" work
// Fetches data on ocean temperature, marine pollution, and fishing

import { supabase } from "@/integrations/supabase/client";

export interface OceanData {
  temperature: number; // 0-1 normalized (ocean surface temp anomaly)
  pollution: number; // 0-1 normalized (marine debris/microplastics)
  fishing: number; // 0-1 normalized (industrial fishing intensity)
  acidification: number; // 0-1 normalized (ocean pH decline)
  timestamp: number;
  sources?: {
    temperature: string;
    pollution: string;
    fishing: string;
    acidification: string;
  };
}

// Cached data from API
let cachedApiData: OceanData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Fallback data based on current scientific observations
const fallbackData: OceanData = {
  temperature: 0.58, // Above average warming
  pollution: 0.62, // High plastic pollution levels
  fishing: 0.71, // Overfishing intensity
  acidification: 0.45, // pH decline from pre-industrial
  timestamp: Date.now(),
};

// Gradual temporal accumulation
let temporalAccumulation = 0;
const ACCUMULATION_RATE = 0.00001;

// Fetch real data from edge function
export async function fetchOceanData(): Promise<OceanData | null> {
  const now = Date.now();
  
  if (cachedApiData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedApiData;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('ocean-data');
    
    if (error) {
      console.warn('Ocean edge function error:', error);
      return null;
    }
    
    if (data) {
      cachedApiData = data as OceanData;
      lastFetchTime = now;
      console.log('Ocean data fetched:', data.sources);
      return cachedApiData;
    }
  } catch (err) {
    console.warn('Failed to fetch ocean data:', err);
  }
  
  return null;
}

// Get ocean data with temporal variation
export function getOceanData(apiData?: OceanData | null): OceanData {
  const baseData = apiData || fallbackData;
  
  // Wave-like temporal variation
  const now = Date.now();
  const waveCycle = Math.sin(now / 6000) * 0.025;
  const swellCycle = Math.sin(now / 15000) * 0.02;
  const tideCycle = Math.sin(now / 30000) * 0.015;
  
  temporalAccumulation = Math.min(temporalAccumulation + ACCUMULATION_RATE, 0.25);
  
  return {
    temperature: Math.min(1, baseData.temperature + waveCycle + temporalAccumulation * 0.4),
    pollution: Math.min(1, baseData.pollution + swellCycle + temporalAccumulation * 0.5),
    fishing: Math.min(1, baseData.fishing + tideCycle + temporalAccumulation * 0.3),
    acidification: Math.min(1, baseData.acidification + waveCycle * 0.5 + temporalAccumulation * 0.35),
    timestamp: now,
    sources: apiData?.sources,
  };
}

// Visual parameters for ocean visualization
export interface OceanVisualParameters {
  opacityLevel: number; // From temperature - water clarity loss
  dissolutionIntensity: number; // From pollution - image dissolution
  latencyEffect: number; // From fishing - temporal delay/ghosting
  blurAmount: number; // From acidification - visual haziness
  overallDecay: number;
}

export interface OceanHumanLayerData {
  seafoodConsumption: number;
  plasticUsage: number;
  oceanAwareness: number;
  coastalConnection: number;
}

export function oceanDataToVisualParams(data: OceanData, humanLayer?: OceanHumanLayerData): OceanVisualParameters {
  let params: OceanVisualParameters = {
    opacityLevel: data.temperature * 0.85,
    dissolutionIntensity: data.pollution * 0.95,
    latencyEffect: data.fishing * 0.8,
    blurAmount: data.acidification * 0.7,
    overallDecay: (data.temperature + data.pollution + data.fishing + data.acidification) / 3,
  };

  // Bidirectional human layer: Left (0) = More Noise/Decay, Right (1) = Less Noise/Clarity
  if (humanLayer) {
    const humanInfluence = (
      (0.5 - humanLayer.seafoodConsumption) +
      (0.5 - humanLayer.plasticUsage) +
      (0.5 - humanLayer.oceanAwareness) +
      (0.5 - humanLayer.coastalConnection)
    ) * 0.25;

    const MAGNITUDE = 0.85; // Increased for better visibility of personalization
    params = {
      opacityLevel: params.opacityLevel + humanInfluence * MAGNITUDE * 0.85,
      dissolutionIntensity: params.dissolutionIntensity + humanInfluence * MAGNITUDE,
      latencyEffect: params.latencyEffect + humanInfluence * MAGNITUDE * 0.8,
      blurAmount: params.blurAmount + humanInfluence * MAGNITUDE * 0.7,
      overallDecay: params.overallDecay + humanInfluence * MAGNITUDE,
    };
  }

  return {
    opacityLevel: Math.min(1, Math.max(0, params.opacityLevel)),
    dissolutionIntensity: Math.min(1, Math.max(0, params.dissolutionIntensity)),
    latencyEffect: Math.min(1, Math.max(0, params.latencyEffect)),
    blurAmount: Math.min(1, Math.max(0, params.blurAmount)),
    overallDecay: Math.min(1, Math.max(0, params.overallDecay)),
  };
}

// Data source labels for display
export const oceanDataSources = {
  temperature: {
    label: 'Temperatura oceânica',
    sources: ['Copernicus Marine Service', 'NOAA'],
    unit: '°C anomalia',
  },
  pollution: {
    label: 'Poluição marinha',
    sources: ['Ocean Conservancy', 'NOAA Marine Debris'],
    unit: 'partículas/km²',
  },
  fishing: {
    label: 'Pesca industrial',
    sources: ['Global Fishing Watch', 'FAO'],
    unit: 'horas de pesca',
  },
  acidification: {
    label: 'Acidificação',
    sources: ['NOAA PMEL', 'Copernicus'],
    unit: 'pH',
  },
};

export function resetOceanAccumulation(): void {
  temporalAccumulation = 0;
}

export function getOceanDataStatus(): { isLive: boolean; sources: OceanData['sources'] | null } {
  return {
    isLive: cachedApiData !== null,
    sources: cachedApiData?.sources || null,
  };
}
