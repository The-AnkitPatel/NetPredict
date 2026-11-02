import React from 'react';
import type { RawTelemetryRecord } from '../types/telemetry';
import { MetricCard } from './MetricCard';

interface TelemetryGridProps {
  current: RawTelemetryRecord | null;
  history: RawTelemetryRecord[];
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({ current, history }) => {
  if (!current) {
    return <div className="panel">Loading telemetry data...</div>;
  }

  // Extract history series for sparklines
  const rttSeries = history.slice(-20).map((h) => h.rtt_ms);
  const queueSeries = history.slice(-20).map((h) => h.queue_occupancy_pct);
  const lossSeries = history.slice(-20).map((h) => h.packet_loss_pct);
  const utilSeries = history.slice(-20).map((h) => h.bandwidth_util_pct);
  const discardsSeries = history.slice(-20).map((h) => h.interface_discards_sec);
  const cpuSeries = history.slice(-20).map((h) => h.cpu_util_pct);

  const getQueueStatus = (q: number) => (q >= 80 ? 'critical' : q >= 55 ? 'elevated' : 'normal');
  const getRttStatus = (rtt: number) => (rtt >= 55 ? 'critical' : rtt >= 30 ? 'elevated' : 'normal');
  const getLossStatus = (loss: number) => (loss >= 1.0 ? 'critical' : loss >= 0.1 ? 'elevated' : 'normal');

  return (
    <section id="telemetry" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">1</div>
          <span className="panel-title">LIVE TELEMETRY & DATA PLANE SIGNALS</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--grey)' }}>
          INTERFACE: <span className="font-mono" style={{ color: 'var(--ink)' }}>{current.device_id} / {current.interface_id}</span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Queue Occupancy (Bufferbloat)"
          value={current.queue_occupancy_pct.toFixed(1)}
          unit="%"
          subtitle="Hardware switch buffer"
          status={getQueueStatus(current.queue_occupancy_pct)}
          historyValues={queueSeries}
          threshold="Drop cliff: >80%"
        />

        <MetricCard
          title="Round-Trip Time (RTT)"
          value={current.rtt_ms.toFixed(1)}
          unit="ms"
          subtitle={`Jitter: ±${current.rtt_jitter_ms.toFixed(1)}ms`}
          status={getRttStatus(current.rtt_ms)}
          historyValues={rttSeries}
          threshold="Baseline: ~14ms"
        />

        <MetricCard
          title="Packet Loss Ratio"
          value={current.packet_loss_pct.toFixed(2)}
          unit="%"
          subtitle={`TCP Retrans: ${current.tcp_retrans_rate.toFixed(1)}/s`}
          status={getLossStatus(current.packet_loss_pct)}
          historyValues={lossSeries}
          threshold="SLA Target: <0.05%"
        />

        <MetricCard
          title="Bandwidth Utilization"
          value={current.bandwidth_util_pct.toFixed(1)}
          unit="%"
          subtitle={`Throughput: ${(current.throughput_mbps / 1000).toFixed(2)} Gbps`}
          status={current.bandwidth_util_pct >= 90 ? 'critical' : current.bandwidth_util_pct >= 75 ? 'elevated' : 'normal'}
          historyValues={utilSeries}
          threshold="Line Capacity: 10G"
        />

        <MetricCard
          title="Hardware Discards & CRC"
          value={current.interface_discards_sec.toFixed(1)}
          unit="drops/s"
          subtitle={`CRC Errors: ${current.crc_errors_sec.toFixed(1)}/s`}
          status={current.interface_discards_sec > 5 ? 'critical' : 'normal'}
          historyValues={discardsSeries}
          threshold="FIFO buffer misses"
        />

        <MetricCard
          title="Control Plane Health"
          value={current.cpu_util_pct.toFixed(1)}
          unit="% CPU"
          subtitle={`RAM: ${current.memory_util_pct.toFixed(1)}% | BGP Flaps: ${current.bgp_flap_count}`}
          status={current.cpu_util_pct >= 85 ? 'critical' : 'normal'}
          historyValues={cpuSeries}
          threshold="Route processor load"
        />
      </div>

      {/* Real-time Multi-Metric Telemetry Canvas */}
      <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', fontWeight: 700 }}>
          <span>HISTORICAL TELEMETRY TREND (LAST 30 MINUTES)</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 10, height: 3, background: 'var(--chili)', display: 'inline-block' }} /> Queue Occupancy %
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 10, height: 3, background: 'var(--amber)', display: 'inline-block' }} /> RTT (ms)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 10, height: 3, background: 'var(--lentil)', display: 'inline-block' }} /> Bandwidth Util %
            </span>
          </div>
        </div>

        <svg width="100%" height="110" viewBox="0 0 600 110" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1="0" y1="25" x2="600" y2="25" stroke="var(--line)" strokeDasharray="3 3" />
          <line x1="0" y1="55" x2="600" y2="55" stroke="var(--line)" strokeDasharray="3 3" />
          <line x1="0" y1="85" x2="600" y2="85" stroke="var(--line)" strokeDasharray="3 3" />

          {/* Queue Trend Line */}
          {history.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--chili)"
              strokeWidth="2.2"
              points={history
                .map((h, i) => `${(i / (history.length - 1)) * 600},${105 - (h.queue_occupancy_pct / 100) * 95}`)
                .join(' ')}
            />
          )}

          {/* RTT Trend Line */}
          {history.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--amber)"
              strokeWidth="1.8"
              points={history
                .map((h, i) => `${(i / (history.length - 1)) * 600},${105 - Math.min(100, h.rtt_ms) * 0.95}`)
                .join(' ')}
            />
          )}

          {/* Utilization Trend Line */}
          {history.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--lentil)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              points={history
                .map((h, i) => `${(i / (history.length - 1)) * 600},${105 - (h.bandwidth_util_pct / 100) * 95}`)
                .join(' ')}
            />
          )}
        </svg>
      </div>
    </section>
  );
};
