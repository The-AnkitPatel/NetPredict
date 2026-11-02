import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ModelHealthData } from '../types/telemetry';
import { ShieldCheck } from 'lucide-react';

export const ModelHealthPanel: React.FC = () => {
  const [healthData, setHealthData] = useState<ModelHealthData | null>(null);

  useEffect(() => {
    api.getModelHealth().then(setHealthData).catch(console.error);
  }, []);

  if (!healthData) {
    return <div className="panel">Loading model health and calibration curves...</div>;
  }

  const m = healthData.evaluation_metrics;
  const calib = healthData.calibration_curve;
  const drift = healthData.drift_monitoring;

  return (
    <section id="health" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">6</div>
          <span className="panel-title">MODEL HEALTH, CALIBRATION & DRIFT MONITOR</span>
        </div>
        <span className="badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={14} /> DRIFT STATUS: {drift.status}
        </span>
      </div>

      <div className="grid-2" style={{ gap: '24px', marginBottom: '20px' }}>
        {/* Left: Calibration Reliability Diagram */}
        <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: 800 }}>
            <span>PROBABILITY CALIBRATION CURVE (RELIABILITY DIAGRAM)</span>
            <span style={{ fontSize: '11px', color: 'var(--grey)' }}>Brier Score: {m.brier_score}</span>
          </div>

          <svg width="100%" height="150" viewBox="0 0 200 150" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {/* Ideal diagonal calibration reference line */}
            <line x1="20" y1="130" x2="180" y2="20" stroke="var(--grey)" strokeWidth="1.2" strokeDasharray="3 3" />

            {/* Model calibration points */}
            {calib.bin_predicted_probs.length > 1 && (
              <polyline
                fill="none"
                stroke="var(--chili)"
                strokeWidth="2.4"
                points={calib.bin_predicted_probs
                  .map((p, i) => {
                    const x = 20 + p * 160;
                    const y = 130 - (calib.bin_true_fractions[i] || 0) * 110;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Axes */}
            <line x1="20" y1="130" x2="180" y2="130" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1="20" y1="20" x2="20" y2="130" stroke="var(--ink)" strokeWidth="1.2" />
            <text x="20" y="145" fontSize="8" fill="var(--grey)">0.0</text>
            <text x="175" y="145" fontSize="8" fill="var(--grey)">1.0</text>
            <text x="100" y="145" fontSize="8" fill="var(--grey)" textAnchor="middle">Mean Predicted Risk</text>
          </svg>

          <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '6px', textAlign: 'center' }}>
            Dashed line = Perfectly calibrated probabilities. Solid red = NetPredict calibrated random forest.
          </div>
        </div>

        {/* Right: Operational Metrics Matrix */}
        <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '3px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '14px' }}>
            OUT-OF-SAMPLE VALIDATION BENCHMARKS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--card)', padding: '10px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>PR-AUC (PRECISION-RECALL)</div>
              <div className="font-mono font-display" style={{ fontSize: '20px', marginTop: '2px' }}>{m.pr_auc}</div>
            </div>

            <div style={{ background: 'var(--card)', padding: '10px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>ROC-AUC</div>
              <div className="font-mono font-display" style={{ fontSize: '20px', marginTop: '2px' }}>{m.roc_auc}</div>
            </div>

            <div style={{ background: 'var(--card)', padding: '10px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>F1-SCORE</div>
              <div className="font-mono font-display" style={{ fontSize: '20px', marginTop: '2px' }}>{m.f1_score}</div>
            </div>

            <div style={{ background: 'var(--card)', padding: '10px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>FALSE NEGATIVE RATE</div>
              <div className="font-mono font-display" style={{ fontSize: '20px', marginTop: '2px', color: 'var(--lentil)' }}>
                {(m.false_negative_rate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--grey)' }}>
            Population Stability Index (PSI): Queue {drift.queue_occupancy_psi} | RTT {drift.rtt_psi} (Threshold &lt; 0.10: Stable).
          </div>
        </div>
      </div>

      {/* Baseline Models Comparison Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--ink)', color: '#FFF' }}>
              <th style={{ padding: '8px 12px' }}>MODEL ARCHITECTURE</th>
              <th style={{ padding: '8px 12px' }}>PR-AUC</th>
              <th style={{ padding: '8px 12px' }}>ROC-AUC</th>
              <th style={{ padding: '8px 12px' }}>BRIER SCORE</th>
              <th style={{ padding: '8px 12px' }}>F1-SCORE</th>
              <th style={{ padding: '8px 12px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--line)', background: '#FFFDF8', fontWeight: 700 }}>
              <td style={{ padding: '8px 12px' }}>Random Forest (Isotonic Calibrated)</td>
              <td style={{ padding: '8px 12px' }} className="font-mono">{m.pr_auc}</td>
              <td style={{ padding: '8px 12px' }} className="font-mono">{m.roc_auc}</td>
              <td style={{ padding: '8px 12px', color: 'var(--lentil)' }} className="font-mono">{m.brier_score}</td>
              <td style={{ padding: '8px 12px' }} className="font-mono">{m.f1_score}</td>
              <td style={{ padding: '8px 12px' }}><span className="badge-low">DEPLOYED</span></td>
            </tr>
            {[
              ['logistic_regression', 'Logistic Regression Baseline'],
              ['moving_average_threshold', '5m Moving Average Threshold'],
              ['naive_persistence', 'Naive Persistence Baseline'],
            ].map(([key, label]) => {
              const metrics = healthData.baseline_comparison[key];
              return <tr key={key} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '8px 12px' }}>{label}</td>
                <td style={{ padding: '8px 12px' }} className="font-mono">{metrics?.pr_auc ?? '—'}</td>
                <td style={{ padding: '8px 12px' }} className="font-mono">{metrics?.roc_auc ?? '—'}</td>
                <td style={{ padding: '8px 12px' }} className="font-mono">{metrics?.brier_score ?? '—'}</td>
                <td style={{ padding: '8px 12px' }} className="font-mono">{metrics?.f1_score ?? '—'}</td>
                <td style={{ padding: '8px 12px', color: 'var(--grey)' }}>BASELINE</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
