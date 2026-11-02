import React from 'react';
import type { ShapExplanationResponse } from '../types/telemetry';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ShapWaterfallChartProps {
  explanation: ShapExplanationResponse | null;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({ explanation }) => {
  if (!explanation) {
    return <div className="panel">Calculating feature attributions...</div>;
  }

  const attributions = explanation.all_attributions || [];
  const maxAbsShap = Math.max(...attributions.map((a) => Math.abs(a.shap_value)), 0.01);

  return (
    <section id="shap" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">4</div>
          <span className="panel-title">ROOT-CAUSE EXPLAINABILITY (SHAPLEY)</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--grey)', fontWeight: 600 }}>
          HORIZON: T+15M | BASE VALUE: {explanation.base_value.toFixed(2)}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--grey)', margin: '0 0 16px 0' }}>
        Permutation Shapley estimates each feature contribution to the model probability.
        Positive values push toward impending failure; negative values represent stabilizing network headroom.
      </p>

      {/* Operator Natural Language Summary */}
      <div
        style={{
          background: '#FFFDF8',
          borderLeft: '4px solid var(--ink)',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '2px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.8px' }}>
          DIAGNOSTIC ROOT-CAUSE SUMMARY:
        </span>
        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--ink)' }}>
          {explanation.operator_summary}
        </div>
      </div>

      {/* Waterfall Attributions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {attributions.map((attr, idx) => {
          const isRisk = attr.impact_direction === 'INCREASES_RISK';
          const barWidth = Math.min(100, Math.max(5, (Math.abs(attr.shap_value) / maxAbsShap) * 100));

          return (
            <div
              key={idx}
              style={{
                background: '#FFF',
                border: '1px solid var(--line)',
                padding: '10px 14px',
                borderRadius: '3px',
                display: 'grid',
                gridTemplateColumns: '180px 1fr 140px',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              {/* Feature name and measured value */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{attr.feature_name}</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--grey)' }}>
                  Val: {attr.feature_value.toFixed(2)}
                </div>
              </div>

              {/* Visual Contribution Bar and Diagnostic Text */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '100%', height: '8px', background: '#F1ECE1', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: isRisk ? 'var(--chili)' : 'var(--lentil)',
                        marginLeft: isRisk ? '0' : 'auto',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink)' }}>
                  {attr.diagnostic_description}
                </div>
              </div>

              {/* SHAP value and Direction pill */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isRisk ? 'var(--chili-dark)' : 'var(--lentil-dark)',
                    background: isRisk ? 'var(--danger-bg)' : 'var(--success-bg)',
                    padding: '3px 8px',
                    borderRadius: '3px',
                  }}
                >
                  {isRisk ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {attr.shap_value > 0 ? `+${attr.shap_value.toFixed(3)}` : attr.shap_value.toFixed(3)} ({attr.contribution_pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
