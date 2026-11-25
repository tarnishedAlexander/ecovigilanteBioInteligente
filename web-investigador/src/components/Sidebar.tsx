import React, { useState } from 'react';
import { 
  AlertCircle, 
  MapPin, 
  Fish, 
  Droplets, 
  Leaf, 
  Activity, 
  CheckCircle, 
  Clock, 
  Eye, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight, 
  Compass, 
  FileText,
  Filter,
  Check,
  Send
} from 'lucide-react';
import { Reporte, Comunidad, Bioindicador } from '../types';

interface SidebarProps {
  reportes: Reporte[];
  comunidades: Comunidad[];
  bioindicadores: Bioindicador[];
  selectedReporte: Reporte | null;
  selectedComunidad: Comunidad | null;
  onSelectReporte: (reporte: Reporte | null) => void;
  onSelectComunidad: (comunidad: Comunidad | null) => void;
  onUpdateEstado: (id: string, estado: string, notas?: string) => Promise<void>;
  onFlyTo: (lat: number, lng: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  reportes,
  comunidades,
  bioindicadores,
  selectedReporte,
  selectedComunidad,
  onSelectReporte,
  onSelectComunidad,
  onUpdateEstado,
  onFlyTo
}) => {
  const [activeTab, setActiveTab] = useState<'reportes' | 'comunidades' | 'bioindicadores'>('reportes');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [notasTemp, setNotasTemp] = useState<string>('');
  const [savingEstado, setSavingEstado] = useState<boolean>(false);

  const filteredReportes = reportes.filter(r => {
    if (filterEstado === 'todos') return true;
    return r.estado === filterEstado;
  });

  const handleUpdate = async (nuevoEstado: string) => {
    if (!selectedReporte) return;
    setSavingEstado(true);
    try {
      await onUpdateEstado(selectedReporte.id, nuevoEstado, notasTemp || selectedReporte.notas_investigador);
      setNotasTemp('');
    } finally {
      setSavingEstado(false);
    }
  };

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case 'pez': return <Fish className="w-4 h-4 text-cyan-400" />;
      case 'agua': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'planta': return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'salud': return <Activity className="w-4 h-4 text-rose-400" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'crudo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            En Crudo
          </span>
        );
      case 'semiverificado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Semiverificado
          </span>
        );
      case 'verificado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Verificado Lab
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-96 lg:w-[420px] h-[calc(100vh-4rem)] glass-panel border-r border-emerald-900/40 flex flex-col z-20 shadow-2xl overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-emerald-900/40 p-2 bg-[#02231b]/60">
        <button
          onClick={() => { setActiveTab('reportes'); onSelectReporte(null); }}
          className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reportes'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Denuncias ({reportes.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('comunidades'); onSelectReporte(null); }}
          className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'comunidades'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Comunidades ({comunidades.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('bioindicadores'); onSelectReporte(null); }}
          className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bioindicadores'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Fish className="w-3.5 h-3.5" />
          <span>Bioindicadores</span>
        </button>
      </div>

      {/* Detail View of Selected Report (Modal / Slide View) */}
      {selectedReporte ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in bg-gradient-to-b from-[#04211a] to-[#021813]">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
            <button
              onClick={() => onSelectReporte(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 flex items-center gap-1 font-medium transition-colors"
            >
              ← Volver al listado
            </button>
            {getEstadoBadge(selectedReporte.estado)}
          </div>

          {/* Photo Evidence */}
          {selectedReporte.url_foto && (
            <div className="relative rounded-xl overflow-hidden border border-emerald-700/40 shadow-lg group">
              <img
                src={selectedReporte.url_foto}
                alt="Evidencia fotográfica"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Evidencia fotográfica capturada por comunario
                </span>
              </div>
            </div>
          )}

          {/* Core Report Meta */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                {getCategoriaIcon(selectedReporte.categoria)}
                Categoría: {selectedReporte.categoria.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {new Date(selectedReporte.fecha_reporte).toLocaleDateString('es-BO')}
              </span>
            </div>
            <p className="text-xs text-slate-200 italic bg-black/30 p-2.5 rounded-lg border border-emerald-900/30">
              "{selectedReporte.descripcion_usuario || 'Sin comentario manual'}"
            </p>
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {selectedReporte.comunidad_nombre}
              </span>
              <button
                onClick={() => onFlyTo(selectedReporte.latitud, selectedReporte.longitud)}
                className="text-[10px] underline hover:text-white"
              >
                Centrar en Mapa
              </button>
            </div>
          </div>

          {/* Gemma 2B AI Extraction Breakdown */}
          {selectedReporte.entrevista_ia && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#063327] to-[#04241c] border border-emerald-500/40 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Análisis Gemma 2B (Local Edge)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-emerald-300/80">Sospecha:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= selectedReporte.entrevista_ia!.score_sospecha
                            ? 'bg-red-500'
                            : 'bg-emerald-950'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fish diet analysis */}
              <div className="text-xs space-y-1">
                <div className="text-emerald-300/90 font-medium flex items-center justify-between">
                  <span>Consumo de pescado:</span>
                  <span className="font-bold text-amber-300 capitalize">
                    {selectedReporte.entrevista_ia.frecuencia_consumo_pescado}
                  </span>
                </div>
                {selectedReporte.entrevista_ia.tipos_pescado_mencionados.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedReporte.entrevista_ia.tipos_pescado_mencionados.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-medium"
                      >
                        🐟 {p} (bioacumulador)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical symptoms checklist */}
              <div className="space-y-1.5 pt-2 border-t border-emerald-800/40">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Signos y Síntomas Mencionados al Chat:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(selectedReporte.entrevista_ia.sintomas).map(([key, val]) => (
                    <div
                      key={key}
                      className={`p-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 ${
                        val
                          ? 'bg-red-950/60 border-red-500/40 text-red-200 font-medium'
                          : 'bg-emerald-950/30 border-emerald-900/30 text-emerald-600 line-through'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-red-400' : 'bg-emerald-900'}`} />
                      {key.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>

              {selectedReporte.entrevista_ia.indicio_ambiental_adicional && (
                <div className="text-[11px] text-emerald-200/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/40">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Observación Ambiental:</span>
                  {selectedReporte.entrevista_ia.indicio_ambiental_adicional}
                </div>
              )}
            </div>
          )}

          {/* Researcher Triage / Decision Box */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-700/40 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Ponderación Científica
            </div>

            {selectedReporte.notas_investigador && (
              <div className="text-xs text-slate-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                <span className="text-[10px] text-emerald-400 font-semibold block">Notas Previas:</span>
                {selectedReporte.notas_investigador}
              </div>
            )}

            <textarea
              value={notasTemp}
              onChange={(e) => setNotasTemp(e.target.value)}
              placeholder="Agregar nota o criterio de muestreo de campo..."
              className="w-full text-xs bg-slate-900/80 border border-emerald-800/60 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 h-16"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={savingEstado}
                onClick={() => handleUpdate('semiverificado')}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white flex items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md shadow-amber-950/50"
              >
                <Check className="w-3.5 h-3.5" />
                Semiverificar
              </button>

              <button
                disabled={savingEstado}
                onClick={() => handleUpdate('verificado')}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-all disabled:opacity-50 shadow-md shadow-emerald-950/50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Verificar Lab
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'reportes' ? (
        // List of Reports
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Subfilter Bar */}
          <div className="p-3 border-b border-emerald-900/40 flex items-center justify-between text-xs bg-[#021f18]">
            <span className="text-emerald-300/80 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              Estado:
            </span>
            <div className="flex gap-1">
              {['todos', 'crudo', 'semiverificado', 'verificado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterEstado(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all capitalize ${
                    filterEstado === st
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white bg-emerald-950/40'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredReportes.map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  onSelectReporte(rep);
                  onFlyTo(rep.latitud, rep.longitud);
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/30 hover:from-emerald-900/60 hover:to-teal-900/40 border border-emerald-800/40 hover:border-emerald-500/50 cursor-pointer transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getCategoriaIcon(rep.categoria)}
                    <span className="text-xs font-bold text-white capitalize">{rep.categoria}</span>
                  </div>
                  {getEstadoBadge(rep.estado)}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-2 font-normal">
                  {rep.descripcion_usuario || 'Reporte de síntomas o indicio ambiental'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-emerald-400/80 pt-1 border-t border-emerald-900/30">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {rep.comunidad_nombre}
                  </span>
                  <span className="text-emerald-300 group-hover:translate-x-1 transition-transform flex items-center">
                    Ver ficha <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'comunidades' ? (
        // List of Communities
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {comunidades.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelectComunidad(c);
                onFlyTo(c.latitud, c.longitud);
              }}
              className="p-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 hover:border-emerald-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{c.nombre}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.alerta_nivel === 'Critico' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  c.alerta_nivel === 'Alto' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  Alerta {c.alerta_nivel}
                </span>
              </div>
              <div className="text-xs text-emerald-300/80 mb-2 font-medium">
                {c.cuenca_principal} • {c.departamento}
              </div>
              <div className="text-[11px] text-slate-300 bg-black/30 p-2 rounded-lg border border-emerald-900/40">
                <span className="text-amber-400 font-semibold block mb-0.5">Sospecha Aguas Arriba:</span>
                {c.posible_fuente_minera_aguas_arriba}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Bioindicadores Catalog
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="p-3 rounded-xl bg-blue-950/30 border border-cyan-500/30 text-xs text-cyan-200">
            <span className="font-bold text-cyan-300 block mb-1">Principio de Biomagnificación:</span>
            Los peces piscívoros (carnívoros) como el Surubí o Muturo concentran el metilmercurio a niveles hasta 10 veces superiores que los peces detritívoros (Sábalo).
          </div>

          {bioindicadores.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/50 to-teal-950/40 border border-emerald-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{b.nombre_comun}</h4>
                  <p className="text-[10px] text-emerald-300 italic">{b.nombre_cientifico}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.nivel_bioacumulacion === 'Crítico' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  b.nivel_bioacumulacion === 'Alto' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  Bioacumulación: {b.nivel_bioacumulacion}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {b.descripcion_ecologica}
              </p>
              <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-500/20">
                <span className="font-semibold block text-amber-400">Riesgo en Dieta Humana:</span>
                {b.factor_riesgo_salud}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
