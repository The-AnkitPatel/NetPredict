import React from 'react';
import type { PredictionResponse } from '../types/telemetry';
import { AlertOctagon, TrendingUp, Info } from 'lucide-react';

interface AnomalyVsPredictionCardProps {
  prediction: PredictionResponse | null;
}

export const AnomalyVsPredictionCard: React.FC<AnomalyVsPredictionCardProps> = ({ prediction }) => {
  if (!prediction) return null;

  const anomScore = prediction.current_anomaly_score;
  const isAnom = prediction.is_current_anomaly;
  const futureRisk = prediction.primary_horizon.calibrated_probability;
  const isFutureRiskHigh = futureRisk >= 0.35;

  // Determine state matrix scenario
  let scenarioTitle = '';
  let scenarioExplanation = '';

  if (isAnom && !isFutureRiskHigh) {
    scenarioTitle = 'Transient Anomaly (Absorbed)';
    scenarioExplanation =
      'Current telemetry shows anomalous deviations (e.g. temporary microburst), but buffers and delay gradients confirm it will stabilize without triggering packet drops at T+15m.';
  } else if (!isAnom && isFutureRiskHigh) {
    scenarioTitle = 'Slow-Burn Bufferbloat Cliff (Impending)';
    scenarioExplanation =
      'Current telemetry appears normal on surface counters, but subtle rising queue slopes and delay gradients forecast a severe buffer overflow cliff within 15 minutes!';
  } else if (isAnom && isFutureRiskHigh) {
    scenarioTitle = 'Active Degradation & Cascade Collapse';
    scenarioExplanation =
      'The network is currently anomalous and continuing to degrade. Buffer capacity is exhausted and severe packet drops are imminent across redundant links.';
  } else {
    scenarioTitle = 'Nominal Steady State';
    scenarioExplanation =
      'Both current telemetry distributions and future predictive models confirm standard, stable operating parameters with ample headroom.';
  }

  return (
    <section id="anomaly_vs_pred" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">3</div>
          <span className="panel-title">CONCEPTUAL DECOUPLING: ANOMALY NOW VS. FUTURE RISK</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--grey)' }}>
          DECISION MATRIX INTELLIGENCE
        </span>
      </div>

      <div className="grid-2" style={{ marginBottom: '18px' }}>
        {/* Left: What is abnormal NOW? */}
        <div style={{ background: '#FFFDF8', border: '1.5px solid var(--line)', padding: '18px 20px', borderRadius: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>
              WHAT IS ABNORMAL NOW?
            </span>
            <AlertOctagon size={18} color={isAnom ? 'var(--chili)' : 'var(--lentil)'} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--grey)', marginBottom: '12px' }}>
            Unsupervised Isolation Forest & Robust Mahalanobis distance
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span className="font-mono font-display" style={{ fontSize: '28px', fontWeight: 800 }}>
              {(anomScore * 100).toFixed(1)}%
            </span>
            <span className={isAnom ? 'badge-critical' : 'badge-low'}>
              {isAnom ? 'ANOMALOUS NOW' : 'STATE NORMAL'}
            </span>
          </div>

          <p style={{ fontSize: '12px', margin: 0, fontWeight: 600 }}>
            {prediction.anomaly_status}
          </p>
        </div>

        {/* Right: What will fail NEXT? */}
        <div style={{ background: '#FFFDF8', border: '1.5px solid var(--line)', padding: '18px 20px', borderRadius: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>
              WHAT WILL FAIL NEXT? (T+15m)
            </span>
            <TrendingUp size={18} color={isFutureRiskHigh ? 'var(--chili)' : 'var(--lentil)'} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--grey)', marginBottom: '12px' }}>
            Supervised Multi-Horizon Calibrated Random Forest
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span className="font-mono font-display" style={{ fontSize: '28px', fontWeight: 800 }}>
              {(futureRisk * 100).toFixed(1)}%
            </span>
            <span className={prediction.primary_horizon.risk_level === 'CRITICAL' ? 'badge-critical' : prediction.primary_horizon.risk_level === 'ELEVATED' ? 'badge-elevated' : 'badge-low'}>
              {prediction.primary_horizon.risk_level} RISK
            </span>
          </div>

          <p style={{ fontSize: '12px', margin: 0, fontWeight: 600 }}>
            Lead warning window: 15 minutes before packet drop cliff.
          </p>
        </div>
      </div>

      {/* Synthesis Box */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '14px 18px', borderRadius: '3px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Info size={20} color="var(--ink)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>
            OPERATIONAL SYNTHESIS: {scenarioTitle.toUpperCase()}
          </span>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            {scenarioExplanation}
          </p>
        </div>
      </div>
    </section>
  );
};
