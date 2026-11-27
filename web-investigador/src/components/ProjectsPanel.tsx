import React, { useState } from 'react';
import { ChevronRight, PanelRightClose } from 'lucide-react';
import type { Comunidad, EstadoProyecto, Proyecto } from '../types';
import { ESTADOS_PROYECTO, enUsd, estadoProyecto, formatMonto, presupuesto } from '../lib/proyectos';
import { DemoBadge } from './primitives';

interface Props {
  proyectos: Proyecto[] | null;
  comunidades: Comunidad[];
  loading: boolean;
  onSelect: (p: Proyecto) => void;
  onCollapse: () => void;
}

export function EstadoProyectoPill({ estado }: { estado: EstadoProyecto }) {
  const e = estadoProyecto(estado);
  return <span className="project-state"><i style={{ background: e.color }} />{e.label}</span>;
}

/** Portfolio of research projects by community: state, funders and the quoted budget. */
export function ProjectsPanel({ proyectos, comunidades, loading, onSelect, onCollapse }: Props) {
  const [filtro, setFiltro] = useState<EstadoProyecto | null>(null);
  const lista = (proyectos ?? []).filter((p) => !filtro || p.estado === filtro);
  const nombre = (id: string) => comunidades.find((c) => c.id === id)?.nombre ?? id;
  const totales = (proyectos ?? []).map(presupuesto);
  const estimado = totales.reduce((s, t) => s + t.total, 0);
  const cotizado = totales.reduce((s, t) => s + t.porBase.cotizado, 0);
  const confirmado = totales.reduce((s, t) => s + t.confirmado, 0);

  return (
    <aside className="explorer explorer-wide" aria-label="Proyectos">
      <button className="explorer-close" onClick={onCollapse} title="Ampliar mapa" aria-label="Ampliar mapa"><PanelRightClose size={17} /></button>
      <div className="explorer-body research">
        <h2>Proyectos</h2>
        <p>Investigaciones propuestas o en curso por comunidad, con su plan de trabajo, presupuesto y financiadores. Abre una comunidad en Territorio para generar una propuesta nueva.</p>

        {!proyectos ? <p className="explorer-empty" role="status">{loading ? 'Cargando proyectos…' : 'Proyectos no disponibles.'}</p> : <>
          <div className="research-stats">
            <div><small>Proyectos</small><strong>{proyectos.length}</strong></div>
            <div><small>Costo estimado total</small><strong>{formatMonto(estimado)}</strong><span>≈ USD {Math.round(enUsd(estimado)).toLocaleString('es-BO')}</span></div>
            <div><small>Ya cotizado</small><strong>{formatMonto(cotizado)}</strong></div>
            <div><small>Fondos confirmados</small><strong>{formatMonto(confirmado)}</strong><span>Con convenio o carta</span></div>
          </div>

          <div className="report-filters mt-4" role="group" aria-label="Estado del proyecto">
            <button className={!filtro ? 'active' : ''} aria-pressed={!filtro} onClick={() => setFiltro(null)}>Todos <small>{proyectos.length}</small></button>
            {ESTADOS_PROYECTO.map((e) => {
              const n = proyectos.filter((p) => p.estado === e.id).length;
              return n > 0 && (
                <button key={e.id} className={filtro === e.id ? 'active' : ''} aria-pressed={filtro === e.id} onClick={() => setFiltro(e.id)}>
                  {e.label} <small>{n}</small>
                </button>
              );
            })}
          </div>

          <ul className="study-list mt-3">
            {lista.map((p) => {
              const b = presupuesto(p);
              return (
                <li key={p.id}>
                  <button className="study-main project-card" onClick={() => onSelect(p)}>
                    <span className="study-top">
                      <EstadoProyectoPill estado={p.estado} />
                      {p.demo && <DemoBadge />}
                    </span>
                    <strong className="project-title">{p.titulo}</strong>
                    <span className="study-title not-italic">{nombre(p.comunidad_id)} · {p.duracion_meses} meses · {p.actividades.length} actividades</span>
                    <span className="project-money">
                      {formatMonto(b.total, p.moneda)} <small>estimado</small>
                      {b.porCotizar > 0 && <small> · {b.porCotizar} de {p.actividades.length} rubros aún sin cotización</small>}
                    </span>
                    <span className="project-funders">
                      {p.financiadores.map((f) => (
                        <span key={f.nombre} className={`study-check ${f.estado === 'confirmado' ? 'is-ok' : 'is-hoja'}`}>
                          {f.nombre} · {f.estado === 'confirmado' ? 'Confirmado' : 'Potencial'}
                        </span>
                      ))}
                    </span>
                    <ChevronRight size={16} className="project-chevron" />
                  </button>
                </li>
              );
            })}
          </ul>
          {lista.length === 0 && <p className="explorer-empty">No hay proyectos en este estado.</p>}
          <p className="demo-note mt-3">Un financiador aparece como confirmado solo con convenio o carta. Los proyectos de demostración son ficticios y no representan compromisos de ninguna institución.</p>
        </>}
      </div>
    </aside>
  );
}
