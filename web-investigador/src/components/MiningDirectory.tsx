import { useMemo, useState } from 'react';
import { Pickaxe, Search } from 'lucide-react';
import type { Comunidad } from '../types';
import {
  DatosMineria,
  MIN_CELDAS_ZONA,
  ZonaMinera,
  describirAnio,
  formatKm,
  formatKm2,
  kmEntre,
  periodoDe,
} from '../lib/mineria';
import { normalize } from '../lib/ui';

interface Props {
  mineria: DatosMineria | null;
  error: boolean;
  onRetry: () => void;
  comunidades: Comunidad[];
  onSelect: (zona: ZonaMinera) => void;
  onHover: (id: string | null) => void;
}

type Orden = 'reciente' | 'extension';

export function MiningDirectory({ mineria, error, onRetry, comunidades, onSelect, onHover }: Props) {
  const [query, setQuery] = useState('');
  const [orden, setOrden] = useState<Orden>('reciente');
  const [depto, setDepto] = useState<string | null>(null);

  const zonas = useMemo(() => (mineria?.zonas ?? []).filter((z) => z.celdas >= MIN_CELDAS_ZONA), [mineria]);

  // Nearest monitored community for each zone (distance to the zone's closest cell).
  const cercana = useMemo(() => {
    const out = new Map<string, { nombre: string; km: number }>();
    if (!mineria || comunidades.length === 0) return out;
    const celdasPorZona = new Map<string, { lat: number; lng: number }[]>();
    for (const c of mineria.celdas) {
      const lista = celdasPorZona.get(c.zona);
      if (lista) lista.push(c);
      else celdasPorZona.set(c.zona, [c]);
    }
    for (const z of zonas) {
      let mejor = { nombre: '', km: Infinity };
      for (const com of comunidades) {
        for (const c of celdasPorZona.get(z.id) ?? []) {
          const km = kmEntre(com.latitud, com.longitud, c.lat, c.lng);
          if (km < mejor.km) mejor = { nombre: com.nombre, km };
        }
      }
      out.set(z.id, mejor);
    }
    return out;
  }, [mineria, zonas, comunidades]);

  if (error) {
    return (
      <div className="explorer-body">
        <h2>Zonas mineras</h2>
        <p>No se pudo cargar la huella minera.</p>
        <button className="btn-secondary mt-3" onClick={onRetry}>Reintentar</button>
      </div>
    );
  }
  if (!mineria) {
    return (
      <div className="explorer-body">
        <h2>Zonas mineras</h2>
        <p role="status">Cargando huella minera…</p>
      </div>
    );
  }

  const departamentos = [...new Set(zonas.map((z) => z.departamento))].sort((a, b) => a.localeCompare(b, 'es'));
  const term = normalize(query);
  const lista = zonas
    .filter((z) => !depto || z.departamento === depto)
    .filter((z) => !term || normalize(`${z.nombre} ${z.municipio} ${z.departamento}`).includes(term))
    .sort((a, b) => (orden === 'reciente' ? b.recientes - a.recientes || b.celdas - a.celdas : b.celdas - a.celdas));

  const totalKm2 = zonas.reduce((s, z) => s + z.km2, 0);
  const totalRecientes = zonas.reduce((s, z) => s + z.recientes, 0);
  const aisladas = mineria.zonas.length - zonas.length;

  return (
    <div className="directory mining-directory">
      <div className="directory-toolbar">
        <h2>
          Zonas mineras <small>{zonas.length}</small>
        </h2>
        <p className="mining-intro">Huella de minería aurífera detectada por satélite en Bolivia.</p>
        <dl className="mining-totals">
          <div>
            <dt>Área de cuadros con huella</dt>
            <dd>{formatKm2(totalKm2)}</dd>
          </div>
          <div>
            <dt>Cuadros nuevos 2025–26</dt>
            <dd>{totalRecientes}</dd>
          </div>
        </dl>
        <label className="directory-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            aria-label="Buscar zona minera o municipio"
            placeholder="Buscar municipio…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="report-filters" role="group" aria-label="Ordenar zonas">
          <button className={orden === 'reciente' ? 'active' : ''} aria-pressed={orden === 'reciente'} onClick={() => setOrden('reciente')}>
            Más activas
          </button>
          <button className={orden === 'extension' ? 'active' : ''} aria-pressed={orden === 'extension'} onClick={() => setOrden('extension')}>
            Más extensas
          </button>
          <span className="filter-divider" aria-hidden="true" />
          {departamentos.map((d) => (
            <button key={d} className={depto === d ? 'active' : ''} aria-pressed={depto === d} onClick={() => setDepto(depto === d ? null : d)}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="directory-pages">
        <ul className="mining-list">
          {lista.map((z) => {
            const ultimoAnio = Math.max(...Object.keys(z.por_anio).map(Number));
            const c = cercana.get(z.id);
            return (
              <li key={z.id}>
                <button
                  type="button"
                  className="mining-row"
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'touch') onHover(z.id);
                  }}
                  onPointerLeave={() => onHover(null)}
                  onFocus={() => onHover(z.id)}
                  onBlur={() => onHover(null)}
                  onClick={() => {
                    onHover(null);
                    onSelect(z);
                  }}
                >
                  <span className="mining-badge" style={{ ['--zona' as string]: periodoDe(ultimoAnio).color }}>
                    <Pickaxe size={15} aria-hidden="true" />
                  </span>
                  <span className="mining-caption">
                    <strong>{z.nombre}</strong>
                    <span>
                      {z.departamento} · desde {describirAnio(z.primer_anio)}
                    </span>
                    {c && c.km <= 60 && (
                      <span>
                        A {formatKm(c.km)} de {c.nombre}
                      </span>
                    )}
                  </span>
                  <span className="mining-figures">
                    <b>{formatKm2(z.km2)}</b>
                    {z.recientes > 0 ? <small className="is-new">+{z.recientes} nuevas</small> : <small>sin nuevas</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {lista.length === 0 && <p className="directory-empty">No hay zonas que coincidan.</p>}
        <p className="mining-source">
          {aisladas > 0 && <>{aisladas} detecciones aisladas (menos de {MIN_CELDAS_ZONA} cuadros) no se listan. </>}
          Fuente:{' '}
          <a href={mineria.url} target="_blank" rel="noreferrer">
            Amazon Mining Watch
          </a>{' '}
          ({mineria.licencia}). Municipios: geoBoundaries / GeoBolivia. No distingue minería legal de ilegal.
        </p>
      </div>
    </div>
  );
}
