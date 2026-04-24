 // Environmental data service - simulates real API data
 // Fetches real data from Global Forest Watch, FAO, and FAOSTAT via edge function
 
 import { supabase } from "@/integrations/supabase/client";
 
 export interface EnvironmentalData {
   deforestation: number; // 0-1 normalized
   meatConsumption: number; // 0-1 normalized
   woodExtraction: number; // 0-1 normalized
   timestamp: number;
   sources?: {
     deforestation: string;
     meatConsumption: string;
     woodExtraction: string;
   };
 }
 
 export interface HumanLayerData {
   meatFrequency: number; // 0-1
   woodAwareness: number; // 0-1
   recyclingHabits: number; // 0-1
   deforestationPerception: number; // 0-1
 }
 
 // Cached data from API
 let cachedApiData: EnvironmentalData | null = null;
 let lastFetchTime = 0;
 const CACHE_DURATION = 60000; // 1 minute cache
 
 // Fallback simulated global data with realistic temporal variation
 const fallbackData = {
   // Annual deforestation rate normalized (Brazil loses ~1.1M hectares/year)
   deforestation: 0.42,
   // Global meat consumption per capita normalized
   meatConsumption: 0.55,
   // Global wood extraction normalized
   woodExtraction: 0.38,
 };
 
 // Gradual temporal accumulation factor
 let temporalAccumulation = 0;
 const ACCUMULATION_RATE = 0.00001; // Very slow degradation over time
 
 // Fetch real data from edge function
 export async function fetchRealEnvironmentalData(): Promise<EnvironmentalData | null> {
   const now = Date.now();
   
   // Return cached data if still valid
   if (cachedApiData && (now - lastFetchTime) < CACHE_DURATION) {
     return cachedApiData;
   }
   
   try {
     const { data, error } = await supabase.functions.invoke('environmental-data');
     
     if (error) {
       console.warn('Edge function error:', error);
       return null;
     }
     
     if (data) {
       cachedApiData = data as EnvironmentalData;
       lastFetchTime = now;
       console.log('Environmental data fetched:', data.sources);
       return cachedApiData;
     }
   } catch (err) {
     console.warn('Failed to fetch environmental data:', err);
   }
   
   return null;
 }
 
 // Get environmental data with temporal variation applied
 export function getEnvironmentalData(apiData?: EnvironmentalData | null): EnvironmentalData {
   // Use API data as base if available, otherwise fallback
   const baseData = apiData || fallbackData;
   
   // Add subtle temporal variation (like breathing)
   const now = Date.now();
   const breathCycle = Math.sin(now / 8000) * 0.02;
   const driftCycle = Math.sin(now / 20000) * 0.015;
   
   // Accumulate degradation over session time
   temporalAccumulation = Math.min(temporalAccumulation + ACCUMULATION_RATE, 0.3);
   
   return {
     deforestation: Math.min(1, baseData.deforestation + breathCycle + temporalAccumulation * 0.5),
     meatConsumption: Math.min(1, baseData.meatConsumption + driftCycle + temporalAccumulation * 0.3),
     woodExtraction: Math.min(1, baseData.woodExtraction + breathCycle * 0.5 + temporalAccumulation * 0.4),
     timestamp: now,
     sources: apiData?.sources,
   };
 }
 
 // Calculate visual parameters from data
 export interface VisualParameters {
   fragmentationIntensity: number; // From deforestation
   darknessLevel: number; // From meat consumption
   saturationLoss: number; // From meat consumption
   contrastReduction: number; // From wood extraction
   pixelationLevel: number; // From wood extraction
   overallDecay: number; // Cumulative effect
 }
 
 export function dataToVisualParams(
   data: EnvironmentalData,
   humanLayer?: HumanLayerData
 ): VisualParameters {
  let params: VisualParameters = {
    fragmentationIntensity: data.deforestation * 0.95,
    darknessLevel: data.meatConsumption * 0.8,
    saturationLoss: data.meatConsumption * 0.85,
    contrastReduction: data.woodExtraction * 0.7,
    pixelationLevel: data.woodExtraction * 0.6,
    overallDecay: (data.deforestation + data.meatConsumption + data.woodExtraction) / 2.5,
  };
   
        // Bidirectional human layer: Left (0) = More Noise/Decay, Right (1) = Less Noise/Clarity
      if (humanLayer) {
        const humanInfluence = (
          (0.5 - humanLayer.meatFrequency) +
          (0.5 - humanLayer.woodAwareness) +
          (0.5 - humanLayer.recyclingHabits) +
          (0.5 - humanLayer.deforestationPerception)
        ) * 0.25;

        const MAGNITUDE = 0.85; // Increased for better visibility of personalization
        params = {
          fragmentationIntensity: params.fragmentationIntensity + humanInfluence * MAGNITUDE,
          darknessLevel: params.darknessLevel + humanInfluence * MAGNITUDE * 0.8,
          saturationLoss: params.saturationLoss + humanInfluence * MAGNITUDE * 0.9,
          contrastReduction: params.contrastReduction + humanInfluence * MAGNITUDE * 0.7,
          pixelationLevel: params.pixelationLevel + humanInfluence * MAGNITUDE * 0.8,
          overallDecay: params.overallDecay + humanInfluence * MAGNITUDE,
        };
      }
   
   // Clamp all values to 0-1
   return {
     fragmentationIntensity: Math.min(1, Math.max(0, params.fragmentationIntensity)),
     darknessLevel: Math.min(1, Math.max(0, params.darknessLevel)),
     saturationLoss: Math.min(1, Math.max(0, params.saturationLoss)),
     contrastReduction: Math.min(1, Math.max(0, params.contrastReduction)),
     pixelationLevel: Math.min(1, Math.max(0, params.pixelationLevel)),
     overallDecay: Math.min(1, Math.max(0, params.overallDecay)),
   };
 }
 
 // Data source labels for display
 export const dataSources = {
   deforestation: {
     label: 'Desmatamento',
     sources: ['Global Forest Watch', 'INPE/PRODES'],
     unit: 'hectares/ano',
   },
   meatConsumption: {
     label: 'Consumo de carne',
     sources: ['FAO Food Balance Sheets'],
     unit: 'kg per capita',
   },
   woodExtraction: {
     label: 'Extração de madeira',
     sources: ['FAOSTAT Forestry Production'],
     unit: 'm³/ano',
   },
 };
 
 // Reset temporal accumulation (for testing or new sessions)
 export function resetTemporalAccumulation(): void {
   temporalAccumulation = 0;
 }
 
 // Get current data sources being used
 export function getDataSourceStatus(): { isLive: boolean; sources: EnvironmentalData['sources'] | null } {
   return {
     isLive: cachedApiData !== null,
     sources: cachedApiData?.sources || null,
   };
 }