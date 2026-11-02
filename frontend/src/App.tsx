import React, { useState, useEffect, useRef } from 'react';
import { api, type LiveCounters } from './services/api';
import type {
  RawTelemetryRecord,
  PredictionResponse,
  ShapExplanationResponse,
  HistoricalIncident,
} from './types/telemetry';

import { CustomCursor } from './components/CustomCursor';
import { Topbar } from './components/Topbar';
import { Sidebar, type SectionId } from './components/Sidebar';
import { TelemetryGrid } from './components/TelemetryGrid';

import { PredictiveHorizonPanel } from './components/PredictiveHorizonPanel';
import { AnomalyVsPredictionCard } from './components/AnomalyVsPredictionCard';
import { ShapWaterfallChart } from './components/ShapWaterfallChart';
import { WhatIfScenarioLab } from './components/WhatIfScenarioLab';
import { ModelHealthPanel } from './components/ModelHealthPanel';
import { IncidentHistoryTable } from './components/IncidentHistoryTable';

export const App: React.FC = () => {
  const [currentTelemetry, setCurrentTelemetry] = useState<RawTelemetryRecord | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<RawTelemetryRecord[]>([]);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [explanation, setExplanation] = useState<ShapExplanationResponse | null>(null);
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [activeSection, setActiveSection] = useState<SectionId>('telemetry');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCounters, setLiveCounters] = useState<LiveCounters | null>(null);
  const busy = useRef(false);

  const timerRef = useRef<number | null>(null);

  // Fetch initial telemetry snapshot & predictions
  const fetchAllData = async () => {
    try {
      const hist = await api.getTelemetryHistory(35);
      setTelemetryHistory(hist);
      if (hist.length > 0) {
        setCurrentTelemetry(hist[hist.length - 1]);
      }

      const pred = await api.getMultiHorizonPredictions();
      setPrediction(pred);

      const expl = await api.getLatestExplanation();
      setExplanation(expl);

      const incs = await api.getHistoricalIncidents();
      setIncidents(incs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load telemetry');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Streaming step handler
  const handleStep = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await api.stepStream();
      setCurrentTelemetry(res.record);
      setTelemetryHistory((prev) => [...prev.slice(-34), res.record]);
      setPrediction(res.prediction);

      const expl = await api.getLatestExplanation();
      setExplanation(expl);
      setIncidents(await api.getHistoricalIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to advance telemetry');
    } finally {
      busy.current = false;
    }
  };

  const handleJumpIncident = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await api.jumpToIncident();
      setCurrentTelemetry(res.record);
      setTelemetryHistory(await api.getTelemetryHistory(35));
      setPrediction(res.prediction);

      const expl = await api.getLatestExplanation();
      setExplanation(expl);
      setIncidents(await api.getHistoricalIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to jump to incident');
    } finally {
      busy.current = false;
    }
  };

  const handleResetStream = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await api.resetStream();
      setCurrentTelemetry(res.record);
      setTelemetryHistory(await api.getTelemetryHistory(35));
      setPrediction(res.prediction);

      const expl = await api.getLatestExplanation();
      setExplanation(expl);
      setIncidents(await api.getHistoricalIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset telemetry');
    } finally {
      busy.current = false;
    }
  };

  const handlePollLiveNic = async () => {
    try {
      const res = await api.pollLiveInterface();
      setLiveCounters(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read host counters');
    }
  };

  // Auto-play interval loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        handleStep();
      }, 3500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Scroll spy to highlight active section in sidebar
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds: SectionId[] = [
        'telemetry',
        'horizons',
        'anomaly_vs_pred',
        'shap',
        'whatif',
        'health',
        'incidents',
      ];
      const scrollPos = window.scrollY + 140;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="layout-root">
      <CustomCursor />
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isAnomaly={prediction?.is_current_anomaly || false}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="layout-main">
        <Topbar
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStep={handleStep}
          onJumpIncident={handleJumpIncident}
          onReset={handleResetStream}
          onPollLiveNic={handlePollLiveNic}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          currentTimestamp={currentTelemetry?.timestamp ? new Date(currentTelemetry.timestamp).toUTCString() : ''}
          isAnomaly={prediction?.is_current_anomaly || false}
        />

        <main className="app-shell">
          {error && <div role="alert" className="panel" style={{ color: 'var(--chili)' }}>{error}. Check that the R server is running on port 8000.</div>}
          {liveCounters && <section className="panel" aria-label="Host interface counters">
            <div className="panel-head"><span className="panel-title">HOST INTERFACE COUNTERS</span><button className="btn" onClick={() => setLiveCounters(null)}>CLOSE</button></div>
            <p>{liveCounters.note}</p>
            {liveCounters.interfaces.map((nic) => <div className="font-mono" key={nic.interface_id}>{nic.interface_id}: {nic.throughput_mbps === null ? 'Baseline recorded; poll again' : `${nic.throughput_mbps.toFixed(2)} Mbps`}</div>)}
          </section>}
          <TelemetryGrid current={currentTelemetry} history={telemetryHistory} />
          <PredictiveHorizonPanel prediction={prediction} />
          <AnomalyVsPredictionCard prediction={prediction} />
          <ShapWaterfallChart explanation={explanation} />
          <WhatIfScenarioLab />
          <ModelHealthPanel />
          <IncidentHistoryTable incidents={incidents} />

          <footer style={{ marginTop: '40px', borderTop: '2px solid var(--ink)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--grey)' }}>
            <div>
              <span style={{ fontWeight: 800, color: 'var(--ink)' }}>NETPREDICT PLATFORM</span> — Autonomous Network Telemetry & Degradation Forecasting
            </div>
            <div className="font-mono">
              R • Calibrated Random Forest • Shapley Explanations
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};


export default App;
