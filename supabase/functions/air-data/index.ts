const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AirDataResponse {
  co2: number;
  particulates: number;
  methane: number;
  ozone: number;
  timestamp: number;
  sources: {
    co2: string;
    particulates: string;
    methane: string;
    ozone: string;
  };
}

// Cache to avoid hammering public APIs
let cache: { data: AirDataResponse; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── NOAA GML: CO2 from Mauna Loa weekly data ───
// Direct text file, no auth needed
// https://gml.noaa.gov/ccgg/trends/data.html
async function fetchCO2(): Promise<{ value: number; source: string }> {
  try {
    const url = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_weekly_mlo.csv';
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'ErosaoDigital/1.0 (art installation; environmental data)' }
    });
    
    if (!res.ok) throw new Error(`NOAA CO2 HTTP ${res.status}`);
    const text = await res.text();
    
    // CSV format: year,month,day,decimal,ppm,ndays,1_year_ago,10_years_ago,increase_since_1800
    const lines = text.trim().split('\n').filter(l => !l.startsWith('#') && l.trim());
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(',');
    const ppm = parseFloat(parts[4]); // column 5 = ppm
    
    if (isNaN(ppm) || ppm < 300 || ppm > 600) throw new Error(`Invalid CO2 ppm: ${ppm}`);
    
    // Normalize: pre-industrial 280 ppm → dangerous 450+ ppm
    const normalized = Math.min(1, (ppm - 280) / (450 - 280));
    console.log(`NOAA CO2: ${ppm} ppm → ${normalized.toFixed(3)}`);
    return { value: normalized, source: `NOAA GML Mauna Loa (${ppm.toFixed(1)} ppm)` };
  } catch (err) {
    console.warn('NOAA CO2 fetch failed, using fallback:', err);
    return { value: 0.85, source: 'Fallback (NOAA GML avg)' };
  }
}

// ─── NOAA GML: Methane (CH4) from global monthly data ───
// https://gml.noaa.gov/ccgg/trends_ch4/
async function fetchMethane(): Promise<{ value: number; source: string }> {
  try {
    const url = 'https://gml.noaa.gov/aftp/products/trends/ch4/ch4_mm_gl.txt';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ErosaoDigital/1.0 (art installation; environmental data)' }
    });
    
    if (!res.ok) throw new Error(`NOAA CH4 HTTP ${res.status}`);
    const text = await res.text();
    
    // TXT format: space-separated, lines starting with # are comments
    const lines = text.trim().split('\n').filter(l => !l.startsWith('#') && l.trim());
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.trim().split(/\s+/);
    const ppb = parseFloat(parts[3]); // mean column
    
    if (isNaN(ppb) || ppb < 1000 || ppb > 3000) throw new Error(`Invalid CH4 ppb: ${ppb}`);
    
    // Normalize: pre-industrial 722 ppb → concern threshold 2000 ppb
    const normalized = Math.min(1, (ppb - 722) / (2000 - 722));
    console.log(`NOAA CH4: ${ppb} ppb → ${normalized.toFixed(3)}`);
    return { value: normalized, source: `NOAA GML Global (${ppb.toFixed(0)} ppb)` };
  } catch (err) {
    console.warn('NOAA CH4 fetch failed, using fallback:', err);
    return { value: 0.94, source: 'Fallback (NOAA GML avg)' };
  }
}

// ─── WAQI (World Air Quality Index): PM2.5 from global stations ───
// https://waqi.info/ — free public feed
async function fetchParticulates(): Promise<{ value: number; source: string }> {
  try {
    // Use WAQI public feed — major cities for a global average
    const cities = ['beijing', 'delhi', 'london', 'losangeles', 'saopaulo'];
    const values: number[] = [];
    
    for (const city of cities) {
      try {
        const res = await fetch(`https://api.waqi.info/feed/${city}/?token=demo`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && json.data?.iaqi?.pm25?.v != null) {
            values.push(json.data.iaqi.pm25.v);
          }
        }
      } catch { /* skip city */ }
    }
    
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      // WHO guideline: 5 µg/m³, hazardous: 150+ µg/m³
      const normalized = Math.min(1, avg / 200);
      console.log(`WAQI PM2.5: ${avg.toFixed(1)} µg/m³ (${values.length} cities) → ${normalized.toFixed(3)}`);
      return { value: normalized, source: `WAQI (${avg.toFixed(1)} µg/m³, ${values.length} cidades)` };
    }
    
    throw new Error('No PM2.5 data from WAQI');
  } catch (err) {
    console.warn('WAQI PM2.5 fetch failed, using seasonal estimate:', err);
    const month = new Date().getMonth();
    const seasonal = 0.55 + Math.sin((month / 12) * Math.PI * 2 + Math.PI) * 0.08;
    return { value: Math.min(1, seasonal), source: 'Estimativa sazonal (Copernicus CAMS avg)' };
  }
}

// ─── NASA/NOAA: Ozone from NOAA data ───
// Uses NOAA Solar Radiation ozone data
async function fetchOzoneDepletion(): Promise<{ value: number; source: string }> {
  try {
    // NOAA provides total column ozone data
    // Fallback to seasonal model based on real ozone hole behavior
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Antarctic ozone hole peaks September-October (day ~270)
    // Based on real NASA Ozone Watch data patterns
    const seasonalPeak = Math.exp(-Math.pow((dayOfYear - 270) / 45, 2));
    
    // Base depletion ~6% globally, up to ~50% over Antarctica in peak
    const baseDepletion = 0.30;
    const peakContribution = seasonalPeak * 0.35;
    const value = baseDepletion + peakContribution;
    
    // Try fetching real-time from NASA Ozone Watch
    const ozoneUrl = 'https://ozonewatch.gsfc.nasa.gov/meteorology/SH.csv';
    const res = await fetch(ozoneUrl, {
      headers: { 'User-Agent': 'ErosaoDigital/1.0' }
    });
    
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n').filter(l => !l.startsWith('#') && l.trim());
      if (lines.length > 1) {
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.split(',');
        // Try to extract ozone column value (Dobson Units)
        // Normal: ~300 DU, depleted: ~100-200 DU over hole
        for (const part of parts) {
          const du = parseFloat(part.trim());
          if (!isNaN(du) && du > 50 && du < 500) {
            const ozoneNorm = Math.min(1, Math.max(0, 1 - (du / 350)));
            console.log(`NASA Ozone Watch: ${du} DU → ${ozoneNorm.toFixed(3)}`);
            return { value: ozoneNorm, source: `NASA Ozone Watch (${du.toFixed(0)} DU)` };
          }
        }
      }
    }
    
    console.log(`Ozone seasonal model: day ${dayOfYear} → ${value.toFixed(3)}`);
    return { value, source: `Modelo sazonal (NASA/NOAA, dia ${dayOfYear})` };
  } catch (err) {
    console.warn('Ozone fetch failed:', err);
    return { value: 0.38, source: 'Fallback (NOAA/NASA avg)' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cached data if still fresh
    if (cache && (Date.now() - cache.fetchedAt) < CACHE_TTL) {
      console.log('Returning cached air data');
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [co2Result, methaneResult, pmResult, ozoneResult] = await Promise.all([
      fetchCO2(),
      fetchMethane(),
      fetchParticulates(),
      fetchOzoneDepletion(),
    ]);

    const responseData: AirDataResponse = {
      co2: co2Result.value,
      particulates: pmResult.value,
      methane: methaneResult.value,
      ozone: ozoneResult.value,
      timestamp: Date.now(),
      sources: {
        co2: co2Result.source,
        particulates: pmResult.source,
        methane: methaneResult.source,
        ozone: ozoneResult.source,
      },
    };

    cache = { data: responseData, fetchedAt: Date.now() };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Air data fetch error:', error);

    const fallbackData: AirDataResponse = {
      co2: 0.85,
      particulates: 0.55,
      methane: 0.94,
      ozone: 0.38,
      timestamp: Date.now(),
      sources: {
        co2: 'Fallback (NOAA GML average)',
        particulates: 'Fallback (Copernicus CAMS average)',
        methane: 'Fallback (NOAA GML average)',
        ozone: 'Fallback (NASA/NOAA average)',
      },
    };

    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
