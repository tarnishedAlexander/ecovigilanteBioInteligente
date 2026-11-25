import React, { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { BasinSummary } from './components/BasinSummary';
import { Header, AtlasSection } from './components/Header';
import { MapViewer, CameraTarget } from './components/MapViewer';
import { ExplorerPanel, BioFilter } from './components/ExplorerPanel';
import { DetailPanel, Seleccion } from './components/DetailPanel';
import { api } from './services/api';
import { Reporte, Comunidad, Bioindicador, Metricas, RioGeoJSON } from './types';
import { ESTUDIOS } from './data/expedientes';
import { DatosMineria, MIN_CELDAS_ZONA, ZonaMinera, cargarMineria } from './lib/mineria';

function sampledCommunityIds(filter: NonNullable<BioFilter>, bioindicadores: Bioindicador[]) {
  const species = bioindicadores.filter((bio) => {
    if (filter.kind === 'species') return bio.id === filter.id;
    return filter.category === 'peces' ? bio.tipo.startsWith('pez') : bio.tipo === 'planta';
  });
  const speciesIds = new Set(species.map((bio) => bio.id));
  return [...new Set(ESTUDIOS
    .filter((study) => study.muestras.some((sample) => sample.bioindicadorId && speciesIds.has(sample.bioindicadorId)))
    .map((study) => study.comunidadId))];
}

export function App() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [bioindicadores, setBioindicadores] = useState<Bioindicador[]>([]);
  const [rios, setRios] = useState<RioGeoJSON | null>(null);
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [hoveredComunidadId, setHoveredComunidadId] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraTarget | null>(null);
  const [bioFilter, setBioFilter] = useState<BioFilter>(null);
  const [section, setSection] = useState<AtlasSection>('comunidades');
  // The explorer starts folded so the first view is the whole map; it opens only on request.
  const [explorerCompact, setExplorerCompact] = useState(true);
  const [hoveredZonaId, setHoveredZonaId] = useState<string | null>(null);

  // Satellite mining footprint: shared by the map, the Minería list and the community panel.
  const [mineria, setMineria] = useState<DatosMineria | null>(null);
  const [mineriaError, setMineriaError] = useState(false);
  const [intentoMineria, setIntentoMineria] = useState(0);
  useEffect(() => {
    let vigente = true;
    setMineriaError(false);
    cargarMineria()
      .then((d) => vigente && setMineria(d))
      .catch((err) => {
        console.error(err);
        if (vigente) setMineriaError(true);
      });
    return () => {
      vigente = false;
    };
  }, [intentoMineria]);

  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isOnline = await api.getHealth();
      setBackendOnline(isOnline);

      if (isOnline) {
        const [repsData, comsData, biosData, riosData, metsData] = await Promise.all([
          api.getReportes(),
          api.getComunidades(),
          api.getBioindicadores(),
          api.getRios(),
          api.getMetricas(),
        ]);

        setReportes(repsData);
        setComunidades(comsData);
        setBioindicadores(biosData);
        setRios(riosData);
        setMetricas(metsData);
      } else {
        setErrorMsg('No se pudo conectar con el servidor. Comprueba la conexión y vuelve a intentarlo.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al conectar con la API de EcoVigilante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateEstado = async (id: string, nuevoEstado: string, notas?: string) => {
    try {
      const updated = await api.updateReporteEstado(id, nuevoEstado, notas);
      setReportes((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSeleccion((s) => (s?.tipo === 'reporte' && s.reporte.id === id ? { ...s, reporte: updated } : s));
      api.getMetricas().then(setMetricas).catch((err) => console.error('Error al actualizar métricas:', err));
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      throw err;
    }
  };

  /* ---------- Selection -> camera ---------- */

  const flyTo = (bounds: L.LatLngBounds, maxZoom = 11) => setCamera({ bounds, maxZoom });

  const selectComunidad = (c: Comunidad) => {
    setSeleccion({ tipo: 'comunidad', comunidad: c });
    setExplorerCompact(true);
    // At these latitudes zoom 15.25 gives a 300 m scale bar (about 4 m per pixel).
    flyTo(L.latLngBounds([[c.latitud, c.longitud]]), 15.25);
  };

  const filterBio = (filter: BioFilter) => {
    setBioFilter(filter);
    if (!filter) return;
    const ids = sampledCommunityIds(filter, bioindicadores);
    const places = comunidades.filter((place) => ids.includes(place.id));
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map((place) => [place.latitud, place.longitud]));
    flyTo(bounds.pad(0.12).extend(bounds.getCenter().toBounds(20000)));
  };

  const selectBio = (b: Bioindicador) => {
    setSeleccion({ tipo: 'bioindicador', bio: b });
    setExplorerCompact(true);
    filterBio({ kind: 'species', id: b.id });
  };

  const selectZona = (zona: ZonaMinera) => {
    setSeleccion({ tipo: 'zona', zona });
    setHoveredZonaId(null);
    setExplorerCompact(true);
    flyTo(L.latLngBounds(zona.bbox).pad(0.25), 13);
  };

  const selectReporte = (r: Reporte, desde?: Comunidad) => {
    setSeleccion({ tipo: 'reporte', reporte: r, desde });
    setExplorerCompact(true);
    flyTo(L.latLng(r.latitud, r.longitud).toBounds(8000));
  };

  const highlightIds = useMemo(() => bioFilter ? sampledCommunityIds(bioFilter, bioindicadores) : null, [bioFilter, bioindicadores]);

  const selectedComunidadId =
    seleccion?.tipo === 'comunidad' ? seleccion.comunidad.id : seleccion?.tipo === 'reporte' ? seleccion.desde?.id : undefined;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper text-ink">
      {errorMsg && !loading && (
        <div className="z-40 flex shrink-0 items-center justify-between gap-4 border-b border-ochre/30 bg-ochre-bg px-5 py-2 text-[13px] text-ink-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-ochre" />
            <span>
              {errorMsg}
            </span>
          </div>
          <button onClick={loadData} className="btn-secondary px-2.5 py-1 text-[12px]">
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* Full-bleed map with floating panels on top */}
      <main className={`atlas-main relative min-h-0 flex-1 overflow-hidden ${seleccion ? 'has-selection' : ''}`}>
        <Header active={section} loading={loading} onRefresh={loadData} backendOnline={backendOnline}
          onNavigate={(next) => {
            setSection(next);
            setSeleccion(null);
            setHoveredComunidadId(null);
            setHoveredZonaId(null);
            setExplorerCompact(false);
            if (next !== 'bioindicadores') setBioFilter(null);
            // Mining zones span several departments: frame all of them.
            if (next === 'mineria' && mineria) {
              const zonas = mineria.zonas.filter((z) => z.celdas >= MIN_CELDAS_ZONA);
              flyTo(L.latLngBounds(zonas.flatMap((z) => z.bbox)), 8);
            }
          }} />
        <MapViewer
          rios={rios}
          comunidades={comunidades}
          reportes={reportes}
          selectedReporteId={seleccion?.tipo === 'reporte' ? seleccion.reporte.id : undefined}
          selectedComunidadId={selectedComunidadId}
          hoveredComunidadId={hoveredComunidadId}
          highlightIds={highlightIds}
          onSelectReporte={(r) => selectReporte(r)}
          onSelectComunidad={selectComunidad}
          target={camera}
          rightPanelOpen={seleccion !== null}
          explorerCompact={explorerCompact}
          onMapInteract={() => setExplorerCompact(true)}
          section={section}
          mineria={mineria}
          mineriaError={mineriaError}
          onRetryMineria={() => setIntentoMineria((n) => n + 1)}
          selectedZonaId={seleccion?.tipo === 'zona' ? seleccion.zona.id : undefined}
          hoveredZonaId={hoveredZonaId}
          onSelectZona={selectZona}
        />

        <BasinSummary comunidades={comunidades} metricas={metricas} />
        <ExplorerPanel view={section} detailOpen={!!seleccion}
          loading={loading}
          comunidades={comunidades}
          bioindicadores={bioindicadores}
          reportes={reportes}
          filter={bioFilter}
          matchingCommunities={comunidades.filter((c) => highlightIds?.includes(c.id)).length}
          onFilter={filterBio}
          compact={explorerCompact}
          onExpand={() => { setSeleccion(null); setExplorerCompact(false); }}
          onCollapse={() => setExplorerCompact(true)}
          onSelectComunidad={selectComunidad}
          onSelectBio={selectBio}
          onSelectReporte={(r) => selectReporte(r)}
          onHoverComunidad={setHoveredComunidadId}
          mineria={mineria}
          mineriaError={mineriaError}
          onRetryMineria={() => setIntentoMineria((n) => n + 1)}
          onSelectZona={selectZona}
          onHoverZona={setHoveredZonaId}
        />

        {seleccion && (
          <DetailPanel
            seleccion={seleccion}
            comunidades={comunidades}
            reportes={reportes}
            bioindicadores={bioindicadores}
            onClose={() => setSeleccion(null)}
            onSelectComunidad={selectComunidad}
            onSelectBio={selectBio}
            onSelectReporte={selectReporte}
            onUpdateEstado={handleUpdateEstado}
            onCenter={(lat, lng) => flyTo(L.latLng(lat, lng).toBounds(4000))}
            mineria={mineria}
            onSelectZona={selectZona}
          />
        )}
      </main>
    </div>
  );
}

export default App;
