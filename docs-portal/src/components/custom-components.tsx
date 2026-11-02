import React from 'react';

// StatusBadge: A colored pill indicating system state or status
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const statusColors: Record<string, string> = {
    healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',

    degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sos: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  const colorClass = statusColors[status.toLowerCase()] || statusColors.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label || status}
    </span>
  );
}

// MetricCard: High-level metric card with optional trends
export function MetricCard({
  title,
  value,
  unit,
  trend,
  trendDirection = 'up',
}: {
  title: string;
  value: string;
  unit?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="p-5 rounded-xl border bg-fd-card text-fd-card-foreground shadow-sm my-2">
      <div className="text-xs font-semibold text-fd-muted-foreground uppercase tracking-wider">{title}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-fd-foreground">{value}</span>
        {unit && <span className="text-sm font-semibold text-fd-muted-foreground">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={
              trendDirection === 'up'
                ? 'text-emerald-400 font-medium'
                : trendDirection === 'down'
                  ? 'text-rose-400 font-medium'
                  : 'text-zinc-400 font-medium'
            }
          >
            {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '•'} {trend}
          </span>
        </div>
      )}
    </div>
  );
}

// ArchitectureBlock: Renders system component boundaries, inputs, outputs
export function ArchitectureBlock({
  name,
  role,
  tech,
  inputs = [],
  outputs = [],
  children,
}: {
  name: string;
  role: string;
  tech: string;
  inputs?: string[];
  outputs?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="my-6 border rounded-xl bg-fd-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b bg-fd-muted/30 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-sm text-fd-foreground font-mono">{name}</h4>
          <span className="text-xs text-fd-muted-foreground">{role}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-fd-accent text-fd-accent-foreground font-mono border border-fd-border">{tech}</span>
      </div>
      <div className="p-5 text-sm space-y-4">
        {children && <div className="text-fd-muted-foreground leading-relaxed">{children}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {inputs.length > 0 && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400 font-semibold mb-1.5 uppercase tracking-wide">Inputs / Consumes</div>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                {inputs.map((inp, idx) => (
                  <li key={idx}>{inp}</li>
                ))}
              </ul>
            </div>
          )}
          {outputs.length > 0 && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400 font-semibold mb-1.5 uppercase tracking-wide">Outputs / Emits</div>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                {outputs.map((out, idx) => (
                  <li key={idx}>{out}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// WorkflowTimeline: Container for vertical timelines
export function WorkflowTimeline({ children }: { children: React.ReactNode }) {
  return <div className="relative pl-6 border-l border-zinc-800 my-6 space-y-6">{children}</div>;
}

// WorkflowStep: Single step in a vertical timeline
export function WorkflowStep({
  time,
  title,
  status = 'success',
  children,
}: {
  time?: string;
  title: string;
  status?: 'success' | 'warning' | 'error' | 'pending';
  children?: React.ReactNode;
}) {
  const dotColor = {
    success: 'bg-emerald-500 border-emerald-950',
    warning: 'bg-amber-500 border-amber-950',
    error: 'bg-rose-500 border-rose-950',
    pending: 'bg-zinc-500 border-zinc-950',
  }[status];
  return (
    <div className="relative">
      <div className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${dotColor}`} />
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm text-fd-foreground">{title}</h4>
          {time && <span className="text-xs font-mono text-fd-muted-foreground">{time}</span>}
        </div>
        {children && <div className="mt-1 text-sm text-fd-muted-foreground leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

// ApiReference: Interactive-style API routing description
export function ApiReference({
  method,
  path,
  children,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  children?: React.ReactNode;
}) {
  const methodColors = {
    GET: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PATCH: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }[method];
  return (
    <div className="my-6 border rounded-xl overflow-hidden bg-fd-card shadow-sm">
      <div className="px-5 py-4 border-b bg-fd-muted/30 flex items-center gap-3 font-mono text-sm">
        <span className={`px-2 py-0.5 rounded font-bold border text-xs ${methodColors}`}>{method}</span>
        <span className="font-bold text-fd-foreground select-all">{path}</span>
      </div>
      {children && <div className="p-5 divide-y divide-zinc-800">{children}</div>}
    </div>
  );
}

// ApiParam: Single query/body/path parameter inside ApiReference
export function ApiParam({
  name,
  type,
  required = false,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b last:border-b-0 border-zinc-800 text-sm">
      <div className="flex items-baseline gap-2 font-mono">
        <span className="font-bold text-fd-foreground">{name}</span>
        <span className="text-xs text-fd-muted-foreground">({type})</span>
        {required && <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">Required</span>}
      </div>
      {children && <div className="mt-1.5 text-fd-muted-foreground leading-relaxed">{children}</div>}
    </div>
  );
}

// CommandReference: CLI reference documentation card
export function CommandReference({
  command,
  description,
  children,
}: {
  command: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="my-6 border rounded-xl overflow-hidden bg-fd-card shadow-sm">
      <div className="p-4 bg-zinc-950 border-b border-zinc-900 font-mono text-sm text-zinc-300 flex items-center justify-between">
        <span>{command}</span>
      </div>
      <div className="p-5 text-sm leading-relaxed">
        {description && <p className="mb-4 text-fd-muted-foreground">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ComparisonTable: Simplified Side-by-Side matrix
export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-6 overflow-x-auto border rounded-xl bg-fd-card">
      <table className="min-w-full divide-y divide-zinc-800 text-sm">
        <thead className="bg-fd-muted/30">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3 text-left font-semibold text-fd-foreground font-mono">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-5 py-3 text-fd-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
