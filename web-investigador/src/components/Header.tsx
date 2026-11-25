import React from 'react';
import { ShieldCheck, Waves, AlertTriangle, CheckCircle2, FileQuestion, RefreshCw, Sparkles } from 'lucide-react';
import { Metricas } from '../types';

interface HeaderProps {
  metricas: Metricas | null;
  loading: boolean;
  onRefresh: () => void;
  backendOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metricas,
  loading,
  onRefresh,
  backendOnline
}) => {
  return (
    <header className="h-16 px-6 glass-panel border-b border-emerald-900/40 flex items-center justify-between z-30 relative select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center space-x-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 shadow-lg shadow-emerald-950/60 border border-emerald-400/40">
          <Waves className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              EcoVigilante <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SIG Bolivia</span>
            </h1>
          </div>
          <p className="text-[11px] text-emerald-300/70 font-medium">
            Red de Detección de Mercurio en Cuencas Amazónicas • Cuenca Beni & Madre de Dios
          </p>
        </div>
      </div>

      {/* Metrics Chips */}
      {metricas && (
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs shadow-inner">
            <FileQuestion className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="font-semibold">{metricas.en_crudo}</span>
            <span className="text-red-400/80">En Crudo</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs shadow-inner">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">{metricas.semiverificados}</span>
            <span className="text-amber-400/80">Semiverificados</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{metricas.verificados}</span>
            <span className="text-emerald-400/80">Verificados Lab</span>
          </div>
        </div>
      )}

      {/* Researcher Badge & Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 hover:text-white transition-all disabled:opacity-50"
          title="Actualizar datos del servidor"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/30 flex items-center justify-center border border-emerald-400/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              Investigador Acreditado
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="text-[10px] text-emerald-400/80">
              Biología & Toxicología • Bolivia
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
