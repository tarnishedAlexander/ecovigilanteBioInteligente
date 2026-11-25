import React, { useState } from 'react';
import { Camera, MapPin, Fish, Droplets, Leaf, ShieldAlert, Check, Upload } from 'lucide-react';
import { PendingReport } from '../types';

interface CameraScreenProps {
  onSave: (report: PendingReport) => void;
  onCancel: () => void;
}

const PRESET_PHOTOS = [
  {
    label: 'Surubí con lesiones en piel',
    cat: 'pez',
    url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80',
    desc: 'Surubí extraído con manchas rojizas y ojos opacos.'
  },
  {
    label: 'Agua turbia con balsas',
    cat: 'agua',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    desc: 'Sedimento lechoso en el río tras paso de dragas de succión.'
  },
  {
    label: 'Vegetación ribereña marchita',
    cat: 'planta',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    desc: 'Taropes y arbustos con hojas amarillas y quemazón en bordes.'
  }
];

export const CameraScreen: React.FC<CameraScreenProps> = ({ onSave, onCancel }) => {
  const [categoria, setCategoria] = useState<'pez' | 'agua' | 'planta' | 'mineria'>('pez');
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_PHOTOS[0].url);
  const [descripcion, setDescripcion] = useState<string>(PRESET_PHOTOS[0].desc);
  
  // GPS Coords default to Riberalta / Madre de Dios
  const [lat, setLat] = useState<number>(-11.0180);
  const [lng, setLng] = useState<number>(-66.0750);
  const [comunidadNombre, setComunidadNombre] = useState<string>('Riberalta');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (p: typeof PRESET_PHOTOS[0]) => {
    setCategoria(p.cat as any);
    setPhotoUrl(p.url);
    setDescripcion(p.desc);
  };

  const handleSubmit = () => {
    const newReport: PendingReport = {
      id: `local-${Date.now()}`,
      latitud: lat,
      longitud: lng,
      categoria,
      descripcion_usuario: descripcion,
      url_foto: photoUrl,
      comunidad_nombre: comunidadNombre,
      fecha_local: new Date().toISOString(),
      sincronizado: false
    };

    onSave(newReport);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in pb-12">
      {/* Category Pills */}
      <div>
        <label className="text-xs font-bold text-emerald-300 block mb-2">
          ¿Qué estás reportando?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'pez', label: 'Pez', icon: Fish, color: 'text-cyan-400' },
            { id: 'agua', label: 'Agua', icon: Droplets, color: 'text-blue-400' },
            { id: 'planta', label: 'Planta', icon: Leaf, color: 'text-emerald-400' },
            { id: 'mineria', label: 'Dragas', icon: ShieldAlert, color: 'text-amber-400' }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = categoria === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoria(item.id as any)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-emerald-600/80 border-emerald-400 text-white shadow-lg shadow-emerald-950/60'
                    : 'bg-emerald-950/40 border-emerald-900/60 text-slate-300 hover:bg-emerald-900/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Preview & Capture Box */}
      <div>
        <label className="text-xs font-bold text-emerald-300 block mb-2">
          Foto o Evidencia Visual
        </label>
        <div className="relative rounded-2xl overflow-hidden border border-emerald-700/50 bg-black/50 shadow-inner group">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Vista previa evidencia"
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <Camera className="w-10 h-10 mb-2 text-emerald-500 animate-pulse" />
              <span className="text-xs">Tomar foto o subir imagen</span>
            </div>
          )}

          {/* Upload Button Overlay */}
          <label className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-emerald-500/40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:bg-black/90 transition-all shadow-md">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cambiar Foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Quick Presets for Rapid Testing */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {PRESET_PHOTOS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-[10px] text-emerald-200 whitespace-nowrap"
            >
              📷 {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Geolocation Pin Selector */}
      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Ubicación del Hallazgo (GPS)
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-700/40 font-mono">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        <div className="flex gap-1.5 text-[10px]">
          {[
            { name: 'Riberalta (Río Madre de Dios)', lat: -11.0180, lng: -66.0750 },
            { name: 'Cachuela Esperanza (Bajo Beni)', lat: -10.5333, lng: -65.5833 },
            { name: 'Teoponte / Guanay (Río Kaka)', lat: -15.4950, lng: -67.7110 }
          ].map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => {
                setLat(loc.lat);
                setLng(loc.lng);
                setComunidadNombre(loc.name.split(' ')[0]);
              }}
              className={`px-2 py-1 rounded-lg border text-left transition-all ${
                lat === loc.lat
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-black/30 border-emerald-900/40 text-slate-300 hover:text-white'
              }`}
            >
              📍 {loc.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Description Textarea */}
      <div>
        <label className="text-xs font-bold text-emerald-300 block mb-1.5">
          Descripción o Comentario (Opcional)
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cuenta qué observaste o desde cuándo ocurre..."
          className="w-full text-xs bg-black/40 border border-emerald-800/60 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 h-20"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all mobile-touch-active"
        >
          <Check className="w-4 h-4" />
          <span>Guardar en Teléfono</span>
        </button>
      </div>
    </div>
  );
};
