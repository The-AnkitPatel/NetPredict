export interface RawTelemetryRecord {
  timestamp: string;
  device_id: string;
  interface_id: string;
  bandwidth_util_pct: number;
  throughput_mbps: number;
  rtt_ms: number;
  rtt_jitter_ms: number;
  queue_occupancy_pct: number;
  packet_loss_pct: number;
  tcp_retrans_rate: number;
  interface_discards_sec: number;
  crc_errors_sec: number;
  cpu_util_pct: number;
  memory_util_pct: number;
  bgp_flap_count: number;
}

export type RiskLevel = 'LOW' | 'ELEVATED' | 'CRITICAL';

export interface HorizonPrediction {
  horizon_minutes: number;
  failure_risk_score: number;
  calibrated_probability: number;
  risk_level: RiskLevel;
  predicted_rtt_ms: number;
  predicted_packet_loss_pct: number;
  conformal_lower_bound_rtt: number;
  conformal_upper_bound_rtt: number;
}

export interface PredictionResponse {
  prediction_id: string;
  timestamp: string;
  device_id: string;
  interface_id: string;
  current_anomaly_score: number;
  is_current_anomaly: boolean;
  anomaly_status: string;
  horizons: Record<string, HorizonPrediction>;
  primary_horizon: HorizonPrediction;
  recommended_action: string;
  primary_drivers: string[];
}

export interface FeatureAttribution {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  contribution_pct: number;
  impact_direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  diagnostic_description: string;
}

export interface ShapExplanationResponse {
  prediction_id: string;
  horizon_minutes: number;
  base_value: number;
  predicted_risk: number;
  calibrated_risk: number;
  top_risk_drivers: FeatureAttribution[];
  top_protective_factors: FeatureAttribution[];
  all_attributions: FeatureAttribution[];
  operator_summary: string;
}

export interface SimulationScenarioRequest {
  device_id: string;
  interface_id: string;
  horizon_minutes: number;
  reroute_traffic_pct: number;
  ingress_rate_limit_pct: number;
  buffer_expansion_factor: number;
  enable_priority_queuing: boolean;
}

export interface SimulationResponse {
  scenario_id: string;
  device_id: string;
  interface_id: string;
  horizon_minutes: number;
  baseline_risk: number;
  counterfactual_risk: number;
  risk_delta_pct: number;
  baseline_rtt_ms: number;
  counterfactual_rtt_ms: number;
  baseline_queue_pct: number;
  counterfactual_queue_pct: number;
  verdict: 'OPTIMAL' | 'EFFECTIVE' | 'MARGINAL' | 'STABLE' | 'INEFFECTIVE';
  operator_guidance: string;
  counterfactual_explanation: string;
}

export interface HistoricalIncident {
  incident_id: string;
  timestamp: string;
  device_id: string;
  interface_id: string;
  failure_type: string;
  predicted_risk: number;
  actual_outcome: string;
  lead_time_minutes: number;
  was_prevented: boolean | null;
  root_cause_driver: string;
}

export interface ModelHealthData {
  model_type: string;
  evaluation_metrics: {
    pr_auc: number;
    roc_auc: number;
    brier_score: number;
    f1_score: number;
    precision: number;
    recall: number;
    false_negative_rate: number;
  };
  calibration_curve: {
    bin_predicted_probs: number[];
    bin_true_fractions: number[];
  };
  drift_monitoring: {
    queue_occupancy_psi: number;
    rtt_psi: number;
    status: string;
  };
  baseline_comparison: Record<string, any>;
}
