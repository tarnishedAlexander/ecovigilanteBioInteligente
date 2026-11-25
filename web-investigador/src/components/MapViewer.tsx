import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Reporte, Comunidad, RioGeoJSON } from '../types';
import { ALERTAS, COLORS, ESTADOS, CATEGORIAS, alertaTone, estadoTone } from '../lib/ui';

interface MapViewerProps {
  rios: RioGeoJSON | null;
  comunidades: Comunidad[];
  reportes: Reporte[];
  selectedReporte: Reporte | null;
  onSelectReporte: (reporte: Reporte) => void;
  flyToCoords: [number, number] | null;
}

const createReportIcon = (estado: string, selected: boolean) => {
  const size = selected ? 18 : 14;
  return L.divIcon({
    className: `ev-pin${selected ? ' is-selected' : ''}`,
    html: `<span style="background:${estadoTone(estado).color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
};

const createComunidadIcon = (alerta: string) =>
  L.divIcon({
    className: 'ev-site',
    html: `<span style="background:${alertaTone(alerta).color}"></span>`,
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
    popupAnchor: [0, -8],
  });

const MapFlyHandler: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 11, { duration: 1.2 });
  }, [coords, map]);
  return null;
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }> = ({
  checked,
  onChange,
  children,
}) => (
  <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-ink">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-3.5 w-3.5 cursor-pointer accent-forest-600"
    />
    {children}
  </label>
);

const Swatch: React.FC<{ color: string; shape?: 'dot' | 'diamond' | 'line' }> = ({ color, shape = 'dot' }) => {
  if (shape === 'line') return <span className="inline-block h-[3px] w-4 rounded" style={{ background: color }} />;
  if (shape === 'diamond')
    return <span className="inline-block h-2 w-2 rotate-45" style={{ background: color, margin: '0 3px' }} />;
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color, margin: '0 3px' }} />;
};

export const MapViewer: React.FC<MapViewerProps> = ({
  rios,
  comunidades,
  reportes,
  selectedReporte,
  onSelectReporte,
  flyToCoords,
}) => {
  const defaultCenter: [number, number] = [-12.5, -66.8];
  const [baseMap, setBaseMap] = useState<'satellite' | 'pureSatellite' | 'terrain'>('satellite');
  const [showRios, setShowRios] = useState(true);
  const [showComunidades, setShowComunidades] = useState(true);
  const [showReportes, setShowReportes] = useState(true);
  const [simularAguasArriba, setSimularAguasArriba] = useState(false);

  const tileUrls = {
    satellite: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    pureSatellite: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    terrain: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
  };
  const baseOptions: { id: keyof typeof tileUrls; label: string }[] = [
    { id: 'satellite', label: 'Híbrido' },
    { id: 'pureSatellite', label: 'Satélite' },
    { id: 'terrain', label: 'Relieve' },
  ];

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Layer control */}
      <div className="card absolute right-3 top-3 z-[1000] w-56 select-none shadow-sm">
        <div className="border-b border-line px-3 py-2.5">
          <div className="eyebrow mb-2">Mapa base</div>
          <div className="grid grid-cols-3 rounded border border-line-strong p-0.5">
            {baseOptions.map((o) => (
              <button
                key={o.id}
                onClick={() => setBaseMap(o.id)}
                className={`rounded-sm py-1 text-[12px] font-medium transition-colors ${
                  baseMap === o.id ? 'bg-forest-600 text-white' : 'text-ink-2 hover:bg-paper'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-b border-line px-3 py-2">
          <div className="eyebrow mb-1">Capas</div>
          <Toggle checked={showRios} onChange={setShowRios}>
            Red hidrográfica
          </Toggle>
          <Toggle checked={showComunidades} onChange={setShowComunidades}>
            Comunidades
          </Toggle>
          <Toggle checked={showReportes} onChange={setShowReportes}>
            Reportes <span className="text-ink-3">({reportes.length})</span>
          </Toggle>
        </div>
        <div className="px-3 py-2">
          <Toggle checked={simularAguasArriba} onChange={setSimularAguasArriba}>
            Trazado aguas arriba
          </Toggle>
          <p className="pl-[22px] text-[11px] leading-snug text-ink-3">
            Resalta los cauces hacia posibles fuentes de vertido.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="card absolute bottom-6 left-3 z-[1000] hidden select-none px-3 py-2.5 shadow-sm sm:block">
        <div className="eyebrow mb-1.5">Reportes</div>
        <ul className="mb-2 space-y-1 text-[12px] text-ink-2">
          {(['crudo', 'semiverificado', 'verificado'] as const).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <Swatch color={ESTADOS[k].color} />
              {ESTADOS[k].label}
            </li>
          ))}
        </ul>
        <div className="eyebrow mb-1.5">Comunidades · nivel de alerta</div>
        <ul className="mb-2 flex gap-3 text-[12px] text-ink-2">
          {(['Bajo', 'Medio', 'Alto', 'Critico'] as const).map((k) => (
            <li key={k} className="flex items-center gap-1">
              <Swatch color={ALERTAS[k].color} shape="diamond" />
              {ALERTAS[k].label}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 text-[12px] text-ink-2">
          <Swatch color={simularAguasArriba ? COLORS.ochre : '#7FB3D5'} shape="line" />
          {simularAguasArriba ? 'Trazado aguas arriba' : 'Ríos principales'}
        </div>
      </div>

      <MapContainer center={defaultCenter} zoom={6.8} scrollWheelZoom className="h-full w-full">
        <MapFlyHandler coords={flyToCoords} />

        <TileLayer
          key={baseMap}
          attribution="&copy; Google"
          url={tileUrls[baseMap]}
          maxZoom={20}
          subdomains={['0', '1', '2', '3']}
        />

        {showRios && rios && (
          <GeoJSON
            data={rios as any}
            style={(feature) => ({
              color: simularAguasArriba ? COLORS.ochre : '#7FB3D5',
              weight: (feature?.properties.grosor || 3) + (simularAguasArriba ? 1 : 0),
              opacity: 0.95,
              dashArray: simularAguasArriba ? '6 6' : undefined,
              lineCap: 'round',
            })}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`
                <div style="max-width:240px">
                  <div style="font-weight:600;font-size:13px;margin-bottom:2px">${feature.properties.nombre}</div>
                  <div style="color:${COLORS.ink3};font-size:11px;margin-bottom:6px">${feature.properties.cuenca}</div>
                  <div style="color:${COLORS.ink2};margin-bottom:8px">${feature.properties.descripcion}</div>
                  <div style="border-left:2px solid ${COLORS.ochre};padding-left:8px;color:${COLORS.ink2}">
                    <span style="color:${COLORS.ochre};font-weight:600">Riesgo minero:</span> ${feature.properties.riesgo_minero}
                  </div>
                </div>
              `);
            }}
          />
        )}

        {showComunidades &&
          comunidades.map((c) => {
            const t = alertaTone(c.alerta_nivel);
            return (
              <Marker key={c.id} position={[c.latitud, c.longitud]} icon={createComunidadIcon(c.alerta_nivel)}>
                <Popup>
                  <div style={{ maxWidth: 240 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
                      <strong style={{ fontSize: 13 }}>{c.nombre}</strong>
                      <span style={{ color: t.color, fontWeight: 600, fontSize: 11 }}>Alerta {t.label.toLowerCase()}</span>
                    </div>
                    <div style={{ color: COLORS.ink3, fontSize: 11, marginBottom: 6 }}>
                      {c.cuenca_principal} · {c.poblacion_estimada.toLocaleString('es-BO')} hab.
                    </div>
                    <div style={{ color: COLORS.ink2 }}>
                      <span style={{ color: COLORS.ink3 }}>Posible fuente: </span>
                      {c.posible_fuente_minera_aguas_arriba}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {showReportes &&
          reportes.map((r) => {
            const t = estadoTone(r.estado);
            return (
              <Marker
                key={r.id}
                position={[r.latitud, r.longitud]}
                icon={createReportIcon(r.estado, selectedReporte?.id === r.id)}
                zIndexOffset={selectedReporte?.id === r.id ? 1000 : 0}
                eventHandlers={{ click: () => onSelectReporte(r) }}
              >
                <Popup>
                  <div style={{ minWidth: 200, maxWidth: 240 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
                      <strong style={{ fontSize: 13 }}>{CATEGORIAS[r.categoria] ?? r.categoria}</strong>
                      <span style={{ color: t.color, fontWeight: 600, fontSize: 11 }}>{t.label}</span>
                    </div>
                    <div style={{ color: COLORS.ink3, fontSize: 11, marginBottom: 6 }}>{r.comunidad_nombre}</div>
                    <div style={{ color: COLORS.ink2, marginBottom: 8 }}>
                      {r.descripcion_usuario || 'Reporte de síntomas registrado'}
                    </div>
                    <button
                      onClick={() => onSelectReporte(r)}
                      style={{
                        width: '100%',
                        background: COLORS.forest,
                        color: '#fff',
                        border: 0,
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Abrir ficha
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
