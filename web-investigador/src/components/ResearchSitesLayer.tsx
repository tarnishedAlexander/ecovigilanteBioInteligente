import { CircleMarker, Tooltip } from 'react-leaflet';
import type { MedicionHg } from '../types';
import { IndiceInv, formatNum, piso, techo } from '../lib/investigacion';

interface Props {
  inv: IndiceInv;
  mediciones: MedicionHg[];
  estudioId: string | null;
  sitioId: string | null;
  onSelect: (sitioId: string) => void;
}

/** Sites of the studies in the active matrix. A highlighted study keeps its sites lit and fades the rest. */
export function ResearchSitesLayer({ inv, mediciones, estudioId, sitioId, onSelect }: Props) {
  const porSitio = new Map<string, MedicionHg[]>();
  mediciones.forEach((m) => porSitio.set(m.sitio, [...(porSitio.get(m.sitio) ?? []), m]));
  return (
    <>
      {[...porSitio.entries()].map(([id, meds]) => {
        const s = inv.sitio.get(id)!;
        const delEstudio = !estudioId || meds.some((m) => m.estudio === estudioId);
        const selected = id === sitioId;
        const estudios = [...new Set(meds.map((m) => inv.estudio.get(m.estudio)!.cita))];
        const unidad = meds[0].unidad;
        const lo = Math.min(...meds.map(piso)), hi = Math.max(...meds.map(techo));
        return (
          <CircleMarker
            key={`${id}-${delEstudio}-${selected}`}
            center={[s.lat, s.lng]}
            radius={Math.min(15, 6 + Math.sqrt(meds.length) * 1.8) + (selected ? 3 : 0)}
            pathOptions={{
              color: selected ? '#E8EBDD' : '#151914',
              weight: selected ? 3 : 2,
              fillColor: '#bbd77a',
              fillOpacity: delEstudio ? 0.9 : 0.2,
              opacity: delEstudio ? 1 : 0.35,
              dashArray: s.precision === 'aproximada' ? '3 3' : undefined,
            }}
            eventHandlers={{ click: () => onSelect(id) }}
          >
            <Tooltip direction="top" offset={[0, -6]} className="ev-label">
              <span className="ev-label-name">{s.nombre}</span>
              <small className="ev-preview-meta">
                {meds.length} {meds.length === 1 ? 'medición' : 'mediciones'} · {lo === hi ? formatNum(hi) : `${formatNum(lo)}–${formatNum(hi)}`} {unidad}
                {s.precision === 'aproximada' ? ' · ubicación aproximada' : ''}
              </small>
              <small className="ev-preview-meta">{estudios.join(', ')}</small>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
