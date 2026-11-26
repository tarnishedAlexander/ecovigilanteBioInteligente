import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatNum } from '../lib/investigacion';

/* Small hand-written SVG charts for the Investigación section. Marks follow one spec:
   2px lines, dots r=4 with a 2px surface ring, 4px-tall range bars with round ends,
   solid hairline grid, dashed lines only for regulatory thresholds. */

const SURFACE = '#1d231b';
const GRID = 'rgba(210, 225, 185, .12)';
const AXIS_TEXT = '#a9b5a0';
const REF = '#d5ac69';

export interface Referencia {
  valor: number;
  etiqueta: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

type Escala = { (v: number): number; ticks: number[] };

function escala(tipo: 'log' | 'linear', d0: number, d1: number, r0: number, r1: number): Escala {
  if (tipo === 'log') {
    const a = Math.log10(d0), b = Math.log10(d1);
    const f = ((v: number) => r0 + ((Math.log10(Math.max(v, d0)) - a) / (b - a)) * (r1 - r0)) as Escala;
    f.ticks = [];
    for (let e = Math.ceil(a); e <= Math.floor(b); e++) f.ticks.push(10 ** e);
    return f;
  }
  const f = ((v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)) as Escala;
  const paso = pasoLimpio((d1 - d0) / 5);
  f.ticks = [];
  for (let t = Math.ceil(d0 / paso) * paso; t <= d1 + 1e-9; t += paso) f.ticks.push(+t.toFixed(10));
  return f;
}

function pasoLimpio(bruto: number) {
  const p = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/** Domain for a log axis: whole decades around the data and the reference lines. */
export function dominioLog(valores: number[]) {
  const pos = valores.filter((v) => v > 0);
  return [10 ** Math.floor(Math.log10(Math.min(...pos))), 10 ** Math.ceil(Math.log10(Math.max(...pos)))] as [number, number];
}

interface TooltipState {
  x: number;
  y: number;
  contenido: React.ReactNode;
}

function Tooltip({ t, ancho }: { t: TooltipState | null; ancho: number }) {
  if (!t) return null;
  const izquierda = t.x > ancho * 0.6;
  return (
    <div className="chart-tooltip" role="status"
      style={{ top: t.y, ...(izquierda ? { right: ancho - t.x + 12 } : { left: t.x + 12 }) }}>
      {t.contenido}
    </div>
  );
}

/* ---------------------------------------------------------------- Range chart */

export interface RangeItem {
  id: string;
  valor: number | null;
  min: number | null;
  max: number | null;
  /** Upper bound only, e.g. below detection limit. Drawn as an open marker at the bound. */
  menorQue?: boolean;
  color: string;
  atenuado?: boolean;
  tooltip: React.ReactNode;
}

export interface RangeRow {
  key: string;
  label: string;
  sublabel?: string;
  items: RangeItem[];
}

interface RangeChartProps {
  filas: RangeRow[];
  tipo: 'log' | 'linear';
  dominio: [number, number];
  unidad: string;
  referencias?: Referencia[];
  onSelect?: (id: string) => void;
  /** Accessible summary of the chart. */
  titulo: string;
}

/** One row per site or species; each study measurement is a dot (mean) over a bar (range). */
export function RangeChart({ filas, tipo, dominio, unidad, referencias = [], onSelect, titulo }: RangeChartProps) {
  const [ref, ancho] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const etiquetaW = Math.min(170, Math.max(118, ancho * 0.34));
  const filaH = 26;
  const arriba = 22 + (referencias.length > 1 ? 10 : 0);
  const alto = arriba + filas.length * filaH + 26;
  const x = escala(tipo, dominio[0], dominio[1], etiquetaW + 6, Math.max(etiquetaW + 60, ancho - 14));

  return (
    <div ref={ref} className="chart" onMouseLeave={() => setTip(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label={titulo}>
          {x.ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={arriba - 4} y2={alto - 22} stroke={GRID} />
              <text x={x(t)} y={alto - 8} textAnchor="middle" className="chart-axis">{formatNum(t)}</text>
            </g>
          ))}
          <text x={0} y={alto - 8} className="chart-axis chart-unit">{unidad}{tipo === 'log' ? ' · escala logarítmica' : ''}</text>
          {referencias.filter((r) => r.valor >= dominio[0] && r.valor <= dominio[1]).map((r, i) => {
            const alFinal = x(r.valor) > ancho * 0.72;
            return (
              <g key={r.etiqueta}>
                <line x1={x(r.valor)} x2={x(r.valor)} y1={arriba - 6} y2={alto - 22} stroke={REF} strokeDasharray="4 3" />
                <text x={x(r.valor) + (alFinal ? -4 : 4)} y={arriba - 10 + (i % 2) * 10} textAnchor={alFinal ? 'end' : 'start'} className="chart-ref">{r.etiqueta}</text>
              </g>
            );
          })}
          {filas.map((f, i) => {
            const cy = arriba + i * filaH + filaH / 2;
            return (
              <g key={f.key}>
                <text x={0} y={cy - (f.sublabel ? 2 : -4)} className="chart-label">{recortar(f.label, etiquetaW)}</text>
                {f.sublabel && <text x={0} y={cy + 9} className="chart-sublabel">{recortar(f.sublabel, etiquetaW)}</text>}
                {f.items.map((it, j) => {
                  const off = f.items.length > 1 ? (j - (f.items.length - 1) / 2) * Math.min(5, 14 / f.items.length) : 0;
                  const y = cy + off;
                  const op = it.atenuado ? 0.22 : 1;
                  const mostrar = (e: React.MouseEvent) => {
                    const box = ((e.currentTarget as SVGGraphicsElement).ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setTip({ x: e.clientX - box.left, y: e.clientY - box.top + 10, contenido: it.tooltip });
                  };
                  const lo = it.min ?? it.valor;
                  const hi = it.max ?? it.valor;
                  return (
                    <g key={it.id} opacity={op} onMouseMove={mostrar} onClick={() => onSelect?.(it.id)}
                      style={{ cursor: onSelect ? 'pointer' : undefined }}>
                      {lo !== null && hi !== null && hi > lo && !it.menorQue && (
                        <line x1={x(lo)} x2={x(hi)} y1={y} y2={y} stroke={it.color} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.55} />
                      )}
                      {it.menorQue && hi !== null && (
                        <>
                          <line x1={x(dominio[0])} x2={x(hi)} y1={y} y2={y} stroke={it.color} strokeWidth={1.5} strokeOpacity={0.5} />
                          <circle cx={x(hi)} cy={y} r={4} fill={SURFACE} stroke={it.color} strokeWidth={2} />
                        </>
                      )}
                      {it.valor !== null && !it.menorQue && (
                        <circle cx={x(it.valor)} cy={y} r={4} fill={it.color} stroke={SURFACE} strokeWidth={2} />
                      )}
                      <rect x={x(lo ?? hi ?? dominio[0]) - 8} width={Math.max(16, x(hi ?? lo ?? dominio[0]) - x(lo ?? hi ?? dominio[0]) + 16)}
                        y={y - 8} height={16} fill="transparent" />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip t={tip} ancho={ancho} />
    </div>
  );
}

function recortar(texto: string, ancho: number) {
  const max = Math.floor(ancho / 6);
  return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
}

/* ---------------------------------------------------------------- Series chart */

export interface Serie {
  id: string;
  label: string;
  color: string;
  puntos: { x: number; y: number; etiqueta: string }[];
}

interface SeriesChartProps {
  series: Serie[];
  unidad: string;
  referencias?: Referencia[];
  tipo?: 'log' | 'linear';
  titulo: string;
  alto?: number;
}

/** Values over time on one y-axis; a crosshair shows every series at the hovered year. */
export function SeriesChart({ series, unidad, referencias = [], tipo = 'linear', titulo, alto = 210 }: SeriesChartProps) {
  const [ref, ancho] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const todos = series.flatMap((s) => s.puntos);
  const xs = todos.map((p) => p.x);
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
  const ys = [...todos.map((p) => p.y), ...referencias.map((r) => r.valor)];
  const izq = 44, der = 12, arriba = 14, abajo = 24;
  const x = escala('linear', x0, x1 === x0 ? x0 + 1 : x1, izq, ancho - der);
  const yd: [number, number] = tipo === 'log' ? dominioLog(ys) : [0, pasoLimpio(Math.max(...ys) / 4) * Math.ceil(Math.max(...ys) / pasoLimpio(Math.max(...ys) / 4))];
  const y = escala(tipo, yd[0], yd[1], alto - abajo, arriba);
  const anios = [...new Set(xs)].sort((a, b) => a - b);
  const xTicks = x.ticks.filter((t) => Number.isInteger(t));

  const mover = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left + izq;
    setHover(anios.reduce((best, a) => (Math.abs(x(a) - px) < Math.abs(x(best) - px) ? a : best), anios[0]));
  };

  return (
    <div ref={ref} className="chart" onMouseLeave={() => setHover(null)}>
      {series.length > 1 && (
        <ul className="chart-legend">
          {series.map((s) => <li key={s.id}><i style={{ background: s.color }} />{s.label}</li>)}
        </ul>
      )}
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label={titulo}>
          {y.ticks.map((t) => (
            <g key={t}>
              <line x1={izq} x2={ancho - der} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={izq - 6} y={y(t) + 4} textAnchor="end" className="chart-axis">{formatNum(t)}</text>
            </g>
          ))}
          {xTicks.filter((_, i) => xTicks.length < 9 || i % Math.ceil(xTicks.length / 8) === 0).map((t) => (
            <text key={t} x={x(t)} y={alto - 6} textAnchor="middle" className="chart-axis">{t}</text>
          ))}
          <text x={izq} y={arriba - 4} className="chart-axis chart-unit">{unidad}{tipo === 'log' ? ' · escala log' : ''}</text>
          {referencias.filter((r) => r.valor >= yd[0] && r.valor <= yd[1]).map((r) => (
            <g key={r.etiqueta}>
              <line x1={izq} x2={ancho - der} y1={y(r.valor)} y2={y(r.valor)} stroke={REF} strokeDasharray="4 3" />
              <text x={ancho - der} y={y(r.valor) - 4} textAnchor="end" className="chart-ref">{r.etiqueta}</text>
            </g>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={arriba} y2={alto - abajo} stroke={AXIS_TEXT} strokeOpacity={0.5} />}
          {series.map((s) => {
            const pts = [...s.puntos].sort((a, b) => a.x - b.x);
            return (
              <g key={s.id}>
                <polyline fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                  points={pts.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')} />
                {pts.map((p) => (
                  <circle key={p.x} cx={x(p.x)} cy={y(p.y)} r={hover === p.x ? 5 : 3.5} fill={s.color} stroke={SURFACE} strokeWidth={2} />
                ))}
              </g>
            );
          })}
          <rect x={izq} y={arriba} width={Math.max(0, ancho - izq - der)} height={alto - arriba - abajo} fill="transparent" onMouseMove={mover} />
        </svg>
      )}
      {hover !== null && ancho > 0 && (
        <Tooltip ancho={ancho} t={{
          x: x(hover), y: arriba + 8,
          contenido: (
            <>
              <strong>{series.flatMap((s) => s.puntos).find((p) => p.x === hover)?.etiqueta}</strong>
              {series.map((s) => {
                const p = s.puntos.find((q) => q.x === hover);
                return p ? <span key={s.id} className="chart-tooltip-row"><i style={{ background: s.color }} />{s.label}: {formatNum(p.y)} {unidad}</span> : null;
              })}
            </>
          ),
        }} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Timeline */

export interface HitoTimeline {
  id: string;
  label: string;
  inicio: number | null;
  fin: number | null;
  publicacion: number;
}

interface TimelineProps {
  hitos: HitoTimeline[];
  seleccionado: string | null;
  onSelect: (id: string) => void;
}

/** Sampling period of each study (bar) and its publication year (open dot). */
export function Timeline({ hitos, seleccionado, onSelect }: TimelineProps) {
  const [ref, ancho] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const anios = hitos.flatMap((h) => [h.inicio, h.fin, h.publicacion].filter((v): v is number => v !== null));
  const x0 = Math.floor(Math.min(...anios) / 5) * 5, x1 = Math.ceil((Math.max(...anios) + 0.5) / 5) * 5;
  const etiquetaW = Math.min(185, ancho * 0.32);
  const filaH = 22;
  const alto = hitos.length * filaH + 24;
  const x = escala('linear', x0, x1, etiquetaW + 8, ancho - 10);
  const ticks = [];
  for (let t = x0; t <= x1; t += 5) ticks.push(t);

  useEffect(() => setTip(null), [seleccionado]);

  return (
    <div ref={ref} className="chart" onMouseLeave={() => setTip(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label="Línea de tiempo de los estudios: periodo de muestreo y año de publicación">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={0} y2={alto - 20} stroke={GRID} />
              <text x={x(t)} y={alto - 6} textAnchor="middle" className="chart-axis">{t}</text>
            </g>
          ))}
          {hitos.map((h, i) => {
            const cy = i * filaH + filaH / 2;
            const activo = seleccionado === h.id;
            const op = seleccionado && !activo ? 0.35 : 1;
            const ini = h.inicio ?? h.publicacion, fin = h.fin ?? h.inicio ?? h.publicacion;
            return (
              <g key={h.id} opacity={op} style={{ cursor: 'pointer' }} onClick={() => onSelect(h.id)}
                onMouseMove={(e) => {
                  const box = ((e.currentTarget as SVGGraphicsElement).ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left, y: e.clientY - box.top + 10,
                    contenido: <><strong>{h.label}</strong><span>{h.inicio === null ? 'Muestreo no indicado' : h.inicio === h.fin ? `Muestreo ${h.inicio}` : `Muestreo ${h.inicio}–${h.fin}`}</span><span>Publicado en {h.publicacion}</span></>,
                  });
                }}>
                <rect x={0} y={cy - filaH / 2} width={ancho} height={filaH} fill={activo ? 'rgba(187,215,122,.08)' : 'transparent'} />
                <text x={0} y={cy + 4} className={`chart-label${activo ? ' is-active' : ''}`}>{recortar(h.label, etiquetaW)}</text>
                {h.inicio !== null && (
                  <line x1={x(ini)} x2={Math.max(x(fin + 1) - 2, x(ini) + 4)} y1={cy} y2={cy} stroke="#a7be78" strokeWidth={6} strokeLinecap="round" />
                )}
                <line x1={x(fin + 1)} x2={x(h.publicacion + 0.5)} y1={cy} y2={cy} stroke={AXIS_TEXT} strokeOpacity={0.35} />
                <circle cx={x(h.publicacion + 0.5)} cy={cy} r={4} fill={SURFACE} stroke={AXIS_TEXT} strokeWidth={2} />
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip t={tip} ancho={ancho} />
    </div>
  );
}
