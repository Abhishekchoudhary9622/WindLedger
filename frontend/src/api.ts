const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────

export interface DecisionPoint {
  startTime: string;
  forecastMW: number;
  actualMW: number | null;
  errorMW: number | null;
  publishTime: string;
  horizonHours: number;
  bandP10: number | null;
  bandP90: number | null;
  conservativeMW: number | null;
}

export interface DecisionSummary {
  peakMW: number;
  troughMW: number;
  meanMW: number;
  totalMWh: number;
  avgHorizonHours: number;
  forecastCount: number;
}

export interface DecisionResponse {
  deliveryDate: string;
  cutoff: string;
  points: DecisionPoint[];
  summary: DecisionSummary | null;
}

export interface AccuracySummary {
  mae: number;
  rmse: number;
  bias: number;
  nmaePct: number;
  mapePct?: number;
  correlation?: number;
  totalActualGWh?: number;
  completenessPct?: number;
  p50Error: number;
  p90Error: number;
  p95Error: number;
  matchedPeriods: number;
  totalPeriods: number;
  meanActual: number;
}

export interface HorizonBucket {
  bucket: string;
  mae: number;
  rmse: number;
  bias: number;
  count: number;
}

export interface DailyAccuracy {
  date: string;
  mae: number;
  rmse: number;
  bias: number;
  count: number;
}

export interface HourlyAccuracy {
  hour: number;
  mae: number;
  rmse: number;
  bias: number;
  count: number;
}

export interface ErrorDistribution {
  bins: number[];
  counts: number[];
  p50: number;
  p90: number;
  p95: number;
  largestUnder: number;
  largestOver: number;
  pctAbove1GW: number;
}

export interface HeatmapCell {
  date: string;
  hour: number;
  mae: number;
}

export interface EvolutionVersion {
  publishTime: string;
  forecastMW: number;
  horizonHours: number;
  isSelected: boolean;
}

export interface EvolutionResponse {
  targetTime: string;
  actualMW: number | null;
  versions: EvolutionVersion[];
}

export interface MetaResponse {
  availableDates: string[];
  defaultCutoff: string;
  dataRange: {
    forecastFrom: string | null;
    forecastTo: string | null;
    actualFrom: string | null;
    actualTo: string | null;
  };
  forecastCount: number;
  actualCount: number;
}

// ── API Functions ──────────────────────────────────────────────────────

export const fetchMeta = () => apiFetch<MetaResponse>('/api/meta');

export const fetchDecision = (date: string, cutoff: string) =>
  apiFetch<DecisionResponse>('/api/decision', { date, cutoff });

export const fetchEvolution = (target: string, cutoff: string) =>
  apiFetch<EvolutionResponse>('/api/evolution', { target, cutoff });

export const fetchAccuracySummary = (from: string, to: string, cutoff: string) =>
  apiFetch<AccuracySummary>('/api/accuracy/summary', { from, to, cutoff });

export const fetchHorizonAccuracy = (from: string, to: string, cutoff: string) =>
  apiFetch<HorizonBucket[]>('/api/accuracy/horizon', { from, to, cutoff });

export const fetchDailyAccuracy = (from: string, to: string, cutoff: string) =>
  apiFetch<DailyAccuracy[]>('/api/accuracy/timeseries', { from, to, cutoff });

export const fetchHourlyAccuracy = (from: string, to: string, cutoff: string) =>
  apiFetch<HourlyAccuracy[]>('/api/accuracy/hourly', { from, to, cutoff });

export const fetchErrorDistribution = (from: string, to: string, cutoff: string) =>
  apiFetch<ErrorDistribution>('/api/accuracy/distribution', { from, to, cutoff });

export const fetchHeatmap = (from: string, to: string, cutoff: string) =>
  apiFetch<HeatmapCell[]>('/api/accuracy/heatmap', { from, to, cutoff });
