import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, ScaleControl, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ChevronDown, LocateFixed, Layers, MapPin, Navigation2 } from 'lucide-react';
import { Reporte, Comunidad, RioGeoJSON } from '../types';
import { COLORS, ESTADOS, NIVELES, alertaTone, estadoTone, formatCoord } from '../lib/ui';
import { DatosMineria, MIN_CELDAS_ZONA, PERIODOS, PeriodoId, ZonaMinera, describirAnio, formatKm2, periodoDe } from '../lib/mineria';
import type { AtlasSection } from './Header';
import { MiningLayer } from './MiningLayer';
import { BoliviaBorder } from './BoliviaBorder';
import { BioSitesLayer } from './BioSitesLayer';
import { ALCANCES, IndiceBio } from '../lib/bio';
import type { Sitio } from '../types';

export interface CameraTarget {
  bounds: L.LatLngBounds;
  maxZoom: number;
}

interface MapViewerProps {
  rios: RioGeoJSON | null;
  comunidades: Comunidad[];
  reportes: Reporte[];
  selectedReporteId?: string;
  selectedComunidadId?: string;
  hoveredComunidadId: string | null;
  /** Communities to emphasise (e.g. where a bioindicator was sampled). Others fade. */
  highlightIds: string[] | null;
  onSelectReporte: (reporte: Reporte) => void;
  onSelectComunidad: (comunidad: Comunidad) => void;
  target: CameraTarget | null;
  rightPanelOpen: boolean;
  explorerCompact: boolean;
  onMapInteract: () => void;
  section: AtlasSection;
  mineria: DatosMineria | null;
  mineriaError: boolean;
  onRetryMineria: () => void;
  selectedZonaId?: string;
  hoveredZonaId: string | null;
  onSelectZona: (zona: ZonaMinera) => void;
  bio: IndiceBio | null;
  /** Show sampling sites of these taxa (null = all) while the bioindicator layer is on. */
  bioTaxonIds: Set<string> | null;
  showBioSites: boolean;
  selectedSitioId?: string;
  onSelectSitio: (sitio: Sitio) => void;
  /** Extra layers drawn above the bioindicator sites (e.g. the research study sites). */
  children?: React.ReactNode;
}

const PICKAXE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"/>' +
  '<path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"/>' +
  '<path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"/>' +
  '<path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"/></svg>';

/** Zone badge: size grows with area; color = most recent activity period of the zone. */
const createZonaIcon = (zona: ZonaMinera, selected: boolean) => {
  const ultimoAnio = Math.max(...Object.keys(zona.por_anio).map(Number));
  const color = periodoDe(ultimoAnio).color;
  const size = Math.round(Math.min(40, 22 + Math.sqrt(zona.celdas) * 0.9));
  return L.divIcon({
    className: `ev-zona${selected ? ' is-selected' : ''}`,
    html: `<span style="--zona:${color};width:${size}px;height:${size}px">${PICKAXE_SVG}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};


// Default view: the whole country, centered in the free part of the map. On a typical desktop
// (~1440×900) this lands on zoom 6.25, where the scale bar still reads "100 km".
const BOLIVIA = L.latLngBounds([-22.8973, -69.6665], [-9.6798, -57.4657]);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const createReportIcon = (estado: string, selected: boolean) => {
  const size = selected ? 18 : 13;
  return L.divIcon({
    className: `ev-pin${selected ? ' is-selected' : ''}`,
    html: `<span style="background:${estadoTone(estado).color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createComunidadIcon = (alerta: string, selected: boolean) =>
  L.divIcon({
    className: `ev-site${selected ? ' is-selected' : ''}`,
    html: `<span style="background:${alertaTone(alerta).color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function visibleMapPadding(map: L.Map) {
  const main = map.getContainer().closest('main');
  const panel = main?.querySelector<HTMLElement>('.panel-right, .explorer');
  const mobile = window.innerWidth < 768;
  return {
    paddingTopLeft: L.point(22, mobile ? 126 : 84),
    paddingBottomRight: L.point(!mobile && panel ? panel.offsetWidth + 54 : 24,
      mobile && panel ? panel.offsetHeight + 30 : 40),
  };
}

/** Fits all of Bolivia inside the part of the map not covered by the floating panels. */
function vistaInicial(map: L.Map, animate = false) {
  map.fitBounds(BOLIVIA, { ...visibleMapPadding(map), animate });
}

function MapTools() {
  const map = useMap();
  const [center, setCenter] = useState(map.getCenter());
  useEffect(() => { setCenter(map.getCenter()); }, [map]);
  useMapEvents({ moveend: () => setCenter(map.getCenter()) });
  return <>
    <div className="map-readout"><Navigation2 size={13} />N<span />{formatCoord(center.lat, center.lng)}</div>
    <button className="recenter glass" title="Volver a la vista inicial" aria-label="Volver a la vista inicial" onClick={() =>
      vistaInicial(map, !prefersReducedMotion())}><LocateFixed size={19} /></button>
  </>;
}

function CameraController({ target, preview }: {
  target: CameraTarget | null;
  preview?: { latitud: number; longitud: number };
}) {
  const map = useMap();
  useEffect(() => {
    const padding = visibleMapPadding(map);
    if (!target) {
      vistaInicial(map);
    } else if (prefersReducedMotion()) {
      map.fitBounds(target.bounds, { ...padding, animate: false, maxZoom: target.maxZoom });
    } else {
      map.flyToBounds(target.bounds, { ...padding, duration: 1, maxZoom: target.maxZoom });
    }
  }, [map, target]);
  useEffect(() => {
    if (preview) map.panInside([preview.latitud, preview.longitud], { ...visibleMapPadding(map), animate: false });
  }, [map, preview]);
  return null;
}

const MapInteraction: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.leaflet-control') || target.closest('.leaflet-control-zoom')) onInteract();
    };
    container.addEventListener('pointerdown', handleInteraction);
    container.addEventListener('wheel', handleInteraction, { passive: true });
    container.addEventListener('keydown', handleInteraction);
    return () => {
      container.removeEventListener('pointerdown', handleInteraction);
      container.removeEventListener('wheel', handleInteraction);
      container.removeEventListener('keydown', handleInteraction);
    };
  }, [map, onInteract]);
  return null;
};

/** Put the label on the left when a neighbour sits just east, so close towns don't overlap. */
const labelSide = (c: Comunidad, all: Comunidad[]): 'left' | 'right' =>
  all.some(
    (o) =>
      o.id !== c.id && Math.abs(o.latitud - c.latitud) < 0.2 && o.longitud > c.longitud && o.longitud - c.longitud < 0.3,
  )
    ? 'left'
    : 'right';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }> = ({
  checked,
  onChange,
  children,
}) => (
  <label className="flex cursor-pointer items-center gap-2 py-0.5 text-[12px] text-ink">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-3.5 w-3.5 cursor-pointer accent-forest-600"
    />
    {children}
  </label>
);

export const MapViewer: React.FC<MapViewerProps> = ({
  rios,
  comunidades,
  reportes,
  selectedReporteId,
  selectedComunidadId,
  hoveredComunidadId,
  highlightIds,
  onSelectReporte,
  onSelectComunidad,
  target,
  rightPanelOpen,
  explorerCompact,
  onMapInteract,
  section,
  mineria,
  mineriaError,
  onRetryMineria,
  selectedZonaId,
  hoveredZonaId,
  onSelectZona,
  bio,
  bioTaxonIds,
  showBioSites,
  selectedSitioId,
  onSelectSitio,
  children,
}) => {
  const [baseMap, setBaseMap] = useState<'satellite' | 'pureSatellite' | 'terrain'>('pureSatellite');
  const [showRios, setShowRios] = useState(false);
  const [showComunidades, setShowComunidades] = useState(true);
  const [showReportes, setShowReportes] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showMineria, setShowMineria] = useState(true);
  const [periodos, setPeriodos] = useState<Set<PeriodoId>>(() => new Set(PERIODOS.map((p) => p.id)));
  const [showBio, setShowBio] = useState(false);

  // The Bioindicadores section and any bioindicator selection bring the sampling sites back.
  useEffect(() => {
    setShowBio(showBioSites);
  }, [showBioSites]);

  // The Minería section and any zone selection always bring the layer back.
  useEffect(() => {
    if (section === 'mineria' || selectedZonaId) setShowMineria(true);
  }, [section, selectedZonaId]);

  const zonasVisibles = useMemo(
    () => (mineria?.zonas ?? []).filter((z) => z.celdas >= MIN_CELDAS_ZONA),
    [mineria],
  );
  const mostrarZonas = showMineria && (section === 'mineria' || !!selectedZonaId);

  // Hovering a community or a mining zone in the list keeps it inside the visible map.
  const preview = useMemo(() => {
    const com = comunidades.find((place) => place.id === hoveredComunidadId);
    if (com) return com;
    const zona = zonasVisibles.find((z) => z.id === hoveredZonaId);
    return zona ? { latitud: zona.centro[0], longitud: zona.centro[1] } : undefined;
  }, [comunidades, hoveredComunidadId, zonasVisibles, hoveredZonaId]);

  const conteoPorPeriodo = useMemo(() => {
    const conteo: Record<PeriodoId, number> = { antiguo: 0, medio: 0, reciente: 0 };
    mineria?.celdas.forEach((c) => conteo[periodoDe(c.anio).id]++);
    return conteo;
  }, [mineria]);

  const togglePeriodo = (id: PeriodoId) =>
    setPeriodos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    if (highlightIds !== null || hoveredComunidadId) setShowComunidades(true);
  }, [highlightIds, hoveredComunidadId]);
  useEffect(() => { if (selectedComunidadId) setShowComunidades(true); }, [selectedComunidadId]);
  useEffect(() => { if (selectedReporteId) setShowReportes(true); }, [selectedReporteId]);

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
    <div className={`atlas-map relative h-full w-full overflow-hidden ${rightPanelOpen ? 'has-right-panel' : ''} ${explorerCompact ? 'explorer-is-compact' : ''}`}>
      <div className="map-heading">
        <span><MapPin size={14} /> Bolivia</span>
        <h1>Amazonía boliviana</h1>
      </div>
      <div className={`map-controls glass ${controlsOpen ? 'expanded' : ''}`}>
        <button onClick={() => setControlsOpen((v) => !v)} className="layers-toggle" aria-label="Capas y leyenda"
          aria-expanded={controlsOpen}
        >
          <Layers size={17} /> Capas
          <ChevronDown className={`h-4 w-4 text-ink-3 ${controlsOpen ? 'rotate-180' : ''}`} />
        </button>
        {controlsOpen && (
          <>
            <div className="border-t border-line px-3 py-2.5">
              <div className="grid grid-cols-3 rounded border border-line-strong p-0.5">
                {baseOptions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setBaseMap(o.id)}
                    className={`rounded-sm py-1 text-[11px] font-medium ${
                      baseMap === o.id ? 'bg-forest-100 text-forest-600' : 'text-ink-2 hover:bg-paper'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-line px-3 py-2">
              <Toggle checked={showRios} onChange={setShowRios}>
                Red hidrográfica
              </Toggle>
              <Toggle checked={showComunidades} onChange={setShowComunidades}>
                Comunidades
              </Toggle>
              <Toggle checked={showReportes} onChange={setShowReportes}>
                Reportes <span className="text-ink-3">({reportes.length})</span>
              </Toggle>
              <Toggle checked={showBio} onChange={setShowBio}>
                Mercurio medido (sitios)
                {bio && <span className="text-ink-3">({bio.catalogo.sitios.filter((x) => x.lat !== null).length})</span>}
              </Toggle>
              <Toggle checked={showMineria} onChange={setShowMineria}>
                Huella minera (satélite)
                {mineria && <span className="text-ink-3">({mineria.celdas.length.toLocaleString('es-BO')})</span>}
              </Toggle>
            </div>
            {showMineria && (
              <div className="mining-legend border-t border-line px-3 py-2.5">
                <div className="eyebrow mb-1.5">Huella minera · primera detección</div>
                {mineriaError ? (
                  <p className="text-[11px] text-clay">
                    No se pudo cargar la capa.{' '}
                    <button className="underline" onClick={onRetryMineria}>
                      Reintentar
                    </button>
                  </p>
                ) : !mineria ? (
                  <p className="text-[11px] text-ink-3">Cargando…</p>
                ) : (
                  <>
                    <ul className="space-y-0.5">
                      {PERIODOS.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => togglePeriodo(p.id)}
                            aria-pressed={periodos.has(p.id)}
                            className={`mining-period ${periodos.has(p.id) ? '' : 'is-off'}`}
                            title={periodos.has(p.id) ? 'Ocultar este periodo' : 'Mostrar este periodo'}
                          >
                            <i style={{ background: p.color }} />
                            <span>{p.label}</span>
                            <b>{conteoPorPeriodo[p.id].toLocaleString('es-BO')}</b>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[10px] leading-snug text-ink-3">
                      Cuadros de ~480 m. Borde punteado: provisional. No distingue minería legal de ilegal.{' '}
                      <a href={mineria.url} target="_blank" rel="noreferrer" className="underline">
                        Amazon Mining Watch
                      </a>{' '}
                      · {mineria.licencia}
                    </p>
                  </>
                )}
              </div>
            )}
            {showBio && (
              <div className="border-t border-line px-3 py-2.5">
                <div className="eyebrow mb-1.5">Sitios con mercurio medido</div>
                <ul className="space-y-0.5 text-[11px] text-ink-2">
                  {(['bolivia', 'madeira', 'amazonia', 'fuera'] as const).map((k) => (
                    <li key={k} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: ALCANCES[k].color }} />
                      {ALCANCES[k].label}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[10px] leading-snug text-ink-3">Ubicación aproximada del estudio. Datos publicados, con su fuente.</p>
              </div>
            )}
            <div className="border-t border-line px-3 py-2.5">
              <div className="eyebrow mb-1.5">Nivel de alerta</div>
              <div className="flex">
                {NIVELES.map((n) => (
                  <div key={n.key} className="flex-1">
                    <div className="mr-[2px] h-2.5 rounded-[2px]" style={{ background: n.color }} />
                    <div className="mt-1 text-[10px] text-ink-2">{n.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-ink-3">El color indica el nivel de alerta registrado</p>
              <div className="eyebrow mb-1 mt-2.5">Reportes</div>
              <ul className="space-y-0.5 text-[11px] text-ink-2">
                {(['crudo', 'semiverificado', 'verificado', 'descartado'] as const).map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: ESTADOS[k].color }} />
                    {ESTADOS[k].label}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <MapContainer
        center={BOLIVIA.getCenter()}
        zoom={6}
        zoomSnap={0.25}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <CameraController target={target} preview={preview} />
        <MapInteraction onInteract={onMapInteract} />
        <ZoomControl position="bottomleft" />
        <ScaleControl imperial={false} position="bottomleft" />
        <MapTools />

        <TileLayer
          key={baseMap}
          attribution="&copy; Google"
          url={tileUrls[baseMap]}
          maxZoom={20}
          subdomains={['0', '1', '2', '3']}
        />

        <BoliviaBorder />

        {showMineria && mineria && <MiningLayer datos={mineria} periodos={periodos} />}

        {showBio && bio && (
          <BioSitesLayer indice={bio} taxonIds={bioTaxonIds} selectedSitioId={selectedSitioId} onSelect={onSelectSitio} />
        )}

        {children}

        {mostrarZonas &&
          zonasVisibles.map((z) => {
            const selected = selectedZonaId === z.id;
            const hovered = hoveredZonaId === z.id;
            return (
              <Marker
                key={z.id}
                position={z.centro}
                icon={createZonaIcon(z, selected || hovered)}
                title={`Zona minera ${z.nombre}`}
                alt={`Zona minera ${z.nombre}`}
                zIndexOffset={selected || hovered ? 1200 : 200}
                eventHandlers={{ click: () => onSelectZona(z) }}
              >
                <Tooltip
                  key={selected || hovered ? 'fija' : 'hover'}
                  permanent={selected || hovered}
                  direction="right"
                  offset={[14, 0]}
                  className="ev-label"
                >
                  <span className="ev-label-name">Zona minera · {z.nombre}</span>
                  <small className="ev-preview-meta">
                    {formatKm2(z.km2)} · desde {describirAnio(z.primer_anio)}
                    {z.recientes > 0 ? ` · ${z.recientes} nuevas 2025–26` : ''}
                  </small>
                </Tooltip>
              </Marker>
            );
          })}

        {showRios && rios && (
          <GeoJSON
            data={rios as any}
            style={(feature) => ({
              color: COLORS.water,
              weight: feature?.properties.grosor || 3,
              opacity: 0.75,
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
            const selected = selectedComunidadId === c.id;
            const dimmed = highlightIds !== null && !highlightIds.includes(c.id);
            const side = window.innerWidth < 768 ? 'auto' : labelSide(c, comunidades);
            const showLabel = hoveredComunidadId === c.id || selected || !!highlightIds?.includes(c.id);
            return (
              <React.Fragment key={c.id}>
                <Marker
                  position={[c.latitud, c.longitud]}
                  title={c.nombre}
                  alt={c.nombre}
                  icon={createComunidadIcon(c.alerta_nivel, selected || hoveredComunidadId === c.id || !!highlightIds?.includes(c.id))}
                  opacity={dimmed && hoveredComunidadId !== c.id && !selected ? 0.25 : 1}
                  zIndexOffset={hoveredComunidadId === c.id || selected ? 1000 : highlightIds?.includes(c.id) ? 500 : 0}
                  eventHandlers={{ click: () => onSelectComunidad(c) }}
                >
                  <Tooltip key={showLabel || !dimmed ? 'visible' : 'hover'} permanent={showLabel || !dimmed} direction={side} offset={side === 'auto' ? [0, 0] : side === 'left' ? [-10, 0] : [10, 0]} className="ev-label">
                    <span className="ev-label-name">{c.nombre}</span>
                    {hoveredComunidadId === c.id && <small className="ev-preview-meta">{c.departamento} · Alerta {alertaTone(c.alerta_nivel).label.toLowerCase()}</small>}
                  </Tooltip>
                </Marker>
              </React.Fragment>
            );
          })}

        {showReportes &&
          reportes.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitud, r.longitud]}
              icon={createReportIcon(r.estado, selectedReporteId === r.id)}
              zIndexOffset={selectedReporteId === r.id ? 1000 : 0}
              eventHandlers={{ click: () => onSelectReporte(r) }}
            />
          ))}
      </MapContainer>
    </div>
  );
};
