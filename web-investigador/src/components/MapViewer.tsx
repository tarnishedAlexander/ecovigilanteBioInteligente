import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Reporte, Comunidad, RioGeoJSON } from '../types';
import { Layers, Globe, Eye, MapPin, AlertCircle, Compass, Waves } from 'lucide-react';

interface MapViewerProps {
  rios: RioGeoJSON | null;
  comunidades: Comunidad[];
  reportes: Reporte[];
  selectedReporte: Reporte | null;
  onSelectReporte: (reporte: Reporte) => void;
  flyToCoords: [number, number] | null;
}

// Custom Leaflet DivIcons with SVG Pulse Effects
const createReportIcon = (estado: string) => {
  let color = '#ef4444'; // crudo
  let pulseClass = 'marker-pin-crudo';

  if (estado === 'semiverificado') {
    color = '#f59e0b';
    pulseClass = 'marker-pin-semi';
  } else if (estado === 'verificado') {
    color = '#10b981';
    pulseClass = 'marker-pin-verificado';
  }

  return L.divIcon({
    className: 'custom-report-pin',
    html: `
      <div class="${pulseClass}" style="display:flex;align-items:center;justify-content:center;">
        <span style="font-size:10px;font-weight:bold;color:white;">!</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
};

const createComunidadIcon = (alerta: string) => {
  const isHigh = alerta === 'Critico' || alerta === 'Alto';
  const color = isHigh ? '#f97316' : '#10b981';

  return L.divIcon({
    className: 'custom-comunidad-pin',
    html: `
      <div style="background:${color};border:2px solid #ffffff;border-radius:6px;width:14px;height:14px;box-shadow:0 0 10px ${color};"></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });
};

// Component to handle programmatic map camera movements
const MapFlyHandler: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 11, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

export const MapViewer: React.FC<MapViewerProps> = ({
  rios,
  comunidades,
  reportes,
  selectedReporte,
  onSelectReporte,
  flyToCoords
}) => {
  // Center of northern Bolivian Amazon (approx Riberalta / Alto Beni)
  const defaultCenter: [number, number] = [-12.5, -66.8];
  const [baseMap, setBaseMap] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showRios, setShowRios] = useState(true);
  const [showComunidades, setShowComunidades] = useState(true);
  const [showReportes, setShowReportes] = useState(true);
  const [simularAguasArriba, setSimularAguasArriba] = useState(false);

  // Tile layers URLs
  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  return (
    <div className="relative flex-1 h-[calc(100vh-4rem)] bg-[#021813] overflow-hidden">
      {/* Floating Map Controls & Layers Toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 select-none">
        {/* Layer Visibility Control */}
        <div className="glass-panel p-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowRios(!showRios)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showRios ? 'bg-cyan-600/80 text-white shadow' : 'bg-emerald-950/40 text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-300" />
            Ríos
          </button>

          <button
            onClick={() => setShowComunidades(!showComunidades)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showComunidades ? 'bg-emerald-600/80 text-white shadow' : 'bg-emerald-950/40 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            Comunidades
          </button>

          <button
            onClick={() => setShowReportes(!showReportes)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showReportes ? 'bg-red-600/80 text-white shadow' : 'bg-emerald-950/40 text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-300" />
            Alertas ({reportes.length})
          </button>
        </div>

        {/* Base Map Switcher (Carto Dark vs Satellite Google Earth Comparative) */}
        <div className="glass-panel p-2 rounded-xl shadow-xl flex items-center justify-between text-xs">
          <span className="text-[11px] text-emerald-300/80 font-medium px-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Mapa Base:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setBaseMap('dark')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                baseMap === 'dark' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Noche
            </button>
            <button
              onClick={() => setBaseMap('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                baseMap === 'satellite' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Satélite
            </button>
          </div>
        </div>

        {/* Upstream River Tracing Tool Pill */}
        <div className="glass-panel p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Trazado Aguas Arriba
            </span>
            <input
              type="checkbox"
              checked={simularAguasArriba}
              onChange={(e) => setSimularAguasArriba(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
          </div>
          <p className="text-[10px] text-slate-300">
            Resalta el vector hidrográfico hacia el origen de vertido minero.
          </p>
        </div>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] glass-panel-dark p-3 rounded-xl border border-emerald-500/30 text-xs shadow-2xl select-none hidden sm:block">
        <span className="font-bold text-white block mb-1.5 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Leyenda de Detección
        </span>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
            <span className="text-slate-200">Alerta en Crudo (Comunario)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span>
            <span className="text-slate-200">Semiverificado (Prioridad)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
            <span className="text-slate-200">Verificado Científicamente (Lab)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/40">
            <span className="w-4 h-1 bg-cyan-400 rounded"></span>
            <span className="text-cyan-300">Río Madre de Dios / Beni</span>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={6.8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapFlyHandler coords={flyToCoords} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> / Esri'
          url={tileUrls[baseMap]}
        />

        {/* Rivers GeoJSON Layer */}
        {showRios && rios && (
          <GeoJSON
            data={rios as any}
            style={(feature) => ({
              color: simularAguasArriba ? '#f59e0b' : (feature?.properties.color || '#0ea5e9'),
              weight: (feature?.properties.grosor || 3) + (simularAguasArriba ? 2 : 0),
              opacity: 0.85,
              dashArray: simularAguasArriba ? '8, 8' : undefined
            })}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px;">
                  <h4 style="font-size:13px;font-weight:bold;color:#38bdf8;margin:0 0 4px 0;">
                    ${feature.properties.nombre}
                  </h4>
                  <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px 0;">
                    ${feature.properties.descripcion}
                  </p>
                  <div style="font-size:10px;font-weight:bold;color:#f59e0b;background:rgba(245,158,11,0.1);padding:4px 6px;border-radius:4px;border:1px solid rgba(245,158,11,0.3);">
                    ⚠️ ${feature.properties.riesgo_minero}
                  </div>
                </div>
              `);
            }}
          />
        )}

        {/* Communities Pins */}
        {showComunidades && comunidades.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitud, c.longitud]}
            icon={createComunidadIcon(c.alerta_nivel)}
          >
            <Popup>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                    {c.nombre}
                  </h4>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: c.alerta_nivel === 'Critico' ? '#ef4444' : '#10b981' }}>
                    Alerta {c.alerta_nivel}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px 0' }}>
                  {c.cuenca_principal} • Pob: ~{c.poblacion_estimada.toLocaleString()}
                </p>
                <div style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <strong>Sospecha Minera:</strong> {c.posible_fuente_minera_aguas_arriba}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Reports Pins with Animated Glow */}
        {showReportes && reportes.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitud, r.longitud]}
            icon={createReportIcon(r.estado)}
            eventHandlers={{
              click: () => onSelectReporte(r)
            }}
          >
            <Popup>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: '180px', padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#ffffff', textTransform: 'capitalize' }}>
                    {r.categoria.toUpperCase()} • {r.comunidad_nombre}
                  </strong>
                  <span style={{ fontSize: '10px', color: r.estado === 'crudo' ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                    {r.estado}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '0 0 6px 0' }}>
                  {r.descripcion_usuario || 'Reporte de síntomas registrado'}
                </p>
                <button
                  onClick={() => onSelectReporte(r)}
                  style={{
                    width: '100%',
                    background: '#047857',
                    color: 'white',
                    border: 'none',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Abrir Ficha de Análisis
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
