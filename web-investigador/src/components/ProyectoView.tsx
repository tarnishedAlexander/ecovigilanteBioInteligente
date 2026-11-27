import React, { useMemo, useState } from 'react';
import { MapPin, Plus, Save, Trash2 } from 'lucide-react';
import type { ActividadProyecto, Comunidad, Financiador, Proyecto, ProyectoDatos, Reporte } from '../types';
import type { IndiceBio } from '../lib/bio';
import type { IndiceInv } from '../lib/investigacion';
import type { DatosMineria } from '../lib/mineria';
import {
  BASES_COSTO, ESTADOS_PROYECTO, RUBROS, TIPOS_FINANCIADOR, TIPO_CAMBIO, costoEnUso, datosDe, enUsd, formatMonto, porQueAqui,
  presupuesto, subtotal,
} from '../lib/proyectos';
import { DemoBadge, Section, Stat } from './primitives';

interface Props {
  proyecto: Proyecto;
  comunidad: Comunidad | undefined;
  reportes: Reporte[];
  bio: IndiceBio | null;
  inv: IndiceInv | null;
  mineria: DatosMineria | null;
  onSelectComunidad: (c: Comunidad) => void;
  onGuardar: (datos: ProyectoDatos, id: string) => Promise<void>;
}

const numero = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v.replace(',', '.'))));

/** Editable project sheet: why here, funders, work plan with quoted costs, schedule and expected results. */
export function ProyectoView({ proyecto, comunidad, reportes, bio, inv, mineria, onSelectComunidad, onGuardar }: Props) {
  const [d, setD] = useState<ProyectoDatos>(() => datosDe(proyecto));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const original = useMemo(() => JSON.stringify(datosDe(proyecto)), [proyecto]);
  const cambios = JSON.stringify(d) !== original;
  const b = presupuesto(d);
  const razones = comunidad ? porQueAqui({ comunidad, reportes, bio, inv, mineria }) : [];

  const set = <K extends keyof ProyectoDatos>(k: K, v: ProyectoDatos[K]) => setD((p) => ({ ...p, [k]: v }));
  const setAct = (id: string, cambio: Partial<ActividadProyecto>) =>
    set('actividades', d.actividades.map((a) => (a.id === id ? { ...a, ...cambio } : a)));
  const setFin = (i: number, cambio: Partial<Financiador>) =>
    set('financiadores', d.financiadores.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(d, proyecto.id);
    } catch {
      setError('No se pudo guardar. Revisa la conexión o la clave de investigador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select className="project-select" value={d.estado} aria-label="Estado del proyecto"
            onChange={(e) => set('estado', e.target.value as ProyectoDatos['estado'])}>
            {ESTADOS_PROYECTO.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          {d.demo && <DemoBadge />}
        </div>
        <textarea className="project-input project-title-input" rows={2} value={d.titulo} aria-label="Título"
          onChange={(e) => set('titulo', e.target.value)} />
        {comunidad && (
          <button className="table-site mt-1 text-[13px]" onClick={() => onSelectComunidad(comunidad)}>
            <MapPin size={12} />{comunidad.nombre} · {comunidad.departamento}
          </button>
        )}
        <label className="project-label mt-3">Objetivo</label>
        <textarea className="project-input" rows={2} value={d.objetivo} onChange={(e) => set('objetivo', e.target.value)} />
      </div>

      <div className="project-budget mx-5 mb-4">
        <small>Costo estimado del proyecto</small>
        <strong>{formatMonto(b.total, d.moneda)}</strong>
        {d.moneda === 'BOB' && <span>≈ USD {Math.round(enUsd(b.total)).toLocaleString('es-BO')} · Bs {TIPO_CAMBIO.bsPorUsd.toLocaleString('es-BO')} por USD ({TIPO_CAMBIO.fuente}, {TIPO_CAMBIO.fecha})</span>}
        <BarraBases porBase={b.porBase} total={b.total} />
      </div>

      <div className="mx-5 mb-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line">
        <Stat label="Rubros por cotizar" value={b.porCotizar} />
        <Stat label="Fondos confirmados" value={formatMonto(b.confirmado, d.moneda)} />
        <Stat label="Duración" value={`${d.duracion_meses} meses`} />
      </div>

      {razones.length > 0 && (
        <Section title="Por qué aquí" aside={<span className="text-[11px] text-ink-3">calculado con datos del atlas</span>}>
          <ul className="project-bullets">{razones.map((r) => <li key={r}>{r}</li>)}</ul>
        </Section>
      )}

      <Section title="Financiadores">
        <ul className="grid gap-2">
          {d.financiadores.map((f, i) => (
            <li key={i} className="project-funder">
              <div className="flex items-center gap-2">
                <input className="project-input flex-1" value={f.nombre} aria-label="Nombre del financiador" onChange={(e) => setFin(i, { nombre: e.target.value })} />
                <button className="icon-btn" aria-label="Quitar financiador" title="Quitar" onClick={() => set('financiadores', d.financiadores.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select className="project-select" value={f.tipo} aria-label="Tipo de financiador" onChange={(e) => setFin(i, { tipo: e.target.value as Financiador['tipo'] })}>
                  {Object.entries(TIPOS_FINANCIADOR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="segmented" role="group" aria-label="Estado del financiamiento">
                  {(['potencial', 'confirmado'] as const).map((e) => (
                    <button key={e} aria-pressed={f.estado === e} className={f.estado === e ? 'active' : ''}
                      onClick={() => setFin(i, { estado: e, monto_comprometido: e === 'potencial' ? null : f.monto_comprometido })}>
                      {e === 'potencial' ? 'Potencial' : 'Confirmado'}
                    </button>
                  ))}
                </div>
                {f.estado === 'confirmado' && (
                  <input className="project-input w-32 text-right" inputMode="decimal" placeholder="Monto" aria-label="Monto comprometido"
                    value={f.monto_comprometido ?? ''} onChange={(e) => setFin(i, { monto_comprometido: numero(e.target.value) })} />
                )}
              </div>
              {f.nota && <p className="mt-2 text-[11.5px] leading-snug text-ink-3">{f.nota}</p>}
              {f.estado === 'confirmado' && <p className="mt-1 text-[11px] text-ochre">Confirmado solo con convenio o carta adjunta.</p>}
            </li>
          ))}
        </ul>
        <button className="research-more mt-2 inline-flex items-center gap-1"
          onClick={() => set('financiadores', [...d.financiadores, { nombre: 'Nuevo financiador', tipo: 'por_definir', estado: 'potencial', monto_comprometido: null, nota: null }])}>
          <Plus size={13} /> Agregar financiador
        </button>
      </Section>

      <Section title="Plan de trabajo y presupuesto" aside={<span className="text-[11px] text-ink-3">costos en {d.moneda === 'BOB' ? 'bolivianos' : 'dólares'}</span>}>
        <p className="mb-2 text-[11.5px] leading-snug text-ink-3">Mientras no haya cotización, cada línea usa un costo referencial (con fuente pública) o un supuesto (sin fuente). Al escribir un costo cotizado, este reemplaza a la estimación.</p>
        <div className="research-table-wrap">
          <table className="research-table project-table">
            <thead><tr><th>Actividad</th><th className="num">Cantidad</th><th className="num">Cotizado</th><th className="num">Subtotal</th></tr></thead>
            <tbody>
              {d.actividades.map((a) => {
                const st = subtotal(a);
                const uso = costoEnUso(a);
                return (
                  <tr key={a.id}>
                    <td>
                      <strong className="block font-medium">{a.nombre}</strong>
                      <small className="block">{RUBROS[a.rubro]} · meses {a.mes_inicio}–{a.mes_fin}</small>
                      {a.descripcion && <small className="block">{a.descripcion}</small>}
                    </td>
                    <td className="num">
                      <input className="project-input w-16 text-right" inputMode="decimal" aria-label={`Cantidad de ${a.nombre}`}
                        value={a.cantidad} onChange={(e) => setAct(a.id, { cantidad: numero(e.target.value) ?? 0 })} />
                      <small className="block">{a.unidad}</small>
                    </td>
                    <td className="num">
                      <input className="project-input w-20 text-right" inputMode="decimal" placeholder={a.costo_referencial !== null ? String(a.costo_referencial) : 'sin costo'}
                        aria-label={`Costo unitario cotizado de ${a.nombre}`}
                        value={a.costo_unitario ?? ''} onChange={(e) => setAct(a.id, { costo_unitario: numero(e.target.value) })} />
                    </td>
                    <td className="num">
                      {st === null ? <small>—</small> : formatMonto(st, d.moneda)}
                      {uso && <span className={`cost-base is-${uso.base}`} title={a.costo_unitario === null ? a.fuente_costo ?? BASES_COSTO[uso.base].detalle : BASES_COSTO.cotizado.detalle}>
                        {BASES_COSTO[uso.base].label}{uso.base !== 'cotizado' && ` · ${formatMonto(uso.valor, d.moneda)} c/u`}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr><td colSpan={3}>Costo estimado{b.porCotizar ? ` (${b.porCotizar} rubros aún sin cotización)` : ''}</td><td className="num"><strong>{formatMonto(b.total, d.moneda)}</strong></td></tr>
            </tfoot>
          </table>
        </div>
        {b.porRubro.size > 0 && (
          <ul className="project-rubros">
            {[...b.porRubro.entries()].filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).map(([r, v]) => (
              <li key={r}><span>{RUBROS[r]}</span><span>{formatMonto(v, d.moneda)} · {Math.round((v / b.total) * 100)} %</span></li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Fuentes de los costos estimados">
        <ul className="project-sources">
          {[...new Set(d.actividades.filter((a) => a.costo_unitario === null && a.fuente_costo).map((a) => a.fuente_costo!))].map((f) => (
            <li key={f} className={f.startsWith('Supuesto') ? 'is-supuesto' : ''}>{f}</li>
          ))}
        </ul>
      </Section>

      <Section title="Cronograma">
        <Cronograma actividades={d.actividades} meses={d.duracion_meses} />
      </Section>

      <Section title="Contrapartes">
        <ListaEditable items={d.contrapartes} onChange={(v) => set('contrapartes', v)} agregar="Agregar contraparte" />
      </Section>

      <Section title="Resultados esperados">
        <ListaEditable items={d.resultados} onChange={(v) => set('resultados', v)} agregar="Agregar resultado" />
      </Section>

      <Section title="Notas">
        <textarea className="project-input" rows={3} value={d.notas} placeholder="Acuerdos, pendientes, contactos…" onChange={(e) => set('notas', e.target.value)} />
      </Section>

      <div className="project-save">
        {error && <span className="text-[12px] text-clay">{error}</span>}
        {!error && <span className="text-[12px] text-ink-3">{cambios ? 'Cambios sin guardar' : 'Todo guardado'}</span>}
        <button className="btn-primary" disabled={!cambios || guardando} onClick={guardar}>
          <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </>
  );
}

function BarraBases({ porBase, total }: { porBase: Record<'cotizado' | 'referencial' | 'supuesto', number>; total: number }) {
  if (total <= 0) return null;
  const orden = ['cotizado', 'referencial', 'supuesto'] as const;
  return (
    <>
      <div className="cost-bar" role="img" aria-label={orden.map((k) => `${BASES_COSTO[k].label} ${Math.round((porBase[k] / total) * 100)} %`).join(', ')}>
        {orden.map((k) => porBase[k] > 0 && <i key={k} className={`is-${k}`} style={{ flexGrow: porBase[k] }} />)}
      </div>
      <ul className="cost-legend">
        {orden.map((k) => (
          <li key={k} title={BASES_COSTO[k].detalle}><i className={`is-${k}`} />{BASES_COSTO[k].label} <strong>{formatMonto(porBase[k])}</strong></li>
        ))}
      </ul>
    </>
  );
}

function Cronograma({ actividades, meses }: { actividades: ActividadProyecto[]; meses: number }) {
  return (
    <div className="gantt" style={{ ['--meses' as string]: meses }}>
      <div className="gantt-row gantt-head"><span />{Array.from({ length: meses }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
      {actividades.map((a) => (
        <div key={a.id} className="gantt-row">
          <span className="gantt-label" title={a.nombre}>{a.nombre}</span>
          <i style={{ gridColumn: `${a.mes_inicio + 1} / ${Math.min(a.mes_fin, meses) + 2}` }} />
        </div>
      ))}
    </div>
  );
}

function ListaEditable({ items, onChange, agregar }: { items: string[]; onChange: (v: string[]) => void; agregar: string }) {
  return (
    <>
      <ul className="grid gap-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <input className="project-input flex-1" value={t} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button className="icon-btn" aria-label="Quitar" title="Quitar" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <button className="research-more mt-2 inline-flex items-center gap-1" onClick={() => onChange([...items, ''])}><Plus size={13} /> {agregar}</button>
    </>
  );
}
