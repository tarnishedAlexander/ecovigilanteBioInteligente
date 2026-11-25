import React from 'react';
import { Wifi, WifiOff, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingCount: number;
  onSync: () => void;
  syncing: boolean;
  onBack?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  isOnline,
  onToggleOnline,
  pendingCount,
  onSync,
  syncing,
  onBack
}) => {
  return (
    <header className="px-4 py-3 bg-[#031d16] border-b border-emerald-900/60 flex items-center justify-between text-white sticky top-0 z-30 select-none">
      <div className="flex items-center space-x-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-xl">🌿</span>
        )}
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
            {title}
          </h2>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            EcoGuardián • Comunidades Bolivia
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Network simulator switch */}
        <button
          onClick={onToggleOnline}
          className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all ${
            isOnline
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
          title="Simular conexión a internet"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Sin Red (Río)</span>
            </>
          )}
        </button>

        {/* Sync button if pending */}
        {pendingCount > 0 && isOnline && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
            title={`Sincronizar ${pendingCount} reportes`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
