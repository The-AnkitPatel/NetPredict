import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  AlertTriangle,
  Activity,
  Radio,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CheckIcon } from './CheckIcon';
import { isBackendOnline } from '../services/api';

interface TopbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onJumpIncident: () => void;
  onReset: () => void;
  onPollLiveNic?: () => void;
  onToggleSidebar?: () => void;
  currentTimestamp: string;
  isAnomaly: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  isPlaying,
  onTogglePlay,
  onStep,
  onJumpIncident,
  onReset,
  onPollLiveNic,
  onToggleSidebar,
  currentTimestamp,
  isAnomaly,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState<boolean>(true);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Auto-hide controls when user scrolls down past 45px
      if (currentScrollY > 45 && currentScrollY > lastScrollY.current + 5) {
        setIsActionsOpen(false);
      } else if (currentScrollY < 15) {
        // Automatically re-expand when returned to top
        setIsActionsOpen(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-header-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onToggleSidebar && (
          <button
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Open Navigation Drawer"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="wordmark" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={26} color="var(--chili)" />
          <span>NETPREDICT</span>
          <span className="tag-pill">ML INTEL v1.0</span>
          <span
            className="font-mono"
            style={{
              fontSize: '9px',
              padding: '2px 6px',
              background: isBackendOnline() ? '#E8EFE3' : 'var(--card)',
              color: isBackendOnline() ? 'var(--lentil-dark)' : 'var(--grey)',
              border: '1px solid var(--line)',
              fontWeight: 800,
              letterSpacing: '0.4px',
            }}
            title={isBackendOnline() ? 'Connected to R server' : 'R server unavailable'}
          >
            {isBackendOnline() ? '● R BACKEND' : '● DISCONNECTED'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ color: 'var(--grey)', fontWeight: 600 }}>TELEMETRY TIME:</span>
          <span className="font-mono" style={{ fontWeight: 700 }}>
            {currentTimestamp || 'Waiting for telemetry'}
          </span>
        </div>

        {isAnomaly ? (
          <span className="badge-critical topbar-status-badge">
            <AlertTriangle size={13} /> ANOMALY DETECTED NOW
          </span>
        ) : (
          <span className="badge-low topbar-status-badge">
            <CheckIcon size={12} style={{ color: 'var(--lentil)' }} />
            CURRENT STATE NOMINAL
          </span>
        )}

        {/* CHEVRON TOGGLE BUTTON */}
        <button
          className={`chevron-toggle-btn ${isActionsOpen ? 'active' : ''}`}
          onClick={() => setIsActionsOpen((prev) => !prev)}
          title={isActionsOpen ? 'Hide action controls' : 'Show action controls'}
          aria-label={isActionsOpen ? 'Hide action controls' : 'Show action controls'}
        >
          <span>CONTROLS</span>
          {isActionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className={`topbar-actions topbar-actions-collapsible ${isActionsOpen ? 'open' : 'closed'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isPlaying ? 'btn-primary' : ''}`}
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            style={{ padding: '7px 12px' }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <button
            className="btn"
            onClick={onStep}
            disabled={isPlaying}
            title="Step telemetry forward 1 minute"
            style={{ padding: '7px 12px' }}
          >
            <FastForward size={14} />
            STEP +1M
          </button>

          <button
            className="btn"
            onClick={onJumpIncident}
            title="Jump playhead to acute congestion event"
            style={{ padding: '7px 12px', background: 'var(--danger-bg)', borderColor: 'var(--chili)' }}
          >
            <AlertTriangle size={14} color="var(--chili)" />
            SIMULATE INCIDENT
          </button>

          {onPollLiveNic && (
            <button
              className="btn btn-success"
              onClick={onPollLiveNic}
              title="Read host interface throughput"
              style={{ padding: '7px 12px' }}
            >
              <Radio size={13} />
              POLL HOST NIC
            </button>
          )}

          <button
            className="btn"
            onClick={onReset}
            title="Reset telemetry timeline"
            style={{ padding: '7px 10px' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
    </header>
  );
};
