import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Sparkles,
} from 'lucide-react';

const sections = [
  {
    href: '/docs/architecture',
    icon: Layers,
    title: 'System Architecture',
    desc: 'Sliding-window ring buffer, streaming & domain decoupling.',
  },
  {
    href: '/docs/temporal-ml',
    icon: Cpu,
    title: 'Temporal ML Engine',
    desc: 'R random forests, isotonic calibration and RTT intervals.',
  },
  {
    href: '/docs/anomaly-vs-prediction',
    icon: ShieldCheck,
    title: 'Anomaly vs Prediction',
    desc: 'Isolation forest vs predictive forecasting mechanisms.',
  },
  {
    href: '/docs/explainability',
    icon: Sparkles,
    title: 'Explainability Engine',
    desc: 'Permutation Shapley contributions and diagnostics.',
  },
  {
    href: '/docs/what-if-simulation',
    icon: CheckCircle2,
    title: 'What-If Simulation',
    desc: 'Counterfactual mitigation engine and policy rollouts.',
  },
  {
    href: '/docs/api-reference',
    icon: Terminal,
    title: 'API Reference',
    desc: 'R API endpoints and request formats.',
  },
];

export default function HomePage() {
  return (
    <main className="bg-fd-background text-fd-foreground">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-muted/50 px-3 py-1 text-xs font-semibold text-fd-primary mb-4">
          Documentation Platform
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          NetPredict <span className="text-fd-muted-foreground font-normal">|</span> Documentation
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-fd-muted-foreground md:text-lg">
          Architecture, setup and experiment notes for NetPredict —
          network telemetry forecasting with an R backend.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90 rounded-md"
          >
            <BookOpen className="size-4" />
            Explore Documentation
          </Link>
          <Link
            href="/docs/api-reference"
            className="inline-flex items-center gap-2 border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 rounded-md"
          >
            <Terminal className="size-4" />
            API Reference
          </Link>
        </div>
      </section>

      {/* Documentation Index Cards */}
      <section className="mx-auto max-w-5xl border-t border-fd-border px-6 py-12">
        <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-fd-muted-foreground">
          Documentation Areas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-lg border border-fd-border bg-fd-card p-5 transition-all duration-300 ease-out hover:border-fd-primary/40 hover:bg-fd-muted/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-fd-primary/5"
            >
              <span className="text-fd-primary transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-5" />
              </span>
              <span className="font-semibold text-fd-foreground">{title}</span>
              <span className="text-sm leading-relaxed text-fd-muted-foreground">{desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
