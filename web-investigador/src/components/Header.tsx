import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Metricas } from '../types';
import { ESTADOS } from '../lib/ui';

interface HeaderProps {
  metricas: Metricas | null;
  loading: boolean;
  onRefresh: () => void;
  backendOnline: boolean;
}

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-2 px-4 first:pl-0">
    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
    <span className="text-[13px] text-ink-2">{label}</span>
    <span className="text-[13px] font-semibold text-ink">{value}</span>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ metricas, loading, onRefresh, backendOnline }) => {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between border-b border-line bg-surface px-5 z-30">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="#2F5838" />
            <path d="M16 7c-4 5-6 8.5-6 11.5a6 6 0 0 0 12 0C22 15.5 20 12 16 7z" fill="#F5F3EC" />
          </svg>
          <span className="font-serif text-[19px] font-semibold tracking-tight text-ink">EcoVigilante</span>
        </div>
        <span className="hidden md:block h-5 w-px bg-line" />
        <p className="hidden md:block truncate text-[13px] text-ink-2">
          Vigilancia de mercurio · Cuencas del Beni y Madre de Dios, Bolivia
        </p>
      </div>

      <div className="flex items-center gap-5">
        {metricas && (
          <div className="hidden xl:flex items-center divide-x divide-line">
            <Stat label={ESTADOS.crudo.label} value={metricas.en_crudo} color={ESTADOS.crudo.color} />
            <Stat label={ESTADOS.semiverificado.label} value={metricas.semiverificados} color={ESTADOS.semiverificado.color} />
            <Stat label={ESTADOS.verificado.label} value={metricas.verificados} color={ESTADOS.verificado.color} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-moss' : 'bg-ochre'}`} />
            {loading ? 'Cargando…' : backendOnline ? 'Conectado' : 'Sin conexión'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary px-2 py-1.5"
            title="Actualizar datos"
            aria-label="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="hidden sm:flex items-center gap-2 border-l border-line pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-[11px] font-semibold text-forest-700">
              IN
            </div>
            <div className="leading-tight">
              <div className="text-[12px] font-medium text-ink">Investigador</div>
              <div className="text-[11px] text-ink-3">Toxicología ambiental</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
