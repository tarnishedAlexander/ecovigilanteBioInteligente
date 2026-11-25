import { useState } from 'react';
import { ImageOff, Search, UsersRound } from 'lucide-react';
import { FOTOS_TERRITORIO } from '../data/fotosTerritorio';
import { normalize, alertaTone } from '../lib/ui';
import type { Comunidad } from '../types';

interface Props {
  comunidades: Comunidad[];
  loading: boolean;
  query: string;
  onSearch: (query: string) => void;
  onHover: (id: string | null) => void;
  onSelect: (comunidad: Comunidad) => void;
}

const population = new Intl.NumberFormat('es-BO');

function CommunityEntry({ place, cover, onHover, onSelect }: {
  place: Comunidad;
  cover: boolean;
  onHover: Props['onHover'];
  onSelect: Props['onSelect'];
}) {
  const photo = FOTOS_TERRITORIO[place.id];
  const [failed, setFailed] = useState(false);
  const hasPhoto = photo && !failed;
  return (
    <button type="button" className={cover && hasPhoto ? 'directory-cover' : 'directory-row'}
      onPointerEnter={(event) => { if (event.pointerType !== 'touch') onHover(place.id); }}
      onPointerLeave={() => onHover(null)} onFocus={() => onHover(place.id)} onBlur={() => onHover(null)}
      onClick={() => { onHover(null); onSelect(place); }}>
      {hasPhoto ? <img src={photo.src} alt={photo.titulo} loading={cover ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
        : <span className="directory-no-photo" aria-label="Sin fotografía disponible"><ImageOff size={22} /></span>}
      <span className="directory-caption">
        <strong>{place.nombre}</strong>
        <span className="directory-river">{place.cuenca_principal}</span>
        <span className="directory-pop"><UsersRound size={14} aria-hidden="true" />
          {Number.isFinite(place.poblacion_estimada) ? `${population.format(place.poblacion_estimada)} hab. estimados` : 'Sin estimación de población'}
        </span>
      </span>
      <span className="entry-alert" title={`Alerta ${alertaTone(place.alerta_nivel).label.toLowerCase()}`}>
        <i style={{ background: alertaTone(place.alerta_nivel).color }} />{alertaTone(place.alerta_nivel).label}
      </span>
    </button>
  );
}

export function CommunityDirectory({ comunidades, loading, query, onSearch, onHover, onSelect }: Props) {
  const term = normalize(query);
  const groups = new Map<string, Comunidad[]>();
  for (const place of comunidades) {
    if (!normalize(`${place.nombre} ${place.departamento} ${place.cuenca_principal}`).includes(term)) continue;
    const department = place.departamento || 'Sin departamento registrado';
    const group = groups.get(department);
    if (group) group.push(place);
    else groups.set(department, [place]);
  }
  const departments = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'es'));
  const jumpTo = (department: string) => {
    document.getElementById(`department-${department}`)?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="directory">
      <div className="directory-toolbar">
        <h2>Comunidades <small>{comunidades.length}</small></h2>
        <label className="directory-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} aria-label="Buscar comunidad, departamento o río"
            placeholder="Buscar en el territorio…" onChange={(e) => onSearch(e.target.value)} />
        </label>
        {departments.length > 1 && <nav className="department-index" aria-label="Saltar a un departamento">
          {departments.map((department) => <button key={department} onClick={() => jumpTo(department)}>{department}</button>)}
        </nav>}
      </div>
      <div className="directory-pages">
        {departments.map((department) => {
          // Recorrer cada departamento de sur a norte, igual que el mapa.
          const places = [...groups.get(department)!].sort((a, b) => a.latitud - b.latitud || a.nombre.localeCompare(b.nombre, 'es'));
          return (
            <section key={department} id={`department-${department}`} className="department">
              <header><h2>{department}</h2><span>{places.length} {places.length === 1 ? 'comunidad' : 'comunidades'}</span></header>
              <ul>{places.map((place, index) => <li key={place.id}>
                <CommunityEntry place={place} cover={index === 0} onSelect={onSelect} onHover={onHover} />
              </li>)}</ul>
            </section>
          );
        })}
        {departments.length === 0 && <p role="status" className="directory-empty">
          {loading ? 'Cargando comunidades…' : term ? 'No se encontraron comunidades para esa búsqueda.' : 'Sin comunidades disponibles.'}
        </p>}
        {departments.length > 0 && <details className="photo-credits">
          <summary>Créditos fotográficos</summary>
          <p>Fotografías de referencia de Wikimedia Commons, adaptadas al encuadre de cada ficha.</p>
          <ul>{comunidades.map((place) => {
            const photo = FOTOS_TERRITORIO[place.id];
            return photo && <li key={place.id}><a href={photo.fuente} target="_blank" rel="noreferrer">{photo.titulo}</a>
              {' · '}{photo.autor}{' · '}<a href={photo.urlLicencia} target="_blank" rel="noreferrer">{photo.licencia}</a></li>;
          })}</ul>
        </details>}
      </div>
    </div>
  );
}
