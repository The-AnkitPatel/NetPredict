import React from 'react';
import {
  Activity,
  Layers,
  Clock,
  Split,
  Sliders,
  ShieldCheck,
  History,
  AlertTriangle,
  Server,
  Zap,
  X,
} from 'lucide-react';
import { CheckIcon } from './CheckIcon';

export type SectionId = 'telemetry' | 'horizons' | 'anomaly_vs_pred' | 'shap' | 'whatif' | 'health' | 'incidents';

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  isAnomaly: boolean;
  currentStep?: number;
  totalSteps?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: SectionId;
  step: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'telemetry', step: '01', label: 'Live Telemetry', icon: Activity },
  { id: 'horizons', step: '02', label: 'Predictive Horizons', icon: Clock },
  { id: 'anomaly_vs_pred', step: '03', label: 'Anomaly vs Prediction', icon: Split },
  { id: 'shap', step: '04', label: 'Root-Cause (Shapley)', icon: Layers },
  { id: 'whatif', step: '05', label: 'What-If Scenario Lab', icon: Sliders },
  { id: 'health', step: '06', label: 'Model Health & Audit', icon: ShieldCheck },
  { id: 'incidents', step: '07', label: 'Incident Log & Audit', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isAnomaly,
  isOpen = false,
  onClose,
}) => {
  const handleNavClick = (id: SectionId) => {
    onSelectSection(id);
    if (onClose) onClose();
    const element = document.getElementById(id);
    if (element) {
      const offsetPos = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetPos, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-label="Close navigation drawer"
      />
      <aside className={`layout-sidebar ${isOpen ? 'open' : ''}`}>
        {/* 1. Header & Brand Wordmark */}
        <div>
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0px',
                  background: 'var(--chili)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(214, 64, 42, 0.45)',
                }}
              >
                <Zap size={18} color="#FFFDF8" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '19px',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    color: '#FFFFFF',
                    lineHeight: '1.1',
                  }}
                >
                  NETPREDICT
                </div>
                <div
                  style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '1.2px',
                    color: '#777777',
                    textTransform: 'uppercase',
                  }}
                >
                  ML Telemetry NOC v1.0
                </div>
              </div>
            </div>
            {onClose && (
              <button
                className="mobile-close-btn"
                onClick={onClose}
                aria-label="Close Navigation"
                style={{ borderRadius: '2px' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Device Target Badge (AMOLED Black) */}
          <div
            style={{
              marginTop: '16px',
              background: '#0B0B0B',
              border: '1px solid #1E1E1E',
              borderRadius: '0px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: '#777777',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Server size={10} /> Core Interface
              </span>
              {isAnomaly ? (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '0px',
                    background: 'rgba(214, 64, 42, 0.25)',
                    border: '1px solid rgba(214, 64, 42, 0.5)',
                    color: '#FF6B57',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertTriangle size={10} /> ANOMALY
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '0px',
                    background: 'rgba(92, 107, 79, 0.25)',
                    border: '1px solid rgba(92, 107, 79, 0.45)',
                    color: '#89E882',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckIcon size={9} /> NOMINAL
                </span>
              )}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF' }}
            >
              core-router-alpha
            </div>
            <div style={{ fontSize: '10.5px', color: '#777777' }}>
              Port: <span className="font-mono" style={{ color: '#E0E0E0' }}>xe-0/0/1</span> (100G Trunk)
            </div>
          </div>
        </div>

        {/* 2. Vertical Navigation Menu */}
        <div style={{ padding: '16px 10px' }}>
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              letterSpacing: '1.2px',
              color: '#666666',
              textTransform: 'uppercase',
              padding: '0 10px 10px',
            }}
          >
            Telemetry Workspaces
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '0px',
                    border: 'none',
                    background: isActive ? 'rgba(214, 64, 42, 0.18)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--chili)' : '3px solid transparent',
                    color: isActive ? '#FFFFFF' : '#A6A6A6',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.2px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: isActive ? 'var(--chili)' : '#555555',
                      width: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  <Icon
                    size={15}
                    color={isActive ? 'var(--chili)' : '#707070'}
                    className="shrink-0"
                  />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

      {/* 3. System Telemetry & ML Engine Specs Footer (AMOLED Black) */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #1A1A1A',
          background: '#050505',
          fontSize: '10.5px',
          color: '#666666',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>ML ENGINE:</span><span className="font-mono" style={{ color: '#D0D0D0' }}>R Forest + Shapley</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>CALIBRATION:</span><span className="font-mono" style={{ color: '#D0D0D0' }}>Isotonic</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>CONFORMAL INTERVAL:</span><span className="font-mono" style={{ color: '#D0D0D0' }}>90% Target</span>
        </div>
      </div>
    </aside>
  </>
);
};
