import React, { useState } from 'react';
import { ChevronRight, Compass, PanelRightClose, Star, X } from 'lucide-react';
import { Comunidad, Grupo, Reporte, Taxon } from '../types';
import { CATEGORIAS, estadoTone, formatFecha } from '../lib/ui';
import { FOTOS_BIOINDICADOR } from '../data/expedientes';
import { ESTADOS_TAXON, GRUPOS, IndiceBio, estadoTaxon, fotoUrl, ordenarTaxones } from '../lib/bio';
import type { AtlasSection } from './Header';
import { CommunityDirectory } from './CommunityDirectory';
import { MiningDirectory } from './MiningDirectory';
import type { DatosMineria, ZonaMinera } from '../lib/mineria';
import { EstadoPill } from './primitives';

export type BioFilter = { kind: 'grupo'; grupo: Grupo } | { kind: 'taxon'; id: string } | null;
interface ExplorerPanelProps {
  view: AtlasSection;
  detailOpen: boolean;
  comunidades: Comunidad[];
  bio: IndiceBio | null;
  reportes: Reporte[];
  loading: boolean;
  filter: BioFilter;
  onFilter: (filter: BioFilter) => void;
  onSelectComunidad: (c: Comunidad) => void;
  onSelectBio: (t: Taxon) => void;
  onSelectReporte: (r: Reporte) => void;
  onHoverComunidad: (id: string | null) => void;
  compact: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  mineria: DatosMineria | null;
  mineriaError: boolean;
  onRetryMineria: () => void;
  onSelectZona: (zona: ZonaMinera) => void;
  onHoverZona: (id: string | null) => void;
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  view, detailOpen, comunidades, bio, reportes, loading, filter, onFilter,
  onSelectComunidad, onSelectBio, onSelectReporte, onHoverComunidad, compact, onExpand, onCollapse,
  mineria, mineriaError, onRetryMineria, onSelectZona, onHoverZona,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const filteredReportes = reportes.filter((r) => estado === 'todos' || r.estado === estado);
  const grupo: Grupo = filter?.kind === 'grupo' ? filter.grupo
    : filter?.kind === 'taxon' ? bio?.taxon.get(filter.id)?.grupo ?? 'pez' : 'pez';
  const species = bio ? ordenarTaxones(bio.catalogo.taxones.filter((t) => t.grupo === grupo), bio) : [];
  const conteo = (g: Grupo) => bio?.catalogo.taxones.filter((t) => t.grupo === g).length ?? 0;
  if (detailOpen) return null;
  if (compact) {
    return (
      <div className="explorer-compact panel-left">
        <button onClick={onExpand} className="compact-open"><Compass size={19} /><span><strong>Explorar la cuenca</strong><small>{filter ? 'Filtro de bioindicadores activo' : view === 'mineria' ? 'Zonas mineras' : view === 'investigacion' ? 'Estudios de mercurio por matriz' : view === 'proyectos' ? 'Proyectos e inversión por comunidad' : 'Comunidades y bioindicadores'}</small></span></button>
        {filter && <button className="compact-clear" onClick={() => onFilter(null)} aria-label="Quitar filtro"><X size={17} /></button>}
      </div>
    );
  }

  return (
    <aside className="explorer" aria-label="Atlas de la cuenca">
      <button className="explorer-close" onClick={onCollapse} title="Ampliar mapa" aria-label="Ampliar mapa"><PanelRightClose size={17} /></button>
      {view === 'comunidades' && <CommunityDirectory comunidades={comunidades} loading={loading}
        query={busqueda} onSearch={setBusqueda} onHover={onHoverComunidad} onSelect={onSelectComunidad} />}
      {view === 'bioindicadores' && <div className="explorer-body">
        <h2>Bioindicadores</h2>
        <p>Mercurio medido en estudios publicados de la Amazonía y especies emparentadas presentes en Bolivia.</p>
        <div className="report-filters" role="group" aria-label="Grupo biológico">
          {GRUPOS.map((g) => (
            <button key={g.id} className={grupo === g.id ? 'active' : ''} aria-pressed={grupo === g.id}
              onClick={() => onFilter({ kind: 'grupo', grupo: g.id })}>{g.label} <small>{conteo(g.id)}</small></button>
          ))}
        </div>
        {!bio ? <p className="explorer-empty" role="status">{loading ? 'Cargando catálogo…' : 'Catálogo no disponible.'}</p> : <>
          {filter && <div className="filter-status mt-3"><span aria-live="polite">Sitios de muestreo resaltados en el mapa</span><button onClick={() => onFilter(null)}>Ver todos</button></div>}
          <div className="list-heading"><span>{GRUPOS.find((g) => g.id === grupo)?.label.toUpperCase()}</span><span>{species.length}</span></div>
          <ul className="species-list">{species.map((t) => {
            const foto = t.foto ? { src: fotoUrl(t.foto.archivo, 120) } : FOTOS_BIOINDICADOR[t.id];
            const estado = ESTADOS_TAXON[estadoTaxon(t, bio)];
            const active = filter?.kind === 'taxon' && filter.id === t.id;
            return <li key={t.id}>
              <button aria-pressed={active} className={active ? 'active' : ''} onClick={() => onFilter({ kind: 'taxon', id: t.id })}>
                {foto ? <img src={foto.src} alt="" loading="lazy" /> : <span className="species-placeholder" style={{ ['--estado' as string]: estado.color }}><i /></span>}
                <span>
                  <strong>{t.nombre_comun}{t.prioridad && <Star size={12} className="ml-1 inline text-ochre" aria-label="Prioridad de investigación" />}</strong>
                  <small className={t.nivel === 'especie' ? 'italic' : ''}>{t.nombre_cientifico}</small>
                  <small className="species-estado"><i style={{ background: estado.color }} />{estado.label}</small>
                </span>
                <ChevronRight size={16} />
              </button>
              {active && <button className="species-detail" onClick={() => onSelectBio(t)}>Ver ficha</button>}
            </li>;
          })}</ul>
          <p className="demo-note mt-3"><Star size={11} className="inline text-ochre" /> Prioridad para proyectos de investigación en Bolivia.</p>
          <p className="demo-note">Los candidatos viven en Bolivia pero no tienen mediciones propias: su ficha resume la base científica y una propuesta de estudio. Aún no hay estudios amazónicos de mercurio en anfibios ni en microorganismos en el catálogo.</p>
        </>}
      </div>}
      {view === 'mineria' && <MiningDirectory mineria={mineria} error={mineriaError} onRetry={onRetryMineria}
        comunidades={comunidades} onSelect={onSelectZona} onHover={onHoverZona} />}
      {view === 'reportes' && <div className="explorer-body">
        <h2>Reportes</h2><p>Revisa las observaciones enviadas desde las comunidades.</p>
        <div className="report-filters">{['todos', 'crudo', 'semiverificado', 'verificado', 'descartado'].map((s) => <button key={s} onClick={() => setEstado(s)} className={estado === s ? 'active' : ''}>{s === 'todos' ? 'Todos' : estadoTone(s).label}</button>)}</div>
        <ul className="report-list">{filteredReportes.map((r) => <li key={r.id}><button onClick={() => onSelectReporte(r)}><span className="report-list-top"><strong>{CATEGORIAS[r.categoria] ?? r.categoria}</strong><EstadoPill estado={r.estado} /></span><span>{r.descripcion_usuario || 'Reporte comunitario'}</span><small>{r.comunidad_nombre} · {formatFecha(r.fecha_reporte)}</small></button></li>)}</ul>
        {filteredReportes.length === 0 && <p className="explorer-empty">No hay reportes con este estado.</p>}
      </div>}
    </aside>
  );
};
