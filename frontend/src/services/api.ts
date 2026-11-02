import type {
  RawTelemetryRecord, PredictionResponse, ShapExplanationResponse,
  SimulationScenarioRequest, SimulationResponse, HistoricalIncident, ModelHealthData,
} from '../types/telemetry';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
let backendConnected = false;
export const isBackendOnline = () => backendConnected;

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || `Request failed (${response.status})`);
    }
    const data = await response.json();
    backendConnected = true;
    return data;
  } catch (error) {
    backendConnected = false;
    throw error;
  }
}

type StreamResponse = { record: RawTelemetryRecord; prediction: PredictionResponse; progress: unknown };
export interface LiveCounters {
  source: string;
  timestamp: string;
  interfaces: { interface_id: string; throughput_mbps: number | null; bandwidth_util_pct: number | null }[];
  note: string;
}

export const api = {
  getLatestTelemetry: () => fetchJson<{ telemetry: RawTelemetryRecord; anomaly: { is_anomaly: boolean; anomaly_score: number; status: string } }>('/telemetry/latest'),
  getTelemetryHistory: (limit = 60) => fetchJson<RawTelemetryRecord[]>(`/telemetry/history?limit=${limit}`),
  stepStream: () => fetchJson<StreamResponse>('/telemetry/stream/step', { method: 'POST' }),
  jumpToIncident: () => fetchJson<StreamResponse>('/telemetry/stream/jump-incident', { method: 'POST' }),
  resetStream: () => fetchJson<StreamResponse>('/telemetry/stream/reset', { method: 'POST' }),
  pollLiveInterface: () => fetchJson<LiveCounters>('/telemetry/live-poll', { method: 'POST' }),
  getMultiHorizonPredictions: () => fetchJson<PredictionResponse>('/predict/horizons'),
  getHistoricalIncidents: () => fetchJson<HistoricalIncident[]>('/predict/incidents'),
  getLatestExplanation: () => fetchJson<ShapExplanationResponse>('/explain/latest'),
  getExplanationById: (id: string) => fetchJson<ShapExplanationResponse>(`/explain/${encodeURIComponent(id)}`),
  simulateScenario: (scenario: SimulationScenarioRequest) => fetchJson<SimulationResponse>('/simulate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scenario),
  }),
  prescribeOptimalScenario: () => fetchJson<{ status: string; recommended_scenario: SimulationScenarioRequest; simulation: SimulationResponse; rationale: string }>('/simulate/prescribe', { method: 'POST' }),
  getModelHealth: () => fetchJson<ModelHealthData>('/health/model'),
};
