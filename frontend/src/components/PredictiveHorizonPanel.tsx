import React from 'react';
import type { PredictionResponse, HorizonPrediction } from '../types/telemetry';
import { ShieldAlert, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface PredictiveHorizonPanelProps {
  prediction: PredictionResponse | null;
}

export const PredictiveHorizonPanel: React.FC<PredictiveHorizonPanelProps> = ({ prediction }) => {
  if (!prediction) {
    return <div className="panel">Awaiting predictive inference...</div>;
  }

  const horizons = [
    { key: '5', title: 'T+5 MIN HORIZON', desc: 'Tactical bufferbloat & microburst drop cliff' },
    { key: '15', title: 'T+15 MIN (PRIMARY)', desc: 'Operationally optimal for dynamic traffic engineering' },
    { key: '30', title: 'T+30 MIN HORIZON', desc: 'Strategic cascade, BGP instability & resource exhaustion' },
  ];

  const renderHorizonCard = (hKey: string, title: string, desc: string) => {
    const hData: HorizonPrediction | undefined = prediction.horizons[hKey];
    if (!hData) return null;

    const probPct = (hData.calibrated_probability * 100).toFixed(1);
    const isCritical = hData.risk_level === 'CRITICAL';
    const isElevated = hData.risk_level === 'ELEVATED';

    const cardBorder = isCritical
      ? '1.5px solid var(--chili)'
      : isElevated
      ? '1.5px solid var(--amber)'
      : '1px solid var(--line)';

    const icon = isCritical ? (
      <ShieldAlert size={20} color="var(--chili)" />
    ) : isElevated ? (
      <AlertCircle size={20} color="var(--amber)" />
    ) : (
      <CheckCircle2 size={20} color="var(--lentil)" />
    );

    const badgeClass = isCritical ? 'badge-critical' : isElevated ? 'badge-elevated' : 'badge-low';

    return (
      <div
        key={hKey}
        style={{
          background: 'var(--card)',
          border: cardBorder,
          boxShadow: isCritical ? 'var(--shadow-tactile)' : 'var(--shadow-tactile-sm)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>{title}</span>
            <span className={badgeClass}>{hData.risk_level}</span>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--grey)', margin: '0 0 16px 0', minHeight: '30px' }}>{desc}</p>

          {/* Probability Gauge Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700 }}>CALIBRATED FAILURE RISK:</span>
              <span className="font-mono font-display" style={{ fontSize: '22px', fontWeight: 800 }}>
                {probPct}%
              </span>
            </div>
            <div style={{ height: '8px', background: '#E8E2D2', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(3, parseFloat(probPct)))}%`,
                  background: isCritical ? 'var(--chili)' : isElevated ? 'var(--amber)' : 'var(--lentil)',
                  transition: 'width 0.4s var(--ease)',
                }}
              />
            </div>
          </div>

          {/* Conformal Prediction Intervals */}
          <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '10px 12px', borderRadius: '3px', marginBottom: '14px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--grey)' }}>Forecasted RTT:</span>
              <span className="font-mono" style={{ fontWeight: 700 }}>{hData.predicted_rtt_ms.toFixed(1)} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--grey)' }}>90% Conformal Interval:</span>
              <span className="font-mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                [{hData.conformal_lower_bound_rtt.toFixed(1)} - {hData.conformal_upper_bound_rtt.toFixed(1)} ms]
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--grey)' }}>Forecasted Packet Loss:</span>
              <span className="font-mono" style={{ fontWeight: 700 }}>{hData.predicted_packet_loss_pct.toFixed(2)} %</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
          {icon}
          <span style={{ fontWeight: 600 }}>Raw Score: {(hData.failure_risk_score * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <section id="horizons" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">2</div>
          <span className="panel-title">MULTI-HORIZON PREDICTIVE RISK ENGINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <Clock size={15} />
          <span>PREDICTION ID: <span className="font-mono" style={{ fontWeight: 700 }}>{prediction.prediction_id}</span></span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '20px' }}>
        {horizons.map((h) => renderHorizonCard(h.key, h.title, h.desc))}
      </div>

      {/* Operator Recommended Action Banner */}
      <div
        style={{
          background: prediction.primary_horizon.risk_level === 'CRITICAL' ? 'var(--danger-bg)' : '#FFFDF8',
          border: prediction.primary_horizon.risk_level === 'CRITICAL' ? '2px solid var(--chili)' : '1px solid var(--line)',
          padding: '16px 20px',
          borderRadius: '3px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', color: 'var(--chili)' }}>
            ACTIONABLE MITIGATION RECOMMENDATION:
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
            {prediction.recommended_action}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {prediction.primary_drivers.map((d, i) => (
            <span key={i} style={{ background: '#FFF', border: '1px solid var(--line)', padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '3px' }}>
              • {d}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
