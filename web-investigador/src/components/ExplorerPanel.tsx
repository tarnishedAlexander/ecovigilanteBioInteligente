import React, { useState } from 'react';
import { ChevronRight, Compass, Fish, Leaf, PanelRightClose, X } from 'lucide-react';
import { Bioindicador, Comunidad, Reporte } from '../types';
import { CATEGORIAS, estadoTone, formatFecha } from '../lib/ui';
import { FOTOS_BIOINDICADOR } from '../data/expedientes';
import type { AtlasSection } from './Header';
import { CommunityDirectory } from './CommunityDirectory';
import { MiningDirectory } from './MiningDirectory';
import type { DatosMineria, ZonaMinera } from '../lib/mineria';
import { EstadoPill } from './primitives';

export type BioFilter = { kind: 'category'; category: 'peces' | 'plantas' } | { kind: 'species'; id: string } | null;
interface ExplorerPanelProps {
  view: AtlasSection;
  detailOpen: boolean;
  comunidades: Comunidad[];
  bioindicadores: Bioindicador[];
  reportes: Reporte[];
  loading: boolean;
  filter: BioFilter;
  matchingCommunities: number;
  onFilter: (filter: BioFilter) => void;
  onSelectComunidad: (c: Comunidad) => void;
  onSelectBio: (b: Bioindicador) => void;
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
  view, detailOpen, comunidades, bioindicadores, reportes, loading, filter, matchingCommunities, onFilter,
  onSelectComunidad, onSelectBio, onSelectReporte, onHoverComunidad, compact, onExpand, onCollapse,
  mineria, mineriaError, onRetryMineria, onSelectZona, onHoverZona,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const filteredReportes = reportes.filter((r) => estado === 'todos' || r.estado === estado);
  const category = filter?.kind === 'category' ? filter.category : filter?.kind === 'species'
    ? (bioindicadores.find((b) => b.id === filter.id)?.tipo.startsWith('pez') ? 'peces' : 'plantas') : null;
  const species = bioindicadores.filter((b) => category === 'peces' ? b.tipo.startsWith('pez') : category === 'plantas' && b.tipo === 'planta');
  if (detailOpen) return null;
  if (compact) {
    return (
      <div className="explorer-compact panel-left">
        <button onClick={onExpand} className="compact-open"><Compass size={19} /><span><strong>Explorar la cuenca</strong><small>{filter ? 'Filtro de bioindicadores activo' : view === 'mineria' ? 'Zonas mineras' : 'Comunidades y bioindicadores'}</small></span></button>
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
        
        <h2>Bioindicadores</h2><p>Selecciona un grupo para destacar las comunidades con muestras registradas.</p>
        <div className="bio-categories">
          <button aria-pressed={category === 'peces'} className={category === 'peces' ? 'active' : ''} onClick={() => onFilter({ kind: 'category', category: 'peces' })}><Fish size={21} /><span>Peces</span></button>
          <button aria-pressed={category === 'plantas'} className={category === 'plantas' ? 'active' : ''} onClick={() => onFilter({ kind: 'category', category: 'plantas' })}><Leaf size={21} /><span>Plantas</span></button>
        </div>
        {filter && <><div className="filter-status"><span aria-live="polite">{matchingCommunities} {matchingCommunities === 1 ? 'comunidad con muestras' : 'comunidades con muestras'}</span><button onClick={() => onFilter(null)}>Quitar filtro</button></div><p className="demo-note">Ubicaciones según estudios de demostración.</p>
          <div className="list-heading"><span>ESPECIES</span><span>{species.length}</span></div>
          <ul className="species-list">{species.map((b) => { const foto = FOTOS_BIOINDICADOR[b.id]; return <li key={b.id}>
            <button aria-pressed={filter.kind === 'species' && filter.id === b.id} className={filter.kind === 'species' && filter.id === b.id ? 'active' : ''} onClick={() => onFilter({ kind: 'species', id: b.id })}>
              {foto ? <img src={foto.src} alt="" loading="lazy" /> : <span className="species-placeholder"><Leaf size={18} /></span>}
              <span><strong>{b.nombre_comun}</strong><small>{b.nombre_cientifico}</small></span><ChevronRight size={16} />
            </button>
            {filter.kind === 'species' && filter.id === b.id && <button className="species-detail" onClick={() => onSelectBio(b)}>Ver ficha de la especie</button>}
          </li>; })}</ul></>}
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
