import type { EstudioHg, Gremio, Investigacion, Matriz, MedicionHg, ReferenciaHg, SitioHg } from '../types';

/** The four tabs of the Investigación section. Hair (cabello) is shown inside Peces: it is where fish mercury ends up. */
export type MatrizTab = Exclude<Matriz, 'cabello'>;

export const MATRICES: { id: MatrizTab; label: string; unidad: string; descripcion: string }[] = [
  { id: 'aire', label: 'Aire', unidad: 'ng/m³', descripcion: 'Mercurio gaseoso medido en estaciones y sondeos en zonas mineras.' },
  { id: 'agua', label: 'Agua', unidad: 'ng/L', descripcion: 'Mercurio total en ríos y lagos, por sitio y a lo largo del tiempo.' },
  { id: 'sedimentos', label: 'Sedimentos', unidad: 'µg/g', descripcion: 'Mercurio en sedimento de fondo, en peso seco.' },
  { id: 'peces', label: 'Peces', unidad: 'µg/g', descripcion: 'Mercurio en músculo, en peso húmedo, y su reflejo en el cabello de quienes los comen.' },
];

/**
 * What the studies show together, per matrix. Each sentence is backed by the measurements
 * of the cited studies in investigacion.json.
 */
export const LECTURAS: Record<MatrizTab, string[]> = {
  aire: [
    'Cerca de la quema de amalgama (Apolobamba, 2012) el mercurio gaseoso promedia 122 ng/m³, unas 100 veces el nivel de fondo medido en Chacaltaya (0,9 a 1,3 ng/m³).',
    'En Chacaltaya, las masas de aire que llegan desde la Amazonía traen más mercurio; los autores lo asocian, con cautela, a la minería aurífera artesanal.',
    'Solo hay tres estudios de aire y ninguno en las tierras bajas del Beni o Pando, donde opera la minería aluvial.',
  ],
  agua: [
    'En el Beni, el mercurio del agua depende del caudal: en Rurrenabaque va de 8 a 19 ng/L en estiaje a 460 ng/L o más en crecida, casi todo unido a partículas en suspensión.',
    'Los valores más altos están en los arroyos al pie de las minas (Lambate: hasta 3544 ng/L). Río abajo se diluyen, aunque en el estiaje de 1995-1998 el Beni en Rurrenabaque tenía más mercurio que los ríos auríferos que lo alimentan.',
    'Los promedios anuales de la cuenca subieron de unos 10 ng/L en 1995 a 880 ng/L en 2006 (Hg particulado). Con un límite de detección de 1000 ng/L, como en el monitoreo de 2021 y 2025 del Madre de Dios, estos niveles no se detectan.',
  ],
  sedimentos: [
    'La mayoría de los sedimentos de los ríos del Beni están bajo el TEL (0,17 µg/g). Lo superan sobre todo el Kaka (hasta 0,43 µg/g) y el Beni en Rurrenabaque (1,63 µg/g en 1999).',
    'Al pie de las minas el sedimento está muy contaminado: 35 µg/g en el arroyo Challiri y 5,7 µg/g en el San Silvestre, muy por encima del PEL (0,486 µg/g).',
    'En las lagunas de inundación el Hg total es bajo (0,05 a 0,08 µg/g), pero es donde las bacterias lo transforman en metilmercurio, que entra en la cadena trófica.',
  ],
  peces: [
    'Los peces carnívoros suelen tener diez veces más mercurio que los herbívoros y detritívoros. Sábalo, pacú y tambaquí quedan en 0,2 µg/g o menos en todos los estudios.',
    'En el Beni, cerca de Rurrenabaque, surubí, dorado, palometa y blanquillo superan 0,5 µg/g desde 1996 hasta 2024. En la cuenca del Iténez, los mismos gremios no pasan de 0,25 µg/g.',
    'El mercurio del pescado se refleja en el cabello de quienes lo comen: los Esse Ejja, que comen pescado a diario, promedian 9,8 µg/g, frente a 0,3 µg/g de los mineros del Kaka.',
  ],
};

export const GREMIOS: Record<Gremio, { label: string; color: string }> = {
  carnivoro: { label: 'Carnívoros y piscívoros', color: '#3987e5' },
  no_carnivoro: { label: 'Herbívoros, omnívoros y detritívoros', color: '#d95926' },
  reptil: { label: 'Yacaré', color: '#199e70' },
  mixto: { label: 'Varias especies', color: '#a9b5a0' },
};

/** Categorical slots for series charts (validated on the dark surface). */
export const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70'];

export const VERIFICACION: Record<EstudioHg['verificacion'], { label: string; detalle: string }> = {
  texto: { label: 'Texto completo', detalle: 'Valores leídos en el artículo.' },
  resumen: { label: 'Resumen', detalle: 'Valores confirmados en el resumen publicado.' },
  hoja: { label: 'Hoja del equipo', detalle: 'DOI verificado; los valores vienen de la hoja de centralización y falta cotejarlos con el artículo.' },
};

export interface IndiceInv {
  datos: Investigacion;
  estudio: Map<string, EstudioHg>;
  sitio: Map<string, SitioHg>;
}

export function indexarInv(datos: Investigacion): IndiceInv {
  return {
    datos,
    estudio: new Map(datos.estudios.map((e) => [e.id, e])),
    sitio: new Map(datos.sitios.map((s) => [s.id, s])),
  };
}

export const medicionesDe = (inv: IndiceInv, matriz: Matriz) => inv.datos.mediciones.filter((m) => m.matriz === matriz);

export const referenciasDe = (inv: IndiceInv, matriz: Matriz): ReferenciaHg[] =>
  inv.datos.referencias.filter((r) => r.matriz === matriz);

/** Studies with at least one measurement in the matrix, oldest sampling first. */
export function estudiosDe(inv: IndiceInv, matriz: Matriz) {
  const ids = new Set(medicionesDe(inv, matriz).map((m) => m.estudio));
  return inv.datos.estudios
    .filter((e) => ids.has(e.id))
    .sort((a, b) => (a.muestreo[0] ?? a.anio) - (b.muestreo[0] ?? b.anio) || a.anio - b.anio);
}

/** Highest value a measurement reports (mean, single value or top of the range). */
export const techo = (m: MedicionHg) => m.max ?? m.valor ?? m.min ?? 0;

/** Lowest value a measurement reports. */
export const piso = (m: MedicionHg) => m.min ?? m.valor ?? m.max ?? 0;

const nf = (digits: number) => new Intl.NumberFormat('es-BO', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** Rounded for reading: three significant figures below 10, whole numbers above 100. */
export function formatNum(v: number) {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 100) return nf(0).format(v);
  if (a >= 10) return nf(1).format(v);
  if (a >= 1) return nf(2).format(v);
  return nf(Math.min(4, 2 - Math.floor(Math.log10(a)))).format(v);
}

export function formatMedicion(m: MedicionHg, conUnidad = true) {
  const u = conUnidad ? ` ${m.unidad}` : '';
  if (m.estadistico === 'bajo_ld') return `< ${formatNum(m.max!)}${u} (bajo el límite de detección)`;
  const rango = m.min !== null && m.max !== null ? `${formatNum(m.min)}–${formatNum(m.max)}` : m.max !== null ? `hasta ${formatNum(m.max)}` : null;
  if (m.valor === null) return `${rango}${u}`;
  const de = m.de !== null ? ` ± ${formatNum(m.de)}` : '';
  return `${formatNum(m.valor)}${de}${u}${rango ? ` (${rango})` : ''}`;
}

export const ESTADISTICO: Record<MedicionHg['estadistico'], string> = {
  media: 'Media',
  mediana: 'Mediana',
  individual: 'Valor puntual',
  rango: 'Rango',
  bajo_ld: 'Bajo el límite de detección',
};

export function formatPeriodoEstudio(e: EstudioHg) {
  const [a, b] = e.muestreo;
  if (a === null) return 'Periodo de muestreo no indicado';
  return a === b ? `Muestreo ${a}` : `Muestreo ${a}–${b}`;
}

/** Bounds of the sites of a study (or of the whole matrix) for the map camera. */
export function sitiosDeMediciones(inv: IndiceInv, mediciones: MedicionHg[]) {
  const ids = new Set(mediciones.map((m) => m.sitio));
  return inv.datos.sitios.filter((s) => ids.has(s.id));
}
