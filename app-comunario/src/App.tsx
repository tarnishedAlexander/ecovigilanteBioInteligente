import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { CameraScreen } from './components/CameraScreen';
import { ChatGemmaScreen } from './components/ChatGemmaScreen';
import { storageService } from './services/storage';
import { PendingReport } from './types';
import { 
  Camera, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  UploadCloud, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  Fish,
  Droplets,
  Leaf,
  Activity,
  AlertTriangle
} from 'lucide-react';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'camera' | 'chat'>('home');
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);

  const loadLocalReports = () => {
    setReports(storageService.getReports());
  };

  useEffect(() => {
    loadLocalReports();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveReport = (newReport: PendingReport) => {
    storageService.saveReport(newReport);
    loadLocalReports();
    setCurrentScreen('home');
    showNotification('✓ Reporte guardado en la memoria local del teléfono.');

    // If online, auto-sync
    if (isOnline) {
      handleSync();
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      showNotification('⚠️ Sin conexión. El reporte se enviará al llegar a Riberalta o punto Wi-Fi.');
      return;
    }

    setSyncing(true);
    try {
      const res = await storageService.syncAllPending();
      loadLocalReports();
      if (res.synced > 0) {
        showNotification(`🎉 ${res.synced} reporte(s) sincronizados con el servidor del investigador.`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const pendingReportsCount = reports.filter(r => !r.sincronizado).length;

  const renderHomeScreen = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#04281f] to-[#021813] border border-emerald-600/30 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/40">
            Vigilancia Comunitaria Anónima
          </span>
          <h2 className="text-base font-bold text-white pt-1">
            Protegiendo las aguas y comunidades
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tu reporte ayuda a los biólogos y médicos a saber dónde hay mercurio y contaminación aguas arriba.
          </p>
        </div>
      </div>

      {/* 2 Big Action Cards (The Core UX from Whiteboard 1) */}
      <div className="grid grid-cols-1 gap-3">
        {/* Card 1: Camera & Evidence */}
        <button
          onClick={() => setCurrentScreen('camera')}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-teal-900/50 hover:from-emerald-800/70 hover:to-teal-800/60 border border-emerald-500/40 text-left flex items-center justify-between group transition-all shadow-md mobile-touch-active"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/80 border border-emerald-400/40 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Reportar lo que veo
              </h3>
              <p className="text-[11px] text-emerald-300/80">
                Fotos de peces raros, agua lechosa o plantas
              </p>
            </div>
          </div>
          <span className="text-emerald-400 text-lg font-bold">→</span>
        </button>

        {/* Card 2: Chat Assistant Gemma */}
        <button
          onClick={() => setCurrentScreen('chat')}
          className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-emerald-950/60 hover:from-cyan-900/70 hover:to-emerald-900/60 border border-cyan-500/40 text-left flex items-center justify-between group transition-all shadow-md mobile-touch-active"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center shadow-lg shadow-cyan-950/80 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Hablar con EcoGuardián
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">IA Local</span>
              </h3>
              <p className="text-[11px] text-cyan-300/80">
                Cuéntale tus síntomas de salud y qué pescado comes
              </p>
            </div>
          </div>
          <span className="text-cyan-400 text-lg font-bold">→</span>
        </button>
      </div>

      {/* Sync Banner if pending reports exist */}
      {pendingReportsCount > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 shadow-md">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>{pendingReportsCount} reporte(s) en espera</strong> de conexión
            </span>
          </div>
          {isOnline && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Enviar
            </button>
          )}
        </div>
      )}

      {/* Local Reports History */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
          <span>Reportes en este teléfono ({reports.length})</span>
          <span className="text-[10px] text-slate-400">Memoria local</span>
        </h4>

        {reports.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-emerald-900/60 rounded-xl text-slate-400 text-xs">
            Aún no has generado ningún reporte local.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-emerald-800/40 flex items-center justify-center text-sm shrink-0">
                    {rep.categoria === 'pez' ? '🐟' : rep.categoria === 'agua' ? '💧' : rep.categoria === 'planta' ? '🌿' : '🩺'}
                  </div>
                  <div>
                    <span className="font-semibold text-white block capitalize">
                      {rep.categoria} • {rep.comunidad_nombre || 'Riberalta'}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {rep.descripcion_usuario || 'Reporte de síntomas registrado'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {rep.sincronizado ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-600/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/30">
                      <Clock className="w-3 h-3 text-amber-400" /> En Teléfono
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#010e0b] text-slate-100 flex flex-col items-center justify-center p-0 md:p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Mode Toggle Bar */}
      <div className="hidden md:flex items-center justify-between w-full max-w-sm mb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <Smartphone className="w-4 h-4" /> Vista Móvil Comunario
        </span>
        <button
          onClick={() => setDeviceFrameMode(!deviceFrameMode)}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {deviceFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          {deviceFrameMode ? 'Expandir' : 'Marco Celular'}
        </button>
      </div>

      {/* Smartphone Mockup Container */}
      <div
        className={`w-full transition-all overflow-hidden bg-[#021813] border-emerald-800/60 flex flex-col ${
          deviceFrameMode
            ? 'max-w-sm h-[720px] rounded-[36px] border-4 border-slate-700 shadow-2xl shadow-emerald-950/90 relative'
            : 'h-screen w-full'
        }`}
      >
        {/* Notch / Speaker on Smartphone */}
        {deviceFrameMode && (
          <div className="w-full flex justify-center pt-2 pb-1 bg-[#031d16]">
            <div className="w-24 h-4 bg-black/60 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-950 border border-emerald-800/40"></div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="absolute top-14 left-4 right-4 z-50 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-emerald-400/40 animate-slide-up flex items-center gap-2">
            <span>🔔</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <HeaderBar
          title={
            currentScreen === 'camera'
              ? 'Reporte de Evidencia'
              : currentScreen === 'chat'
              ? 'Asistente EcoGuardián'
              : 'EcoGuardián'
          }
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
          pendingCount={pendingReportsCount}
          onSync={handleSync}
          syncing={syncing}
          onBack={currentScreen !== 'home' ? () => setCurrentScreen('home') : undefined}
        />

        {/* Active Screen */}
        {currentScreen === 'home' && renderHomeScreen()}
        {currentScreen === 'camera' && (
          <CameraScreen
            onSave={handleSaveReport}
            onCancel={() => setCurrentScreen('home')}
          />
        )}
        {currentScreen === 'chat' && (
          <ChatGemmaScreen
            onSaveReport={handleSaveReport}
            onCancel={() => setCurrentScreen('home')}
          />
        )}
      </div>
    </div>
  );
}

export default App;
