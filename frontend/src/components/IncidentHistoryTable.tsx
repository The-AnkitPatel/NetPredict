import React, { useState } from 'react';
import type { HistoricalIncident } from '../types/telemetry';
import { Search, Clock } from 'lucide-react';
import { CheckIcon } from './CheckIcon';

interface IncidentHistoryTableProps {
  incidents: HistoricalIncident[];
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({ incidents }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = incidents.filter(
    (inc) =>
      inc.incident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.failure_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.root_cause_driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="incidents" className="panel">
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">7</div>
          <span className="panel-title">PREDICTION-VS-ACTUAL INCIDENT LOG & AUDIT</span>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--grey)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            placeholder="Search incident, root cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px 6px 30px',
              fontSize: '11px',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              background: 'var(--paper)',
              fontFamily: 'inherit',
              width: '240px',
            }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--ink)', color: '#FFF' }}>
              <th style={{ padding: '8px 10px' }}>INCIDENT ID</th>
              <th style={{ padding: '8px 10px' }}>FAILURE TYPE</th>
              <th style={{ padding: '8px 10px' }}>PREDICTED RISK</th>
              <th style={{ padding: '8px 10px' }}>LEAD WARNING TIME</th>
              <th style={{ padding: '8px 10px' }}>ROOT CAUSE FACTOR</th>
              <th style={{ padding: '8px 10px' }}>OUTCOME / MITIGATION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc) => (
              <tr key={inc.incident_id} style={{ borderBottom: '1px solid var(--line)', background: '#FFF' }}>
                <td style={{ padding: '8px 10px' }} className="font-mono font-display">
                  {inc.incident_id}
                </td>
                <td style={{ padding: '8px 10px', fontWeight: 700 }}>{inc.failure_type}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span className="font-mono" style={{ color: 'var(--chili)', fontWeight: 800 }}>
                    {(inc.predicted_risk * 100).toFixed(0)}%
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Clock size={12} color="var(--lentil)" /> {inc.lead_time_minutes} min horizon
                  </span>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--grey)' }}>{inc.root_cause_driver}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span className="badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckIcon size={11} style={{ color: 'var(--lentil)' }} /> {inc.actual_outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
