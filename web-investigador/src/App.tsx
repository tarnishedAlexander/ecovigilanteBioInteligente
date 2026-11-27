import React, { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { BasinSummary } from './components/BasinSummary';
import { Header, AtlasSection } from './components/Header';
import { MapViewer, CameraTarget } from './components/MapViewer';
import { ExplorerPanel, BioFilter } from './components/ExplorerPanel';
import { DetailPanel, Seleccion } from './components/DetailPanel';
import { ResearchPanel } from './components/ResearchPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { ResearchSitesLayer } from './components/ResearchSitesLayer';
import { api } from './services/api';
import { Reporte, Comunidad, Metricas, Proyecto, ProyectoDatos, RioGeoJSON, Sitio, Taxon } from './types';
import { IndiceBio, indexar } from './lib/bio';
import { normalize } from './lib/ui';
import { IndiceInv, MATRICES, MatrizTab, indexarInv, medicionesDe } from './lib/investigacion';
import { generarPropuesta } from './lib/proyectos';
import { DatosMineria, MIN_CELDAS_ZONA, ZonaMinera, cargarMineria } from './lib/mineria';

/** Taxa whose sampling sites the map shows for a filter: the taxon itself plus the relatives it relies on. */
function taxaDelFiltro(filter: NonNullable<BioFilter>, bio: IndiceBio) {
  if (filter.kind === 'grupo') return new Set(bio.catalogo.taxones.filter((t) => t.grupo === filter.grupo).map((t) => t.id));
  const t = bio.taxon.get(filter.id);
  return new Set([filter.id, ...(t?.referencias.map((r) => r.taxon) ?? [])]);
}

/** Communities in the Bolivian departments where the filtered taxon has been recorded (GBIF). */
function comunidadesConTaxon(filter: NonNullable<BioFilter>, bio: IndiceBio, comunidades: Comunidad[]) {
  if (filter.kind !== 'taxon') return null;
  const deps = new Set((bio.taxon.get(filter.id)?.bolivia?.departamentos ?? []).map(normalize));
  return comunidades.filter((c) => deps.has(normalize(c.departamento))).map((c) => c.id);
}

export function App() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [bio, setBio] = useState<IndiceBio | null>(null);
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

  // Investigación: published mercury studies by matrix. Loaded on its own so the atlas never waits for it.
  const [inv, setInv] = useState<IndiceInv | null>(null);
  const [invCargando, setInvCargando] = useState(true);
  const [matriz, setMatriz] = useState<MatrizTab>('agua');
  const [estudioId, setEstudioId] = useState<string | null>(null);
  const [invSitioId, setInvSitioId] = useState<string | null>(null);

  // Proyectos: research projects per community. Unlike the catalogs, they change with use (database).
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [proyectosCargando, setProyectosCargando] = useState(true);

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
        setBio(indexar(biosData));
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
    api.getInvestigacion()
      .then((d) => setInv(indexarInv(d)))
      .catch((err) => console.error('Error al cargar investigación:', err))
      .finally(() => setInvCargando(false));
    api.getProyectos()
      .then(setProyectos)
      .catch((err) => console.error('Error al cargar proyectos:', err))
      .finally(() => setProyectosCargando(false));
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

  /** Frame the sampling sites of a taxon; sites outside South America's Amazon would zoom the map out too far. */
  const flyToSitios = (ids: Set<string>) => {
    if (!bio) return;
    const puntos = bio.catalogo.mediciones
      .filter((m) => ids.has(m.taxon))
      .map((m) => bio.sitio.get(m.sitio)!)
      .filter((s) => s.lat !== null && s.lng !== null && s.alcance !== 'fuera')
      .map((s) => [s.lat!, s.lng!] as [number, number]);
    if (!puntos.length) return;
    const bounds = L.latLngBounds(puntos);
    flyTo(bounds.pad(0.2).extend(bounds.getCenter().toBounds(60000)), 8);
  };

  const filterBio = (filter: BioFilter) => {
    setBioFilter(filter);
    if (filter?.kind === 'taxon' && bio) flyToSitios(taxaDelFiltro(filter, bio));
  };

  const selectBio = (t: Taxon) => {
    setSeleccion({ tipo: 'bioindicador', bio: t });
    setExplorerCompact(true);
    filterBio({ kind: 'taxon', id: t.id });
  };

  const selectSitio = (s: Sitio) => {
    setSeleccion({ tipo: 'sitio', sitio: s });
    setExplorerCompact(true);
    if (s.lat !== null && s.lng !== null) flyTo(L.latLng(s.lat, s.lng).toBounds(40000), 9);
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

  /* ---------- Investigación ---------- */

  // Measurements drawn on the map: one unit per matrix, so a site's tooltip range is comparable.
  const invMapa = useMemo(() => {
    if (!inv) return [];
    const unidad = MATRICES.find((m) => m.id === matriz)!.unidad;
    return medicionesDe(inv, matriz).filter((m) => m.unidad === unidad && (matriz !== 'peces' || m.base !== 'seco'));
  }, [inv, matriz]);

  const flyToInv = (sitios: string[]) => {
    if (!inv || !sitios.length) return;
    const bounds = L.latLngBounds(sitios.map((id) => inv.sitio.get(id)!).map((s) => [s.lat, s.lng] as [number, number]));
    flyTo(bounds.pad(0.25).extend(bounds.getCenter().toBounds(80000)), 8);
  };

  const elegirMatriz = (m: MatrizTab) => {
    setMatriz(m);
    setEstudioId(null);
    setInvSitioId(null);
    if (inv) {
      const unidad = MATRICES.find((x) => x.id === m)!.unidad;
      // Frame Bolivia and the Peruvian Madre de Dios; the lower Madeira sites in Brazil stay reachable by panning.
      flyToInv([...new Set(medicionesDe(inv, m).filter((x) => x.unidad === unidad).map((x) => x.sitio))]
        .filter((id) => inv.sitio.get(id)!.pais !== 'Brasil'));
    }
  };

  const elegirEstudio = (id: string | null) => {
    setEstudioId(id);
    setInvSitioId(null);
    if (id && inv) flyToInv([...new Set(invMapa.filter((m) => m.estudio === id).map((m) => m.sitio))]);
  };

  const elegirSitioInv = (id: string | null) => {
    setInvSitioId(id);
    setExplorerCompact(false);
    if (id && inv) {
      const s = inv.sitio.get(id)!;
      flyTo(L.latLng(s.lat, s.lng).toBounds(60000), 9);
    }
  };

  /* ---------- Proyectos ---------- */

  const comunidadesConProyecto = useMemo(() => [...new Set((proyectos ?? []).map((p) => p.comunidad_id))], [proyectos]);

  const selectProyecto = (p: Proyecto) => {
    setSeleccion({ tipo: 'proyecto', proyecto: p });
    setExplorerCompact(true);
    const c = comunidades.find((x) => x.id === p.comunidad_id);
    if (c) flyTo(L.latLng(c.latitud, c.longitud).toBounds(30000), 11);
  };

  const guardarProyecto = async (datos: ProyectoDatos, id: string) => {
    const guardado = await api.guardarProyecto(datos, id);
    setProyectos((prev) => (prev ?? []).map((p) => (p.id === id ? guardado : p)));
    setSeleccion((s) => (s?.tipo === 'proyecto' && s.proyecto.id === id ? { tipo: 'proyecto', proyecto: guardado } : s));
  };

  const generarPropuestaPara = async (c: Comunidad) => {
    const borrador = generarPropuesta({ comunidad: c, reportes: reportes.filter((r) => r.comunidad_id === c.id), bio, inv, mineria });
    const creado = await api.guardarProyecto(borrador);
    setProyectos((prev) => [creado, ...(prev ?? [])]);
    selectProyecto(creado);
  };

  const highlightIds = useMemo(
    () => (section === 'proyectos' && !seleccion ? comunidadesConProyecto
      : bioFilter && bio ? comunidadesConTaxon(bioFilter, bio, comunidades) : null),
    [bioFilter, bio, comunidades, section, seleccion, comunidadesConProyecto],
  );
  const bioTaxonIds = useMemo(() => (bioFilter && bio ? taxaDelFiltro(bioFilter, bio) : null), [bioFilter, bio]);
  const showBioSites = section === 'bioindicadores' || seleccion?.tipo === 'bioindicador' || seleccion?.tipo === 'sitio';

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
            if (next === 'investigacion') elegirMatriz(matriz);
            if (next === 'proyectos') {
              const conProyecto = comunidades.filter((c) => comunidadesConProyecto.includes(c.id));
              if (conProyecto.length) {
                const bounds = L.latLngBounds(conProyecto.map((c) => [c.latitud, c.longitud] as [number, number]));
                flyTo(bounds.pad(0.3).extend(bounds.getCenter().toBounds(120000)), 9);
              }
            }
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
          bio={bio}
          bioTaxonIds={bioTaxonIds}
          showBioSites={showBioSites}
          selectedSitioId={seleccion?.tipo === 'sitio' ? seleccion.sitio.id : undefined}
          onSelectSitio={selectSitio}
        >
          {section === 'investigacion' && inv && (
            <ResearchSitesLayer inv={inv} mediciones={invMapa} estudioId={estudioId} sitioId={invSitioId} onSelect={elegirSitioInv} />
          )}
        </MapViewer>

        {/* The basin summary is about communities; in Investigación it would cover study sites. */}
        {section !== 'investigacion' && section !== 'proyectos' && <BasinSummary comunidades={comunidades} metricas={metricas} />}
        {section === 'proyectos' && !explorerCompact && !seleccion ? (
          <ProjectsPanel proyectos={proyectos} comunidades={comunidades} loading={proyectosCargando}
            onSelect={selectProyecto} onCollapse={() => setExplorerCompact(true)} />
        ) : section === 'investigacion' && !explorerCompact && !seleccion ? (
          <ResearchPanel inv={inv} loading={invCargando} matriz={matriz} onMatriz={elegirMatriz}
            estudioId={estudioId} onEstudio={elegirEstudio} sitioId={invSitioId} onSitio={elegirSitioInv}
            onCollapse={() => setExplorerCompact(true)} />
        ) : <ExplorerPanel view={section} detailOpen={!!seleccion}
          loading={loading}
          comunidades={comunidades}
          bio={bio}
          reportes={reportes}
          filter={bioFilter}
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
        />}

        {seleccion && (
          <DetailPanel
            seleccion={seleccion}
            comunidades={comunidades}
            reportes={reportes}
            bio={bio}
            onClose={() => setSeleccion(null)}
            onSelectComunidad={selectComunidad}
            onSelectBio={selectBio}
            onSelectSitio={selectSitio}
            onSelectReporte={selectReporte}
            onUpdateEstado={handleUpdateEstado}
            onCenter={(lat, lng) => flyTo(L.latLng(lat, lng).toBounds(4000))}
            mineria={mineria}
            onSelectZona={selectZona}
            inv={inv}
            proyectos={proyectos ?? []}
            onSelectProyecto={selectProyecto}
            onGenerarPropuesta={generarPropuestaPara}
            onGuardarProyecto={guardarProyecto}
          />
        )}
      </main>
    </div>
  );
}

export default App;
