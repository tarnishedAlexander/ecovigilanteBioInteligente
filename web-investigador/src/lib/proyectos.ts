import type { ActividadProyecto, Comunidad, EstadoProyecto, Financiador, Proyecto, ProyectoDatos, Reporte, RubroActividad } from '../types';
import { IndiceBio, bioindicadoresEnDepartamento } from './bio';
import type { IndiceInv } from './investigacion';
import { DatosMineria, formatKm, formatKm2, huellaCercana, kmEntre } from './mineria';
import { alertaTone, normalize } from './ui';

/** Project life cycle, in order. Every state is shown with its label, never by color alone. */
export const ESTADOS_PROYECTO: { id: EstadoProyecto; label: string; color: string }[] = [
  { id: 'idea', label: 'Idea', color: '#8d9985' },
  { id: 'propuesta', label: 'Propuesta lista', color: '#8baea4' },
  { id: 'gestion_fondos', label: 'En gestión de fondos', color: '#d5ac69' },
  { id: 'financiado', label: 'Financiado', color: '#bbd77a' },
  { id: 'en_ejecucion', label: 'En ejecución', color: '#3987e5' },
  { id: 'concluido', label: 'Concluido', color: '#c3cbbb' },
];

export const estadoProyecto = (id: EstadoProyecto) => ESTADOS_PROYECTO.find((e) => e.id === id)!;

export const TIPOS_FINANCIADOR: Record<Financiador['tipo'], string> = {
  cooperacion: 'Cooperación internacional',
  gobierno: 'Gobierno',
  ong: 'ONG o fundación',
  universidad: 'Universidad',
  privado: 'Privado',
  por_definir: 'Por definir',
};

export const RUBROS: Record<RubroActividad, string> = {
  peces: 'Peces',
  cabello: 'Cabello',
  agua: 'Agua',
  sedimentos: 'Sedimentos',
  aire: 'Aire',
  social: 'Trabajo comunitario',
  logistica: 'Logística de campo',
  difusion: 'Devolución y difusión',
};

/** Official rate used to show budgets in dollars (Bolivia has a flexible rate since mid-2026). */
export const TIPO_CAMBIO = { bsPorUsd: 11.84, fecha: '23/10/2026', fuente: 'tipo de cambio oficial del BCB' };

export type BaseCosto = 'cotizado' | 'referencial' | 'supuesto';

export const BASES_COSTO: Record<BaseCosto, { label: string; detalle: string }> = {
  cotizado: { label: 'Cotizado', detalle: 'Costo cargado por el equipo a partir de una cotización.' },
  referencial: { label: 'Referencial', detalle: 'Estimación con fuente pública; confirmar con una cotización.' },
  supuesto: { label: 'Supuesto', detalle: 'Estimación sin fuente pública; reemplazar con una cotización.' },
};

/** Unit cost in use: the quote when there is one, otherwise the estimate. */
export function costoEnUso(a: ActividadProyecto): { valor: number; base: BaseCosto } | null {
  if (a.costo_unitario !== null) return { valor: a.costo_unitario, base: 'cotizado' };
  if (a.costo_referencial !== null && a.base_referencia) return { valor: a.costo_referencial, base: a.base_referencia };
  return null;
}

export const subtotal = (a: ActividadProyecto) => {
  const c = costoEnUso(a);
  return c === null ? null : a.cantidad * c.valor;
};

/** Estimated budget, split by how solid each cost is. Lines with no cost at all are counted, not guessed. */
export function presupuesto(p: ProyectoDatos) {
  const porBase: Record<BaseCosto, number> = { cotizado: 0, referencial: 0, supuesto: 0 };
  const porRubro = new Map<RubroActividad, number>();
  let sinCosto = 0;
  for (const a of p.actividades) {
    const c = costoEnUso(a);
    if (!c) {
      sinCosto++;
      continue;
    }
    const v = a.cantidad * c.valor;
    porBase[c.base] += v;
    porRubro.set(a.rubro, (porRubro.get(a.rubro) ?? 0) + v);
  }
  const total = porBase.cotizado + porBase.referencial + porBase.supuesto;
  const confirmado = p.financiadores
    .filter((f) => f.estado === 'confirmado')
    .reduce((s, f) => s + (f.monto_comprometido ?? 0), 0);
  const porCotizar = p.actividades.filter((a) => a.costo_unitario === null).length;
  return { total, porBase, sinCosto, porCotizar, confirmado, porRubro };
}

export const enUsd = (bs: number) => bs / TIPO_CAMBIO.bsPorUsd;

export function formatMonto(v: number, moneda: ProyectoDatos['moneda'] = 'BOB') {
  return `${moneda === 'BOB' ? 'Bs' : 'USD'} ${v.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
}

export interface ContextoComunidad {
  comunidad: Comunidad;
  reportes: Reporte[];
  bio: IndiceBio | null;
  inv: IndiceInv | null;
  mineria: DatosMineria | null;
}

/** Published studies with a sampling site within this distance count as "nearby" evidence. */
export const RADIO_ESTUDIOS_KM = 60;

export function estudiosCercanos(inv: IndiceInv, lat: number, lng: number) {
  const sitios = inv.datos.sitios.filter((s) => kmEntre(lat, lng, s.lat, s.lng) <= RADIO_ESTUDIOS_KM).map((s) => s.id);
  const ids = new Set(inv.datos.mediciones.filter((m) => sitios.includes(m.sitio)).map((m) => m.estudio));
  const estudios = inv.datos.estudios.filter((e) => ids.has(e.id));
  const ultimo = Math.max(0, ...estudios.map((e) => e.muestreo[1] ?? e.muestreo[0] ?? 0));
  return { estudios, ultimo: ultimo || null };
}

/** Why invest here: computed from the atlas data every time, so it never goes stale. */
export function porQueAqui({ comunidad: c, reportes, bio, inv, mineria }: ContextoComunidad): string[] {
  const razones: string[] = [];
  const verificados = reportes.filter((r) => r.estado === 'verificado').length;
  const nReportes = reportes.length === 0 ? 'sin reportes de comunarios'
    : `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'} de comunarios` +
      (verificados ? ` (${verificados} ${verificados === 1 ? 'verificado' : 'verificados'})` : '');
  razones.push(`Nivel de alerta comunitaria: ${alertaTone(c.alerta_nivel).label.toLowerCase()}; ${nReportes}.`);
  if (mineria) {
    const h = huellaCercana(mineria, c.latitud, c.longitud);
    if (h.celdas > 0) {
      razones.push(`Huella minera satelital de ${formatKm2(h.km2)} a menos de ${h.radioKm} km` + (h.recientes ? `, ${h.recientes} detecciones de 2025 en adelante.` : '.'));
    } else if (h.zonas[0]) {
      razones.push(`La zona minera más cercana (${h.zonas[0].zona.nombre}) está a ${formatKm(h.zonas[0].km)}.`);
    }
  }
  if (inv) {
    const { estudios, ultimo } = estudiosCercanos(inv, c.latitud, c.longitud);
    razones.push(
      estudios.length
        ? `${estudios.length} ${estudios.length === 1 ? 'estudio publicado' : 'estudios publicados'} a menos de ${RADIO_ESTUDIOS_KM} km; el muestreo más reciente es de ${ultimo}.`
        : `No hay estudios de mercurio publicados a menos de ${RADIO_ESTUDIOS_KM} km: falta una línea base local.`,
    );
  }
  if (bio) {
    const especies = bioindicadoresEnDepartamento(bio, c.departamento).filter((t) => t.grupo === 'pez');
    if (especies.length) {
      razones.push(`${especies.length} especies de peces del catálogo registradas en ${c.departamento}, entre ellas ${especies.slice(0, 3).map((t) => t.nombre_comun.toLowerCase()).join(', ')}.`);
    }
  }
  return razones;
}

const esCarnivoro = (dieta: string) => /pisciv|carniv/.test(normalize(dieta));

/** Fish suggested for sampling: the most relevant carnivores and non-carnivores recorded in the department. */
function especiesSugeridas(bio: IndiceBio | null, departamento: string) {
  const peces = bio ? bioindicadoresEnDepartamento(bio, departamento).filter((t) => t.grupo === 'pez' && t.nivel === 'especie') : [];
  const nombres = (ts: typeof peces, n: number, defecto: string) =>
    ts.length ? ts.slice(0, n).map((t) => t.nombre_comun.toLowerCase()).join(', ') : defecto;
  return {
    carnivoras: nombres(peces.filter((t) => esCarnivoro(t.dieta)), 3, 'surubí, dorado, piraña'),
    noCarnivoras: nombres(peces.filter((t) => !esCarnivoro(t.dieta)), 2, 'pacú, sábalo'),
  };
}

type Ref = { base: 'referencial' | 'supuesto'; valor: number; fuente: string };

// Same reference costs as backend/app/seed_data.py, in bolivianos.
const REF_HG: Ref = { base: 'referencial', valor: 118, fuente: 'Tarifa pública de Hg por DMA-80 (University of Rochester): USD 10 por muestra, a Bs 11,84 por USD. Referencia internacional; un laboratorio en Bolivia puede cobrar distinto.' };
const REF_AGUA: Ref = { base: 'referencial', valor: 375, fuente: 'Arancel 2026 del INLASA para análisis de agua (código LCA-124). No especifica mercurio: confirmar el costo de un método que detecte ng/L.' };
const sup = (valor: number, detalle: string): Ref => ({ base: 'supuesto', valor, fuente: `Supuesto sin fuente (${detalle}). Reemplazar con una cotización.` });

function act(id: string, nombre: string, descripcion: string, rubro: RubroActividad, cantidad: number, unidad: string,
  mes_inicio: number, mes_fin: number, ref: Ref | null, costo_unitario: number | null = null): ActividadProyecto {
  return {
    id, nombre, descripcion, rubro, cantidad, unidad, costo_unitario,
    costo_referencial: ref?.valor ?? null, base_referencia: ref?.base ?? null, fuente_costo: ref?.fuente ?? null,
    mes_inicio, mes_fin, completada: false,
  };
}

/**
 * Draft of a 12-month study for a community, built from the protocols of the published studies
 * (fish by guild and season, hair with priority on pregnant women and children, water and sediment).
 * Unit costs stay empty: the budget comes from real quotes.
 */
export function generarPropuesta(ctx: ContextoComunidad): ProyectoDatos {
  const c = ctx.comunidad;
  const { carnivoras, noCarnivoras } = especiesSugeridas(ctx.bio, c.departamento);
  return {
    titulo: `Mercurio en pescado, cabello, agua y sedimento en ${c.nombre}`,
    comunidad_id: c.id,
    estado: 'idea',
    objetivo: `Medir la exposición al mercurio de la población de ${c.nombre} y orientar el consumo de pescado por especie.`,
    duracion_meses: 12,
    moneda: 'BOB',
    financiadores: [{ nombre: 'Por definir', tipo: 'por_definir', estado: 'potencial', monto_comprometido: null, nota: null }],
    contrapartes: [`Organización comunal de ${c.nombre} (por confirmar)`, 'Universidad o laboratorio (por definir)'],
    actividades: [
      act('a1', 'Consentimiento previo y diseño participativo', 'Talleres con la organización comunal para acordar objetivos, muestreo y uso de los datos.', 'social', 2, 'talleres', 1, 2, sup(2500, 'refrigerio, materiales y traslado de participantes')),
      act('a2', 'Encuesta de consumo de pescado', 'Frecuencia y especies consumidas por familia: explica la exposición.', 'social', 60, 'encuestas', 2, 3, sup(40, 'pago a encuestador por encuesta')),
      act('a3', 'Muestreo de pescado (aguas altas y bajas)', `10 ejemplares por especie y estación. Carnívoras: ${carnivoras}. No carnívoras: ${noCarnivoras}.`, 'peces', 100, 'muestras de músculo', 2, 9, REF_HG),
      act('a4', 'Muestras de cabello', 'Prioridad: embarazadas y niños. Con consentimiento informado.', 'cabello', 80, 'personas', 3, 4, REF_HG),
      act('a5', 'Muestras de agua', '6 puntos en dos estaciones, con un método que detecte ng/L.', 'agua', 12, 'muestras', 2, 9, REF_AGUA),
      act('a6', 'Muestras de sedimento', 'Mismos 6 puntos que el agua, en dos estaciones.', 'sedimentos', 12, 'muestras', 2, 9, REF_HG),
      act('a7', 'Días de campo del equipo', 'Viáticos y personal de las dos campañas (equipo de 3 personas).', 'logistica', 20, 'días', 2, 9, sup(1500, '3 personas por día; la escala oficial de viáticos es la del DS 1788')),
      act('a8', 'Transporte fluvial', 'Bote, motorista y combustible.', 'logistica', 10, 'días', 2, 9, sup(1200, 'alquiler de bote con motorista y combustible por día')),
      act('a9', 'Devolución de resultados y guía de consumo', 'Taller comunitario y guía impresa de consumo por especie.', 'difusion', 1, 'taller y guía', 11, 12, sup(6000, 'taller, diseño e impresión de la guía')),
      act('a10', 'Publicación de los datos en EcoVigilante', 'Los resultados se suman a la sección Investigación.', 'difusion', 1, 'publicación', 12, 12, null, 0),
    ],
    resultados: [
      'Mercurio total por especie y estación, comparado con 0,5 y 1,0 µg/g.',
      'Mercurio en cabello por grupo de edad, comparado con 10 µg/g.',
      'Guía comunitaria de consumo por especie.',
      'Datos publicados en la sección Investigación.',
    ],
    notas: '',
    demo: false,
  };
}

export const datosDe = ({ id: _id, creado: _c, actualizado: _a, ...datos }: Proyecto): ProyectoDatos => datos;
