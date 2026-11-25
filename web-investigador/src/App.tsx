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
    <div className="flex flex-col h-screen w-screen bg-[#031a14] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        metricas={metricas}
        loading={loading}
        onRefresh={loadData}
        backendOnline={backendOnline}
      />

      {/* Backend connection alert banner if offline */}
      {!backendOnline && !loading && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-40">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Desconectado:</strong> El backend no está corriendo en el puerto 8000. Inicia el servidor con <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">./run.sh</code> para ver datos en vivo.
            </span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 bg-amber-600/60 hover:bg-amber-600 text-white rounded font-medium text-[11px] flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {/* Main Workspace: Sidebar (Left) + Leaflet Map (Right) */}
      <main className="flex flex-1 relative overflow-hidden">
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
