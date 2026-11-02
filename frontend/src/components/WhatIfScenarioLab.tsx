import React, { useState } from 'react';
import { api } from '../services/api';
import type { SimulationResponse } from '../types/telemetry';
import { PlayCircle, RefreshCw, ArrowRight, Shield, Zap } from 'lucide-react';

export const WhatIfScenarioLab: React.FC = () => {
  const [reroutePct, setReroutePct] = useState<number>(30);
  const [rateLimitPct, setRateLimitPct] = useState<number>(10);
  const [bufferFactor, setBufferFactor] = useState<number>(1.5);
  const [priorityQueue, setPriorityQueue] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [prescribeRationale, setPrescribeRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setError(null);
    setIsLoading(true);
    setPrescribeRationale(null);
    try {
      const res = await api.simulateScenario({
        device_id: 'core-router-alpha',
        interface_id: 'xe-0/0/1',
        horizon_minutes: 15,
        reroute_traffic_pct: reroutePct,
        ingress_rate_limit_pct: rateLimitPct,
        buffer_expansion_factor: bufferFactor,
        enable_priority_queuing: priorityQueue,
      });
      setSimResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoPrescribe = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.prescribeOptimalScenario();
      if (res.recommended_scenario) {
        setReroutePct(res.recommended_scenario.reroute_traffic_pct);
        setRateLimitPct(res.recommended_scenario.ingress_rate_limit_pct);
        setBufferFactor(res.recommended_scenario.buffer_expansion_factor);
        setPriorityQueue(res.recommended_scenario.enable_priority_queuing);
      }
      setSimResult(res.simulation);
      setPrescribeRationale(res.rationale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prescription unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="whatif" className="panel">
      {error && <p role="alert" style={{ color: 'var(--chili)' }}>{error}</p>}
      {/* 1. Header */}
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="step-badge">5</div>
          <span className="panel-title">WHAT-IF COUNTERFACTUAL SCENARIO LAB</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--grey)' }}>
          DECISION SUPPORT & MITIGATION TESTING
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--grey)', margin: '0 0 20px 0' }}>
        Test candidate operational interventions before altering production network routing. The counterfactual engine maps physical flow changes through the trained model to estimate predicted risk reduction.
      </p>

      {/* 2. Sublayout Columns */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Controls Column */}
        <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '16px', letterSpacing: '0.8px' }}>
            OPERATOR INTERVENTION CONTROLS
          </div>

          {/* Slider 1: Reroute % */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Divert Ingress Traffic:</span>
              <span className="font-mono font-display" style={{ color: 'var(--chili)' }}>{reroutePct}%</span>
            </div>
            <input type="range" min="0" max="80" step="5" value={reroutePct} onChange={(e) => setReroutePct(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--chili)', cursor: 'pointer' }} />
            <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '2px' }}>
              Diverts traffic to redundant transit path (xe-0/0/2)
            </div>
          </div>

          {/* Slider 2: Rate Limit % */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Ingress Rate Limiting / Shaping:</span>
              <span className="font-mono font-display" style={{ color: 'var(--amber)' }}>{rateLimitPct}%</span>
            </div>
            <input type="range" min="0" max="50" step="5" value={rateLimitPct} onChange={(e) => setRateLimitPct(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--amber)', cursor: 'pointer' }} />
            <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '2px' }}>
              Active queue policing on non-critical TCP flows
            </div>
          </div>

          {/* Slider 3: Buffer Factor */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>QoS Buffer Multiplier:</span>
              <span className="font-mono font-display">{bufferFactor.toFixed(1)}x</span>
            </div>
            <input type="range" min="1.0" max="2.5" step="0.1" value={bufferFactor} onChange={(e) => setBufferFactor(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--ink)', cursor: 'pointer' }} />
            <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '2px' }}>
              Dynamic microburst buffer headroom
            </div>
          </div>

          {/* Tactile Toggle Switch: Strict Priority Queuing */}
          <div
            role="switch"
            aria-checked={priorityQueue}
            tabIndex={0}
            onClick={() => setPriorityQueue(!priorityQueue)}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPriorityQueue(!priorityQueue); } }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', background: priorityQueue ? '#FAF5EE' : 'var(--paper)', border: '1px solid var(--line)', cursor: 'pointer', marginBottom: '20px', userSelect: 'none', transition: 'all 0.15s ease' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Strict Priority Queuing (WFQ QoS)</div>
              <div style={{ fontSize: '11px', color: 'var(--grey)' }}>Bypass buffer queue for low-latency telemetry & control packets</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.5px', color: priorityQueue ? 'var(--chili)' : 'var(--grey)' }}>{priorityQueue ? 'ACTIVE' : 'OFF'}</span>
              <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: priorityQueue ? 'var(--chili)' : '#D9D3C7', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFFDF8', position: 'absolute', top: '3px', left: priorityQueue ? '19px' : '3px', transition: 'left 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleRunSimulation} disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <PlayCircle size={15} />}
            EVALUATE COUNTERFACTUAL MITIGATION
          </button>

          <button
            className="btn btn-success"
            onClick={handleAutoPrescribe}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            <Zap size={14} />
            AUTO-PRESCRIBE OPTIMAL MITIGATION
          </button>
        </div>

        {/* Results Column */}
        <div style={{ background: '#FFFDF8', border: '1px solid var(--line)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {prescribeRationale && (
            <div style={{ background: '#E8EFE3', border: '1px solid var(--lentil)', padding: '10px 12px', marginBottom: '14px', fontSize: '11.5px', color: 'var(--lentil-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="var(--lentil-dark)" className="shrink-0" />
              <span>{prescribeRationale}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--lentil)" /> COUNTERFACTUAL OUTCOME PREVIEW
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--grey)', background: 'var(--paper)', padding: '2px 6px' }}>{simResult ? 'EVALUATED' : 'STANDBY'}</span>
          </div>

          {simResult ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>OPERATOR VERDICT:</span>
                <span className={simResult.verdict === 'OPTIMAL' ? 'badge-low' : simResult.verdict === 'EFFECTIVE' ? 'badge-elevated' : 'badge-low'} style={{ fontSize: '12px', padding: '3px 8px' }}>
                  {simResult.verdict}
                </span>
              </div>

              {/* Before vs After Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--line)', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>BASELINE RISK</div>
                  <div className="font-mono font-display" style={{ fontSize: '20px', color: 'var(--chili)', marginTop: '4px' }}>{(simResult.baseline_risk * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '2px' }}>RTT: {simResult.baseline_rtt_ms}ms</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <ArrowRight size={18} color="var(--chili)" />
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--lentil)' }}>DELTA</span>
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--line)', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--grey)' }}>COUNTERFACTUAL</div>
                  <div className="font-mono font-display" style={{ fontSize: '20px', color: 'var(--lentil)', marginTop: '4px' }}>{(simResult.counterfactual_risk * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--grey)', marginTop: '2px' }}>RTT: {simResult.counterfactual_rtt_ms}ms</div>
                </div>
              </div>

              {/* Guidance Box */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.5px' }}>RECOMMENDED ACTION:</div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, marginTop: '4px', color: 'var(--ink)' }}>{simResult.operator_guidance}</div>
              </div>

              <p style={{ fontSize: '11.5px', color: 'var(--grey)', lineHeight: 1.5, margin: 0 }}>
                {simResult.counterfactual_explanation}
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '36px 20px', background: 'var(--paper)', border: '1px dashed var(--line)', borderRadius: '4px' }}>
              <Zap size={32} color="var(--grey)" style={{ marginBottom: '12px', opacity: 0.6 }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>Interactive Simulation Canvas Ready</div>
              <div style={{ fontSize: '11.5px', color: 'var(--grey)', maxWidth: '340px', lineHeight: 1.5, marginBottom: '20px' }}>
                Adjust reroute percentage, ingress rate limits, and QoS buffers on the left, then click Evaluate to calculate counterfactual risk reduction.
              </div>
              <button className="btn btn-success" onClick={handleRunSimulation} disabled={isLoading} style={{ fontSize: '11.5px', padding: '8px 16px' }}>
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                RUN QUICK BENCHMARK SIMULATION
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
