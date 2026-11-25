import React, { useState } from 'react';
import { ArrowLeft, Check, Crosshair, Minus } from 'lucide-react';
import { Reporte, Comunidad, Bioindicador } from '../types';
import { CATEGORIAS, SINTOMAS, alertaTone, estadoTone, formatCoord, formatFecha } from '../lib/ui';

interface SidebarProps {
  reportes: Reporte[];
  comunidades: Comunidad[];
  bioindicadores: Bioindicador[];
  selectedReporte: Reporte | null;
  selectedComunidad: Comunidad | null;
  onSelectReporte: (reporte: Reporte | null) => void;
  onSelectComunidad: (comunidad: Comunidad | null) => void;
  onUpdateEstado: (id: string, estado: string, notas?: string) => Promise<void>;
  onFlyTo: (lat: number, lng: number) => void;
}

type Tab = 'reportes' | 'comunidades' | 'bioindicadores';

/* ---------- Small presentational pieces ---------- */

const Pill: React.FC<{ text: string; bg: string; color: string; children: React.ReactNode }> = ({
  text,
  bg,
  color,
  children,
}) => (
  <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ${bg} ${text}`}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
    {children}
  </span>
);

const EstadoPill: React.FC<{ estado: string }> = ({ estado }) => {
  const t = estadoTone(estado);
  return (
    <Pill text={t.text} bg={t.bg} color={t.color}>
      {t.label}
    </Pill>
  );
};

const ScoreBar: React.FC<{ score: number }> = ({ score }) => (
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

const Section: React.FC<{ title: string; aside?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  aside,
  children,
}) => (
  <section className="border-t border-line px-5 py-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="eyebrow">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 text-[13px]">
    <dt className="text-ink-3">{label}</dt>
    <dd className="text-ink">{children}</dd>
  </div>
);

/* ---------- Sidebar ---------- */

export const Sidebar: React.FC<SidebarProps> = ({
  reportes,
  comunidades,
  bioindicadores,
  selectedReporte,
  onSelectReporte,
  onSelectComunidad,
  onUpdateEstado,
  onFlyTo,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('reportes');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [notasTemp, setNotasTemp] = useState<string>('');
  const [savingEstado, setSavingEstado] = useState<boolean>(false);

  const filteredReportes = reportes.filter((r) => filterEstado === 'todos' || r.estado === filterEstado);

  const handleUpdate = async (nuevoEstado: string) => {
    if (!selectedReporte) return;
    setSavingEstado(true);
    try {
      await onUpdateEstado(selectedReporte.id, nuevoEstado, notasTemp || selectedReporte.notas_investigador);
      setNotasTemp('');
    } finally {
      setSavingEstado(false);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'reportes', label: 'Reportes', count: reportes.length },
    { id: 'comunidades', label: 'Comunidades', count: comunidades.length },
    { id: 'bioindicadores', label: 'Bioindicadores' },
  ];

  return (
    <aside className="z-20 flex w-[400px] shrink-0 flex-col overflow-hidden border-r border-line bg-surface">
      {/* Tabs */}
      <nav className="flex shrink-0 border-b border-line px-5" role="tablist">
        {tabs.map((t) => {
          const active = activeTab === t.id && !selectedReporte;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(t.id);
                onSelectReporte(null);
              }}
              className={`-mb-px mr-5 flex items-center gap-1.5 border-b-2 py-3 text-[13px] font-medium transition-colors ${
                active ? 'border-forest-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="rounded bg-paper px-1.5 text-[11px] font-semibold text-ink-2">{t.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {selectedReporte ? (
        /* ---------- Report detail ---------- */
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={() => onSelectReporte(null)}
              className="flex items-center gap-1 text-[13px] font-medium text-forest-600 hover:text-forest-700"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al listado
            </button>
            <span className="font-mono text-[11px] text-ink-3">{selectedReporte.id}</span>
          </div>

          <div className="px-5 pb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <EstadoPill estado={selectedReporte.estado} />
              <span className="text-[12px] text-ink-3">{formatFecha(selectedReporte.fecha_reporte)}</span>
            </div>
            <h2 className="font-serif text-[20px] font-semibold leading-snug text-ink">
              {CATEGORIAS[selectedReporte.categoria] ?? selectedReporte.categoria} · {selectedReporte.comunidad_nombre}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
              {selectedReporte.descripcion_usuario || 'Sin descripción del comunario.'}
            </p>
          </div>

          {selectedReporte.url_foto && (
            <figure className="px-5 pb-4">
              <img
                src={selectedReporte.url_foto}
                alt="Evidencia fotográfica del reporte"
                className="h-44 w-full rounded border border-line object-cover"
              />
              <figcaption className="mt-1.5 text-[11px] text-ink-3">Fotografía enviada por el comunario</figcaption>
            </figure>
          )}

          <Section title="Ubicación">
            <dl>
              <Field label="Comunidad">{selectedReporte.comunidad_nombre}</Field>
              <Field label="Coordenadas">
                <span className="flex items-center justify-between">
                  {formatCoord(selectedReporte.latitud, selectedReporte.longitud)}
                  <button
                    onClick={() => onFlyTo(selectedReporte.latitud, selectedReporte.longitud)}
                    className="ml-2 text-forest-600 hover:text-forest-700"
                    title="Centrar en el mapa"
                    aria-label="Centrar en el mapa"
                  >
                    <Crosshair className="h-4 w-4" />
                  </button>
                </span>
              </Field>
              <Field label="Sincronizado">{formatFecha(selectedReporte.fecha_sincronizacion)}</Field>
            </dl>
          </Section>

          {selectedReporte.entrevista_ia && (
            <Section
              title="Entrevista asistida (Gemma, en dispositivo)"
              aside={<ScoreBar score={selectedReporte.entrevista_ia.score_sospecha} />}
            >
              <dl className="mb-3">
                <Field label="Consumo de pescado">
                  <span className="capitalize">{selectedReporte.entrevista_ia.frecuencia_consumo_pescado ?? '—'}</span>
                </Field>
                {selectedReporte.entrevista_ia.tipos_pescado_mencionados.length > 0 && (
                  <Field label="Especies">
                    <span className="capitalize">{selectedReporte.entrevista_ia.tipos_pescado_mencionados.join(', ')}</span>
                  </Field>
                )}
                {selectedReporte.entrevista_ia.tiempo_con_sintomas && (
                  <Field label="Evolución">{selectedReporte.entrevista_ia.tiempo_con_sintomas}</Field>
                )}
                {selectedReporte.entrevista_ia.fuente_agua_comunal && (
                  <Field label="Fuente de agua">{selectedReporte.entrevista_ia.fuente_agua_comunal}</Field>
                )}
              </dl>

              <div className="eyebrow mb-2">Síntomas referidos</div>
              <ul className="divide-y divide-line rounded border border-line">
                {Object.entries(selectedReporte.entrevista_ia.sintomas).map(([key, val]) => (
                  <li key={key} className="flex items-center gap-2.5 px-3 py-2 text-[13px]">
                    {val ? (
                      <Check className="h-4 w-4 shrink-0 text-clay" />
                    ) : (
                      <Minus className="h-4 w-4 shrink-0 text-line-strong" />
                    )}
                    <span className={val ? 'text-ink' : 'text-ink-3'}>{SINTOMAS[key] ?? key}</span>
                  </li>
                ))}
              </ul>

              {selectedReporte.entrevista_ia.indicio_ambiental_adicional && (
                <blockquote className="mt-3 border-l-2 border-ochre bg-ochre-bg/60 px-3 py-2 text-[13px] leading-relaxed text-ink-2">
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-ochre">
                    Observación ambiental
                  </span>
                  {selectedReporte.entrevista_ia.indicio_ambiental_adicional}
                </blockquote>
              )}
            </Section>
          )}

          <Section title="Evaluación del investigador">
            {selectedReporte.notas_investigador && (
              <div className="mb-3 rounded border border-line bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink-2">
                <span className="mb-0.5 block text-[11px] font-semibold text-ink-3">Notas registradas</span>
                {selectedReporte.notas_investigador}
              </div>
            )}

            <label htmlFor="notas" className="mb-1 block text-[12px] text-ink-3">
              Nueva nota o criterio de muestreo
            </label>
            <textarea
              id="notas"
              value={notasTemp}
              onChange={(e) => setNotasTemp(e.target.value)}
              placeholder="Ej.: programar muestreo de cabello y sedimento…"
              className="h-20 w-full resize-none rounded border border-line-strong bg-surface p-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={savingEstado} onClick={() => handleUpdate('semiverificado')} className="btn-secondary">
                Marcar semiverificado
              </button>
              <button disabled={savingEstado} onClick={() => handleUpdate('verificado')} className="btn-primary">
                Verificar (laboratorio)
              </button>
            </div>
          </Section>
        </div>
      ) : activeTab === 'reportes' ? (
        /* ---------- Report list ---------- */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-1 border-b border-line bg-paper/60 px-5 py-2.5">
            {['todos', 'crudo', 'semiverificado', 'verificado'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                className={`rounded px-2 py-1 text-[12px] font-medium transition-colors ${
                  filterEstado === st ? 'bg-ink text-white' : 'text-ink-2 hover:bg-line/60'
                }`}
              >
                {st === 'todos' ? 'Todos' : estadoTone(st).label}
              </button>
            ))}
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {filteredReportes.length === 0 && (
              <li className="px-5 py-10 text-center text-[13px] text-ink-3">No hay reportes con este estado.</li>
            )}
            {filteredReportes.map((rep) => (
              <li key={rep.id}>
                <button
                  onClick={() => {
                    onSelectReporte(rep);
                    onFlyTo(rep.latitud, rep.longitud);
                  }}
                  className="relative block w-full px-5 py-3.5 text-left transition-colors hover:bg-paper"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: estadoTone(rep.estado).color }} />
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">
                      {CATEGORIAS[rep.categoria] ?? rep.categoria}
                    </span>
                    <EstadoPill estado={rep.estado} />
                  </div>
                  <p className="mb-2 line-clamp-2 text-[13px] leading-snug text-ink-2">
                    {rep.descripcion_usuario || 'Reporte de síntomas o indicio ambiental'}
                  </p>
                  <div className="flex items-center justify-between text-[12px] text-ink-3">
                    <span>
                      {rep.comunidad_nombre} · {formatFecha(rep.fecha_reporte)}
                    </span>
                    <span>
                      Sospecha <span className="font-semibold text-ink-2">{rep.score_sospecha}/5</span>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : activeTab === 'comunidades' ? (
        /* ---------- Communities ---------- */
        <ul className="flex-1 divide-y divide-line overflow-y-auto">
          {comunidades.map((c) => {
            const t = alertaTone(c.alerta_nivel);
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    onSelectComunidad(c);
                    onFlyTo(c.latitud, c.longitud);
                  }}
                  className="block w-full px-5 py-3.5 text-left transition-colors hover:bg-paper"
                >
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-ink">{c.nombre}</span>
                    <Pill text={t.text} bg={t.bg} color={t.color}>
                      Alerta {t.label.toLowerCase()}
                    </Pill>
                  </div>
                  <div className="mb-2 text-[12px] text-ink-3">
                    {c.cuenca_principal} · {c.departamento} · {c.poblacion_estimada.toLocaleString('es-BO')} hab.
                    {c.total_reportes !== undefined && ` · ${c.total_reportes} reportes`}
                  </div>
                  <p className="text-[13px] leading-snug text-ink-2">
                    <span className="text-ink-3">Posible fuente aguas arriba: </span>
                    {c.posible_fuente_minera_aguas_arriba}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        /* ---------- Bioindicators ---------- */
        <div className="flex-1 overflow-y-auto">
          <p className="border-b border-line bg-water-light/60 px-5 py-3 text-[13px] leading-relaxed text-ink-2">
            <span className="font-semibold text-water">Biomagnificación.</span> Los peces piscívoros (surubí, muturo)
            concentran metilmercurio hasta 10 veces más que los detritívoros (sábalo).
          </p>
          <ul className="divide-y divide-line">
            {bioindicadores.map((b) => {
              const t = alertaTone(b.nivel_bioacumulacion);
              return (
                <li key={b.id} className="px-5 py-4">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-[14px] font-semibold text-ink">{b.nombre_comun}</h4>
                      <p className="text-[12px] italic text-ink-3">{b.nombre_cientifico}</p>
                    </div>
                    <Pill text={t.text} bg={t.bg} color={t.color}>
                      {b.nivel_bioacumulacion}
                    </Pill>
                  </div>
                  <p className="mb-2 text-[13px] leading-relaxed text-ink-2">{b.descripcion_ecologica}</p>
                  <p className="text-[12px] leading-relaxed text-ink-2">
                    <span className="font-semibold text-ink">Riesgo en la dieta: </span>
                    {b.factor_riesgo_salud}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
};
