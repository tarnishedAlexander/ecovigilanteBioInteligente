// Huella de minería aurífera detectada por satélite (Amazon Mining Watch), recortada a Bolivia
// y agrupada en zonas mineras. El archivo se genera fuera de la app y se sirve como estático
// desde public/data/. Cuando exista el backend, basta con cambiar MINERIA_URL por el endpoint.

export const MINERIA_URL = '/data/mineria-bolivia.geojson';

export interface CeldaMinera {
  lat: number;
  lng: number;
  anio: number;
  trimestre?: number;
  estado: 'confirmado' | 'provisional';
  confianza: number;
  zona: string;
}

export interface ZonaMinera {
  id: string;
  nombre: string;
  municipio: string;
  departamento: string;
  centro: [number, number]; // [lat, lng]
  bbox: [[number, number], [number, number]]; // [[sur, oeste], [norte, este]]
  celdas: number;
  km2: number;
  confirmadas: number;
  recientes: number; // celdas detectadas por primera vez en 2025–2026
  primer_anio: number;
  por_anio: Record<string, number>;
}

export interface DatosMineria {
  celdas: CeldaMinera[];
  zonas: ZonaMinera[];
  celdaGrados: [number, number]; // [lng, lat] de una celda (~480 m)
  celdaKm2: number;
  fuente: string;
  url: string;
  licencia: string;
  version: string;
}

export type PeriodoId = 'antiguo' | 'medio' | 'reciente';

// Escala secuencial de un solo tono (oro): apagado = antiguo, brillante = reciente.
// Validada sobre el fondo oscuro #151914: pasos adyacentes ΔE ≥ 16, apta para daltonismo y contraste ≥ 3:1.
export const PERIODOS: { id: PeriodoId; label: string; desde: number; hasta: number; color: string }[] = [
  { id: 'antiguo', label: 'Hasta 2021', desde: 0, hasta: 2021, color: '#8E7820' },
  { id: 'medio', label: '2022–2024', desde: 2022, hasta: 2024, color: '#C2A93A' },
  { id: 'reciente', label: '2025–2026', desde: 2025, hasta: 9999, color: '#F8E45E' },
];

export const ANIO_RECIENTE = 2025;

/** Zonas con menos celdas se consideran detecciones aisladas (posibles falsos positivos). */
export const MIN_CELDAS_ZONA = 3;

export const periodoDe = (anio: number) => PERIODOS.find((p) => anio >= p.desde && anio <= p.hasta) ?? PERIODOS[0];

export const describirPeriodo = (c: { anio: number; trimestre?: number }) =>
  c.trimestre
    ? `${c.trimestre}${c.trimestre === 1 || c.trimestre === 3 ? '.er' : '.º'} trimestre de ${c.anio}`
    : c.anio === 2018
      ? '2018 o antes'
      : String(c.anio);

export const describirAnio = (anio: number) => (anio === 2018 ? '2018 o antes' : String(anio));

/** Distancia en línea recta (km). Suficiente a escala regional. */
export function kmEntre(lat1: number, lng1: number, lat2: number, lng2: number) {
  const x = ((lng2 - lng1) * Math.PI) / 180 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  const y = ((lat2 - lat1) * Math.PI) / 180;
  return 6371 * Math.hypot(x, y);
}

export const formatKm = (km: number) => (km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km).toString()) + ' km';
export const formatKm2 = (km2: number) => km2.toLocaleString('es-BO', { maximumFractionDigits: km2 < 10 ? 1 : 0 }) + ' km²';

export const RADIO_CERCANIA_KM = 25;

export interface HuellaCercana {
  radioKm: number;
  celdas: number;
  km2: number;
  recientes: number;
  /** Zonas con alguna celda dentro del radio, o la más cercana si no hay ninguna. */
  zonas: { zona: ZonaMinera; km: number }[];
}

/** Huella minera alrededor de un punto: celdas dentro del radio y zonas más cercanas. */
export function huellaCercana(datos: DatosMineria, lat: number, lng: number, radioKm = RADIO_CERCANIA_KM): HuellaCercana {
  const distanciaZona = new Map<string, number>();
  let celdas = 0;
  let recientes = 0;
  for (const c of datos.celdas) {
    const km = kmEntre(lat, lng, c.lat, c.lng);
    const previa = distanciaZona.get(c.zona);
    if (previa === undefined || km < previa) distanciaZona.set(c.zona, km);
    if (km <= radioKm) {
      celdas++;
      if (c.anio >= ANIO_RECIENTE) recientes++;
    }
  }
  const porDistancia = datos.zonas
    .filter((z) => z.celdas >= MIN_CELDAS_ZONA && distanciaZona.has(z.id))
    .map((zona) => ({ zona, km: distanciaZona.get(zona.id)! }))
    .sort((a, b) => a.km - b.km);
  const dentro = porDistancia.filter((z) => z.km <= radioKm);
  return {
    radioKm,
    celdas,
    km2: celdas * datos.celdaKm2,
    recientes,
    zonas: dentro.length ? dentro : porDistancia.slice(0, 1),
  };
}

/** Comunidades ordenadas por distancia al borde más cercano de la zona. */
export function comunidadesCercanas<T extends { latitud: number; longitud: number }>(
  datos: DatosMineria,
  zona: ZonaMinera,
  comunidades: T[],
  maxKm = 150,
) {
  const celdas = datos.celdas.filter((c) => c.zona === zona.id);
  return comunidades
    .map((com) => ({
      comunidad: com,
      km: Math.min(...celdas.map((c) => kmEntre(com.latitud, com.longitud, c.lat, c.lng))),
    }))
    .filter((x) => x.km <= maxKm)
    .sort((a, b) => a.km - b.km);
}

let cache: Promise<DatosMineria> | null = null;

/** Descarga el archivo una sola vez por sesión. */
export function cargarMineria(): Promise<DatosMineria> {
  if (!cache) {
    cache = fetch(MINERIA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar la capa minera (${res.status})`);
        return res.json();
      })
      .then((fc) => ({
        celdas: fc.features.map((f: any) => ({
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          ...f.properties,
        })),
        zonas: fc.zonas,
        celdaGrados: fc.metadata.celda_grados,
        celdaKm2: fc.metadata.celda_km2,
        fuente: fc.metadata.fuente,
        url: fc.metadata.url,
        licencia: fc.metadata.licencia,
        version: fc.metadata.version_datos,
      }))
      .catch((err) => {
        cache = null; // permite reintentar
        throw err;
      });
  }
  return cache;
}
