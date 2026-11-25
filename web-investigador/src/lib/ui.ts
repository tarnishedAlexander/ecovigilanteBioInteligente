// Single source of truth for labels and colors used across the dashboard.
// Hex values mirror tailwind.config.js so Leaflet (which needs raw colors) stays in sync.

export const COLORS = {
  ink: '#1E2721',
  ink2: '#4A554D',
  ink3: '#7A837B',
  line: '#E3DFD3',
  forest: '#2F5838',
  water: '#3B7197',
  ochre: '#A97A22',
  clay: '#A9472F',
  moss: '#5A7F3C',
  rust: '#7E2A1E',
  stone: '#8B8F86',
};

type Tone = { label: string; color: string; text: string; bg: string };

export const ESTADOS: Record<string, Tone> = {
  crudo: { label: 'En crudo', color: COLORS.clay, text: 'text-clay', bg: 'bg-clay-bg' },
  semiverificado: { label: 'Semiverificado', color: COLORS.ochre, text: 'text-ochre', bg: 'bg-ochre-bg' },
  verificado: { label: 'Verificado', color: COLORS.moss, text: 'text-moss', bg: 'bg-moss-bg' },
  descartado: { label: 'Descartado', color: COLORS.stone, text: 'text-stone', bg: 'bg-stone-bg' },
};

export const estadoTone = (estado: string): Tone =>
  ESTADOS[estado] ?? { label: estado, color: COLORS.stone, text: 'text-stone', bg: 'bg-stone-bg' };

export const ALERTAS: Record<string, Tone> = {
  Bajo: { label: 'Bajo', color: COLORS.moss, text: 'text-moss', bg: 'bg-moss-bg' },
  Medio: { label: 'Medio', color: COLORS.ochre, text: 'text-ochre', bg: 'bg-ochre-bg' },
  Alto: { label: 'Alto', color: COLORS.clay, text: 'text-clay', bg: 'bg-clay-bg' },
  Critico: { label: 'Crítico', color: COLORS.rust, text: 'text-rust', bg: 'bg-rust-bg' },
  Crítico: { label: 'Crítico', color: COLORS.rust, text: 'text-rust', bg: 'bg-rust-bg' },
};

export const alertaTone = (nivel: string): Tone => {
  const key = Object.keys(ALERTAS).find((k) => nivel.startsWith(k));
  return key ? ALERTAS[key] : { label: nivel, color: COLORS.stone, text: 'text-stone', bg: 'bg-stone-bg' };
};

export const CATEGORIAS: Record<string, string> = {
  pez: 'Fauna íctica',
  agua: 'Calidad de agua',
  planta: 'Vegetación',
  salud: 'Salud humana',
  mineria: 'Actividad minera',
};

export const SINTOMAS: Record<string, string> = {
  temblores_extremidades: 'Temblores en extremidades',
  parestesias_adormecimiento: 'Parestesias / adormecimiento',
  problemas_vision_marcha: 'Alteraciones de visión o marcha',
  dolores_cabeza_cronicos: 'Cefalea crónica',
  fatiga_extrema: 'Fatiga extrema',
  perdida_memoria_concentracion: 'Pérdida de memoria / concentración',
};

export const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatCoord = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lng).toFixed(4)}° ${lng < 0 ? 'O' : 'E'}`;
