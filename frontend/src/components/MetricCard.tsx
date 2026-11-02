import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  subtitle?: string;
  status?: 'normal' | 'elevated' | 'critical';
  historyValues?: number[];
  threshold?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  status = 'normal',
  historyValues = [],
  threshold,
}) => {
  // Generate mini SVG sparkline
  const renderSparkline = () => {
    if (!historyValues || historyValues.length < 2) return null;
    const min = Math.min(...historyValues);
    const max = Math.max(...historyValues);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = historyValues
      .map((v, idx) => {
        const x = (idx / (historyValues.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor =
      status === 'critical' ? 'var(--chili)' : status === 'elevated' ? 'var(--amber)' : 'var(--lentil)';

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const statusBorder =
    status === 'critical'
      ? '2px solid var(--chili)'
      : status === 'elevated'
      ? '1.5px solid var(--amber)'
      : '1px solid var(--line)';

  return (
    <div
      style={{
        background: 'var(--card)',
        border: statusBorder,
        boxShadow: 'var(--shadow-tactile-sm)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s var(--ease)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', color: 'var(--grey)' }}>
          {title.toUpperCase()}
        </span>
        {renderSparkline()}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span className="font-mono font-display" style={{ fontSize: '24px', fontWeight: 800 }}>
          {value}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--grey)' }}>{unit}</span>
      </div>

      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span style={{ color: 'var(--grey)' }}>{subtitle || 'Rolling interval'}</span>
        {threshold && <span className="font-mono" style={{ color: 'var(--grey)' }}>{threshold}</span>}
      </div>
    </div>
  );
};
