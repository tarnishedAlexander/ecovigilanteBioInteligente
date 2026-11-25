// Single source of truth for labels and colors used across the dashboard.
// Hex values mirror tailwind.config.cjs so Leaflet (which needs raw colors) stays in sync.

export const COLORS = {
  ink: '#E8EBDD',
  ink2: '#C3CBBB',
  ink3: '#A9B5A0',
  line: '#42493D',
  forest: '#BBD77A',
  water: '#8BAEA4',
  ochre: '#D5AC69',
  clay: '#D97757',
  moss: '#A7BE78',
  rust: '#E58B83',
  stone: '#AFB6A5',
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

export const RIESGO = {
  Bajo: '#879B65',
  Medio: '#D5AC69',
  Alto: '#D97757',
  Critico: '#E58B83',
};

type Level = { key: keyof typeof RIESGO; label: string; color: string; rank: number };

export const NIVELES: Level[] = [
  { key: 'Bajo', label: 'Bajo', color: RIESGO.Bajo, rank: 1 },
  { key: 'Medio', label: 'Medio', color: RIESGO.Medio, rank: 2 },
  { key: 'Alto', label: 'Alto', color: RIESGO.Alto, rank: 3 },
  { key: 'Critico', label: 'Crítico', color: RIESGO.Critico, rank: 4 },
];

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Accepts "Critico", "Crítico", "Medio (Hiperacumuladora)", etc. */
export const alertaTone = (nivel: string): Level =>
  NIVELES.find((n) => normalize(nivel).startsWith(normalize(n.key))) ?? {
    key: 'Bajo',
    label: nivel,
    color: COLORS.stone,
    rank: 0,
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
