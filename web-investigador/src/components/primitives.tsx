import React from 'react';
import { alertaTone, estadoTone } from '../lib/ui';

export const EstadoPill: React.FC<{ estado: string }> = ({ estado }) => {
  const t = estadoTone(estado);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${t.bg} ${t.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
      {t.label}
    </span>
  );
};

/** Risk / bioaccumulation level: ink text; the color lives only in the swatch. */
export const RiskPill: React.FC<{ nivel: string; prefix?: string }> = ({ nivel, prefix }) => {
  const t = alertaTone(nivel);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-ink"
      style={{ background: `${t.color}2E` }}
    >
      <span className="h-2 w-2 rounded-[2px]" style={{ background: t.color }} />
      {prefix}
      {prefix ? t.label.toLowerCase() : nivel}
    </span>
  );
};

export const ScoreBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center gap-2" title={`Índice de sospecha ${score} de 5`}>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-2 w-3.5 rounded-[1px] ${i <= score ? (score >= 4 ? 'bg-clay' : 'bg-ochre') : 'bg-line'}`}
        />
      ))}
    </div>
    <span className="text-[12px] font-semibold text-ink">{score}/5</span>
  </div>
);

export const Section: React.FC<{ title: string; aside?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  aside,
  children,
}) => (
  <section className="border-t border-line px-5 py-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="eyebrow">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 text-[13px]">
    <dt className="text-ink-3">{label}</dt>
    <dd className="text-ink">{children}</dd>
  </div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-surface px-3 py-2.5">
    <div className="text-[18px] font-semibold leading-tight text-ink">{value}</div>
    <div className="text-[11px] text-ink-3">{label}</div>
  </div>
);

export const DemoBadge: React.FC = () => (
  <span
    className="rounded border border-dashed border-line-strong px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-3"
    title="Contenido ficticio para demostrar la plataforma. No son mediciones reales."
  >
    Datos de demostración
  </span>
);
