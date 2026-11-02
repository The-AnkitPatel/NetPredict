import { type ReactNode } from 'react';
import { TechIcon, type TechKey } from './tech-icons';

/**
 * Shared visual primitives for the on-brand diagram system.
 *
 * Driven by the `--color-fd-*` design tokens (via Tailwind `fd-*` utilities) so diagrams
 * follow light/dark automatically and stay consistent with the rest of the UI.
 * Corners are squared globally by `global.css`.
 */

export type NodeVariant = 'default' | 'accent' | 'data' | 'muted' | 'external';

export interface DiagramNode {
  title: ReactNode;
  sub?: ReactNode;
  variant?: NodeVariant;
  icon?: TechKey | TechKey[];
  details?: string[];
}

const NODE_STYLES: Record<NodeVariant, string> = {
  default: 'border-fd-border bg-fd-card',
  accent: 'border-fd-primary/40 bg-fd-primary/10',
  data: 'border-fd-border border-l-2 border-l-fd-primary/60 bg-fd-muted/50',
  muted: 'border-fd-border bg-fd-muted/30',
  external: 'border-dashed border-fd-border bg-fd-card',
};

function IconStack({ icons }: { icons: TechKey[] }) {
  return (
    <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-fd-muted-foreground">
      {icons.map((key) => (
        <TechIcon key={key} name={key} size={17} />
      ))}
    </span>
  );
}

export function DNode({ title, sub, variant = 'default', icon, details }: DiagramNode) {
  const icons = icon ? (Array.isArray(icon) ? icon : [icon]) : [];
  return (
    <div
      className={`flex min-w-34 max-w-76 items-start gap-2.5 border px-3 py-2.5 ${NODE_STYLES[variant]}`}
    >
      {icons.length > 0 && <IconStack icons={icons} />}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={`text-[13px] font-semibold leading-tight ${
            variant === 'accent' ? 'text-fd-primary' : 'text-fd-foreground'
          }`}
        >
          {title}
        </span>
        {sub && (
          <span className="font-mono text-[11px] leading-tight text-fd-muted-foreground">
            {sub}
          </span>
        )}
        {details && details.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {details.map((line, i) => (
              <li
                key={i}
                className="flex items-center gap-1.5 font-mono text-[10px] leading-tight text-fd-muted-foreground"
              >
                <span className="size-1 shrink-0 bg-fd-primary/60" />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: 'down' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-fd-muted-foreground/70"
      aria-hidden
    >
      {dir === 'down' ? <path d="m6 9 6 6 6-6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

/** A directional connector between diagram sections, with an optional label. */
export function Connector({
  label,
  dir = 'down',
}: {
  label?: ReactNode;
  dir?: 'down' | 'right';
}) {
  if (dir === 'right') {
    return (
      <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-center px-1.5">
        {label && (
          <span className="whitespace-nowrap font-mono text-[10px] text-fd-muted-foreground">
            {label}
          </span>
        )}
        <Chevron dir="right" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1.5">
      <span className="h-3 w-px bg-fd-border" />
      {label && (
        <span className="whitespace-nowrap rounded-none bg-fd-muted/40 px-1.5 font-mono text-[10px] text-fd-muted-foreground">
          {label}
        </span>
      )}
      <Chevron dir="down" />
    </div>
  );
}

/** A labelled, dashed tier/region that groups a set of nodes. */
export function LayerBox({
  label,
  children,
  accent,
}: {
  label?: ReactNode;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`border border-dashed p-3 ${
        accent ? 'border-fd-primary/40 bg-fd-primary/5' : 'border-fd-border bg-fd-muted/20'
      }`}
    >
      {label && (
        <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-fd-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
