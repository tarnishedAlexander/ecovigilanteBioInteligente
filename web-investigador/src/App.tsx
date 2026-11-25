import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapViewer } from './components/MapViewer';
import { api } from './services/api';
import { Reporte, Comunidad, Bioindicador, Metricas, RioGeoJSON } from './types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [bioindicadores, setBioindicadores] = useState<Bioindicador[]>([]);
  const [rios, setRios] = useState<RioGeoJSON | null>(null);
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [selectedComunidad, setSelectedComunidad] = useState<Comunidad | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

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
          api.getMetricas()
        ]);

        setReportes(repsData);
        setComunidades(comsData);
        setBioindicadores(biosData);
        setRios(riosData);
        setMetricas(metsData);
      } else {
        setErrorMsg('El backend en http://localhost:8000 no responde. Asegúrate de tenerlo levantado con ./run.sh en la carpeta backend/.');
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
      // Actualizar en el estado local
      setReportes(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedReporte && selectedReporte.id === id) {
        setSelectedReporte(updated);
      }
      // Refrescar métricas
      const newMets = await api.getMetricas();
      setMetricas(newMets);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado');
    }
  };

  const handleFlyTo = (lat: number, lng: number) => {
    setFlyToCoords([lat, lng]);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper text-ink">
      <Header metricas={metricas} loading={loading} onRefresh={loadData} backendOnline={backendOnline} />

      {!backendOnline && !loading && (
        <div className="z-40 flex shrink-0 items-center justify-between gap-4 border-b border-ochre/30 bg-ochre-bg px-5 py-2 text-[13px] text-ink-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-ochre" />
            <span>
              <strong className="font-semibold text-ink">Sin conexión con el servidor.</strong> Inicia el backend con{' '}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-[12px] text-ink">./run.sh</code> en la carpeta{' '}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-[12px] text-ink">backend/</code>.
            </span>
          </div>
          <button onClick={loadData} className="btn-secondary px-2.5 py-1 text-[12px]">
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* Main Workspace: Sidebar (Left) + Leaflet Map (Right) */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          reportes={reportes}
          comunidades={comunidades}
          bioindicadores={bioindicadores}
          selectedReporte={selectedReporte}
          selectedComunidad={selectedComunidad}
          onSelectReporte={setSelectedReporte}
          onSelectComunidad={setSelectedComunidad}
          onUpdateEstado={handleUpdateEstado}
          onFlyTo={handleFlyTo}
        />

        <MapViewer
          rios={rios}
          comunidades={comunidades}
          reportes={reportes}
          selectedReporte={selectedReporte}
          onSelectReporte={setSelectedReporte}
          flyToCoords={flyToCoords}
        />
      </main>
    </div>
  );
}

export default App;
