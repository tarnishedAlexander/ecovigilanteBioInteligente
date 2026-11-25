import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const LIMITE_URL = '/data/bolivia-limite.geojson';
const PANE = 'limite-pais';

let cache: Promise<GeoJSON.FeatureCollection> | null = null;
const cargarLimite = () => {
  if (!cache) {
    cache = fetch(LIMITE_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el límite de Bolivia (${res.status})`);
        return res.json();
      })
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
};

/**
 * National border of Bolivia (Natural Earth 1:10m, public domain).
 * Drawn as a light line over a dark halo so it reads on any base map.
 * Lives in its own pane: above the tiles, below rivers, mining cells and markers; never takes clicks.
 */
export function BoliviaBorder() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(PANE)) {
      const pane = map.createPane(PANE);
      pane.style.zIndex = '350';
      pane.style.pointerEvents = 'none';
    }
    let capas: L.Layer[] = [];
    let vigente = true;
    cargarLimite()
      .then((data) => {
        if (!vigente) return;
        const comun = { pane: PANE, interactive: false, fill: false };
        capas = [
          L.geoJSON(data, { style: { ...comun, color: '#0b0f0a', weight: 5, opacity: 0.55 } }),
          L.geoJSON(data, { style: { ...comun, color: '#e8ebdd', weight: 1.75, opacity: 0.95, dashArray: '8 4' } }),
        ];
        capas.forEach((c) => c.addTo(map));
      })
      .catch((err) => console.error(err));
    return () => {
      vigente = false;
      capas.forEach((c) => c.remove());
    };
  }, [map]);

  return null;
}
