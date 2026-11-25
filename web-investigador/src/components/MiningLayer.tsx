import { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { DatosMineria, PeriodoId, describirPeriodo, periodoDe } from '../lib/mineria';

interface Props {
  datos: DatosMineria;
  periodos: Set<PeriodoId>;
}

const ATRIBUCION =
  'Minería: <a href="https://source.coop/earthgenome/amazon-mining-watch" target="_blank" rel="noreferrer">Amazon Mining Watch</a> (CC BY 4.0)';

/**
 * Dibuja cada celda (~480 m) como un cuadro en canvas: 2.000+ elementos sin costo de DOM.
 * Queda por debajo de los marcadores de comunidades y reportes.
 */
export function MiningLayer({ datos, periodos }: Props) {
  const map = useMap();
  const renderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  useEffect(() => {
    map.attributionControl?.addAttribution(ATRIBUCION);
    return () => {
      map.attributionControl?.removeAttribution(ATRIBUCION);
    };
  }, [map]);

  useEffect(() => {
    const [dLng, dLat] = datos.celdaGrados;
    const grupo = L.featureGroup();

    for (const c of datos.celdas) {
      const periodo = periodoDe(c.anio);
      if (!periodos.has(periodo.id)) continue;
      const provisional = c.estado === 'provisional';
      const rect = L.rectangle(
        [
          [c.lat - dLat / 2, c.lng - dLng / 2],
          [c.lat + dLat / 2, c.lng + dLng / 2],
        ],
        {
          renderer,
          color: periodo.color,
          weight: 1, // keeps cells visible as dots when zoomed out
          opacity: provisional ? 0.55 : 0.9,
          fillColor: periodo.color,
          fillOpacity: provisional ? 0.35 : 0.7,
          dashArray: provisional ? '3 3' : undefined,
        },
      );
      rect.bindTooltip(`Huella minera · ${describirPeriodo(c)}`, { sticky: true, className: 'ev-label', direction: 'top' });
      rect.bindPopup(
        `<div class="mining-popup">
          <strong>Huella minera detectada por satélite</strong>
          <dl>
            <div><dt>Primera detección</dt><dd>${describirPeriodo(c)}</dd></div>
            <div><dt>Estado</dt><dd>${provisional ? 'Provisional (pendiente de confirmar)' : 'Confirmada'}</dd></div>
            <div><dt>Confianza del modelo</dt><dd>${Math.round(c.confianza * 100)} %</dd></div>
          </dl>
          <p>Celda de ~480 m. No distingue minería legal de ilegal.</p>
          <a href="${datos.url}" target="_blank" rel="noreferrer">Fuente: Amazon Mining Watch</a>
        </div>`,
      );
      grupo.addLayer(rect);
    }

    grupo.addTo(map);
    return () => {
      grupo.remove();
    };
  }, [map, datos, periodos, renderer]);

  return null;
}
