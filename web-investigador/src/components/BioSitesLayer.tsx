import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Sitio } from '../types';
import { ALCANCES, IndiceBio } from '../lib/bio';

interface Props {
  indice: IndiceBio;
  /** Taxa whose sampling sites are shown; null = every site in the catalog. */
  taxonIds: Set<string> | null;
  selectedSitioId?: string;
  onSelect: (sitio: Sitio) => void;
}

/** Sampling sites of published mercury measurements, colored by geographic scope. */
export function BioSitesLayer({ indice, taxonIds, selectedSitioId, onSelect }: Props) {
  return (
    <>
      {indice.catalogo.sitios.map((s) => {
        if (s.lat === null || s.lng === null) return null;
        const meds = (indice.porSitio.get(s.id) ?? []).filter((m) => !taxonIds || taxonIds.has(m.taxon));
        if (!meds.length) return null;
        const selected = s.id === selectedSitioId;
        const taxones = new Set(meds.map((m) => m.taxon)).size;
        const color = ALCANCES[s.alcance].color;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={Math.min(16, 7 + Math.sqrt(meds.length) * 2) + (selected ? 3 : 0)}
            pathOptions={{
              color: selected ? '#E8EBDD' : '#151914',
              weight: selected ? 3 : 2,
              fillColor: color,
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Tooltip direction="top" offset={[0, -6]} className="ev-label">
              <span className="ev-label-name">{s.nombre}</span>
              <small className="ev-preview-meta">
                {[s.pais, ALCANCES[s.alcance].label].filter(Boolean).join(' · ')} · {meds.length}{' '}
                {meds.length === 1 ? 'medición' : 'mediciones'} de {taxones} {taxones === 1 ? 'taxón' : 'taxones'}
              </small>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
