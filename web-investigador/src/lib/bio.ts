// Helpers for the bioindicator catalog: lookups, labels and number formatting.
import type { Alcance, CatalogoBioindicadores, Fundamento, Grupo, Medicion, Relacion, Sitio, Taxon } from '../types';
import { normalize } from './ui';

export const GRUPOS: { id: Grupo; label: string }[] = [
  { id: 'pez', label: 'Peces' },
  { id: 'ave', label: 'Aves' },
  { id: 'reptil', label: 'Reptiles' },
  { id: 'mamifero', label: 'Mamíferos' },
  { id: 'insecto', label: 'Insectos' },
  { id: 'planta', label: 'Plantas' },
  { id: 'abiotico', label: 'Sedimento y suelo' },
];

export const grupoLabel = (g: Grupo) => GRUPOS.find((x) => x.id === g)?.label ?? g;

export const ALCANCES: Record<Alcance, { label: string; color: string }> = {
  bolivia: { label: 'Bolivia', color: '#BBD77A' },
  madeira: { label: 'Cuenca del Madeira', color: '#D5AC69' },
  amazonia: { label: 'Amazonía', color: '#8BAEA4' },
  fuera: { label: 'Fuera de la Amazonía', color: '#AFB6A5' },
  neotropico: { label: 'Síntesis neotropical', color: '#AFB6A5' },
};

export const RELACIONES: Record<Relacion, string> = {
  misma_especie: 'Misma especie',
  mismo_genero: 'Mismo género',
  misma_familia: 'Misma familia',
  mismo_gremio: 'Mismo gremio trófico',
  mismo_habito: 'Misma forma de vida',
};

export type EstadoTaxon = 'medido_bolivia' | 'potencial' | 'candidato' | 'familia' | 'ausente' | 'grupo';

export const ESTADOS_TAXON: Record<EstadoTaxon, { label: string; color: string; rank: number }> = {
  medido_bolivia: { label: 'Medido en Bolivia', color: '#BBD77A', rank: 0 },
  potencial: { label: 'Para investigar · especie medida en otra región', color: '#D5AC69', rank: 1 },
  candidato: { label: 'Para investigar · pariente cercano', color: '#8BAEA4', rank: 2 },
  familia: { label: 'Para investigar · misma familia', color: '#C3CBBB', rank: 3 },
  grupo: { label: 'Grupo de especies', color: '#AFB6A5', rank: 4 },
  ausente: { label: 'Sin registros en Bolivia', color: '#AFB6A5', rank: 5 },
};

export interface IndiceBio {
  catalogo: CatalogoBioindicadores;
  taxon: Map<string, Taxon>;
  sitio: Map<string, Sitio>;
  fuente: Map<string, CatalogoBioindicadores['fuentes'][number]>;
  porTaxon: Map<string, Medicion[]>;
  porSitio: Map<string, Medicion[]>;
  /** Taxa that cite a given taxon as their scientific basis (its relatives in Bolivia). */
  parientes: Map<string, Taxon[]>;
}

const agrupar = <T,>(items: T[], key: (x: T) => string) => {
  const out = new Map<string, T[]>();
  for (const x of items) {
    const k = key(x);
    const list = out.get(k);
    if (list) list.push(x);
    else out.set(k, [x]);
  }
  return out;
};

export function indexar(catalogo: CatalogoBioindicadores): IndiceBio {
  const parientes = new Map<string, Taxon[]>();
  for (const t of catalogo.taxones) {
    for (const r of t.referencias) {
      const list = parientes.get(r.taxon);
      if (list) list.push(t);
      else parientes.set(r.taxon, [t]);
    }
  }
  return {
    catalogo,
    taxon: new Map(catalogo.taxones.map((t) => [t.id, t])),
    sitio: new Map(catalogo.sitios.map((s) => [s.id, s])),
    fuente: new Map(catalogo.fuentes.map((f) => [f.id, f])),
    porTaxon: agrupar(catalogo.mediciones, (m) => m.taxon),
    porSitio: agrupar(catalogo.mediciones, (m) => m.sitio),
    parientes,
  };
}

export function estadoTaxon(t: Taxon, idx: IndiceBio): EstadoTaxon {
  if (t.nivel === 'grupo') return 'grupo';
  const meds = idx.porTaxon.get(t.id) ?? [];
  if (meds.some((m) => idx.sitio.get(m.sitio)?.alcance === 'bolivia')) return 'medido_bolivia';
  if (!t.bolivia || t.bolivia.registros === 0) return 'ausente';
  if (meds.length) return 'potencial';
  return t.referencias.some((r) => r.relacion === 'misma_especie' || r.relacion === 'mismo_genero') ? 'candidato' : 'familia';
}

/** Priority first, then measured before inferred, then most recorded in Bolivia. */
export const ordenarTaxones = (taxones: Taxon[], idx: IndiceBio) =>
  [...taxones].sort(
    (a, b) =>
      (a.prioridad?.orden ?? 99) - (b.prioridad?.orden ?? 99) ||
      ESTADOS_TAXON[estadoTaxon(a, idx)].rank - ESTADOS_TAXON[estadoTaxon(b, idx)].rank ||
      (b.bolivia?.registros ?? 0) - (a.bolivia?.registros ?? 0),
  );

/** Species recorded in a Bolivian department that can be proposed as future bioindicators there. */
export function bioindicadoresEnDepartamento(idx: IndiceBio, departamento: string) {
  const dep = normalize(departamento);
  return ordenarTaxones(
    idx.catalogo.taxones.filter(
      (t) => t.nivel !== 'grupo' && t.bolivia?.departamentos.some((d) => normalize(d) === dep) && estadoTaxon(t, idx) !== 'ausente',
    ),
    idx,
  );
}

/** Measurements that back a taxon: its own, or those of the relatives it cites. */
export function evidencia(t: Taxon, idx: IndiceBio) {
  const propias = idx.porTaxon.get(t.id) ?? [];
  if (propias.length) return { propias, prestadas: [] as { relacion: Relacion; taxon: Taxon; mediciones: Medicion[] }[] };
  const prestadas = t.referencias
    .map((r) => ({ relacion: r.relacion, taxon: idx.taxon.get(r.taxon)!, mediciones: idx.porTaxon.get(r.taxon) ?? [] }))
    .filter((r) => r.taxon && r.mediciones.length);
  return { propias, prestadas };
}

export const gbifUrl = (key: number) => `https://www.gbif.org/occurrence/search?taxon_key=${key}&country=BO`;

const num = (v: number) =>
  v.toLocaleString('es-BO', { maximumFractionDigits: v >= 100 ? 0 : v >= 10 ? 2 : v >= 1 ? 2 : v >= 0.1 ? 3 : 4 });

/** "39,08 ± 28,40 µg/g", "0,48–0,91 mg/kg", "Bajo el límite de detección". */
export function formatValor(m: Medicion) {
  if (m.estadistico === 'bajo_ld') return 'Bajo el límite de detección';
  if (m.valor === null && m.min !== null && m.max !== null) return `${num(m.min)}–${num(m.max)} ${m.unidad}`;
  if (m.valor === null) return '—';
  const disp = m.dispersion !== null ? ` ± ${num(m.dispersion)}` : '';
  return `${num(m.valor)}${disp} ${m.unidad}`;
}

export const ESTADISTICOS: Record<Medicion['estadistico'], string> = {
  media: 'media',
  mediana: 'mediana',
  individual: 'un ejemplar',
  rango: 'rango',
  total: 'total',
  bajo_ld: '',
};

export function describirMedicion(m: Medicion) {
  const partes = [m.tejido];
  if (ESTADISTICOS[m.estadistico]) partes.push(ESTADISTICOS[m.estadistico]);
  if (m.dispersion_tipo) partes.push(`± ${m.dispersion_tipo}`);
  if (m.base) partes.push(m.base === 'humedo' ? 'peso húmedo' : 'peso seco');
  if (m.n) partes.push(`n = ${m.n}`);
  if (m.periodo) partes.push(m.periodo);
  if (m.valor !== null && m.min !== null && m.max !== null && m.estadistico !== 'rango')
    partes.push(`rango ${num(m.min)}–${num(m.max)}`);
  return partes.join(' · ');
}

const PREDADORES = ['piscivora', 'carnivora'];

/** Codex Alimentarius limits for fish muscle (wet weight): 1.0 mg/kg predators, 0.5 the rest. */
export function limiteConsumo(m: Medicion, t: Taxon) {
  if (t.grupo !== 'pez' || m.tejido !== 'músculo' || m.base === 'seco' || m.unidad !== 'mg/kg') return null;
  const limite = PREDADORES.includes(normalize(t.dieta)) ? 1.0 : 0.5;
  const valor = m.valor ?? m.max;
  if (valor === null) return null;
  return { limite, supera: valor > limite };
}

/** Highest central value among a taxon's evidence, for compact summaries. */
export function valorDestacado(t: Taxon, idx: IndiceBio) {
  const { propias, prestadas } = evidencia(t, idx);
  const meds = propias.length ? propias : prestadas.flatMap((p) => p.mediciones);
  const conValor = meds.filter((m) => (m.valor ?? m.max) !== null && m.unidad !== 'µg/m²');
  if (!conValor.length) return null;
  return conValor.reduce((a, b) => ((b.valor ?? b.max)! > (a.valor ?? a.max)! ? b : a));
}

/* ---------- Strength of the scientific basis for a Bolivian study ---------- */

/** How comparable the environment of each study scope is to the Bolivian Amazon. */
export const SIMILITUD: Record<Alcance, string> = {
  bolivia: 'Medido en Bolivia.',
  madeira:
    'Misma cuenca que el norte de Bolivia: el Madre de Dios, el Beni y el Mamoré forman el Madeira, con los mismos ríos de aguas blancas y llanuras de inundación.',
  amazonia: 'Mismo bioma amazónico, en otra cuenca: clima y bosque similares, química del agua distinta.',
  fuera: 'Otro ecosistema tropical: sirve solo como comparación.',
  neotropico: 'Síntesis de varias regiones del Neotrópico, sin un sitio único.',
};

export type NivelSolidez = 'Alta' | 'Media' | 'Baja';
export const SOLIDEZ_COLOR: Record<NivelSolidez, string> = { Alta: '#BBD77A', Media: '#D5AC69', Baja: '#AFB6A5' };

const PUNTOS_RELACION: Record<Relacion, number> = {
  misma_especie: 2, mismo_genero: 1, misma_familia: 0, mismo_gremio: 0, mismo_habito: 0,
};
const PUNTOS_ALCANCE: Record<Alcance, number> = { bolivia: 2, madeira: 2, amazonia: 1, fuera: 0, neotropico: 0 };

const DEPREDADOR = ['piscivora', 'carnivora', 'carronera'];
const esDepredador = (dieta: string) => DEPREDADOR.includes(normalize(dieta));

/** True when one taxon is a predator and the other is not: mercury biomagnifies up the food web. */
export const dietaDistinta = (a: Taxon, b: Taxon) =>
  a.nivel !== 'grupo' && b.nivel !== 'grupo' && esDepredador(a.dieta) !== esDepredador(b.dieta);

/** Same species measured in the same basin = strong basis; a family relative measured far away = weak.
 *  A different trophic level (predator vs. not) lowers the basis one step. */
export function solidez(relacion: Relacion, alcance: Alcance, otraDieta = false): NivelSolidez {
  const p = PUNTOS_RELACION[relacion] + PUNTOS_ALCANCE[alcance] - (otraDieta ? 2 : 0);
  return p >= 4 ? 'Alta' : p >= 2 ? 'Media' : 'Baja';
}

/** Best (relation, scope) pair among the evidence that backs a taxon. */
export function mejorBase(t: Taxon, idx: IndiceBio) {
  const { propias, prestadas } = evidencia(t, idx);
  const pares = [
    ...propias.map((m) => ({ relacion: 'misma_especie' as Relacion, m, otraDieta: false })),
    ...prestadas.flatMap((p) =>
      p.mediciones.map((m) => ({ relacion: p.relacion, m, otraDieta: dietaDistinta(t, p.taxon) })),
    ),
  ].map((x) => {
    const alcance = idx.sitio.get(x.m.sitio)!.alcance;
    return { ...x, alcance, nivel: solidez(x.relacion, alcance, x.otraDieta) };
  });
  const orden: Record<NivelSolidez, number> = { Alta: 0, Media: 1, Baja: 2 };
  pares.sort((a, b) => orden[a.nivel] - orden[b.nivel] || PUNTOS_ALCANCE[b.alcance] - PUNTOS_ALCANCE[a.alcance]);
  return pares[0] ?? null;
}

const citaBreve = (cita: string) => cita.match(/^(.*?\b(?:19|20)\d{2})\b/)?.[1] ?? cita.split('.')[0];

/** Plain-text study proposal a researcher can copy as a starting point. */
export function propuestaEstudio(t: Taxon, idx: IndiceBio) {
  const { propias, prestadas } = evidencia(t, idx);
  const base = mejorBase(t, idx);
  const lineas: string[] = [];
  lineas.push(`Propuesta de estudio: mercurio total (THg) en ${t.nombre_comun.toLowerCase()} (${t.nombre_cientifico}), ${t.familia}, en la Amazonía boliviana.`);
  if (t.bolivia?.registros) {
    lineas.push(
      `Presencia en Bolivia: ${t.bolivia.registros.toLocaleString('es-BO')} registros en GBIF` +
        (t.bolivia.departamentos.length ? `, sobre todo en ${t.bolivia.departamentos.join(', ')}` : '') +
        (t.amazonia_bolivia ? ` (${t.amazonia_bolivia.toLocaleString('es-BO')} en Beni y Pando)` : '') + '.',
    );
  }
  const refs = [
    ...propias.map((m) => ({ quien: `La misma especie`, relacion: null as Relacion | null, m })),
    ...prestadas.flatMap((p) => p.mediciones.map((m) => ({ quien: `${p.taxon.nombre_comun} (${p.taxon.nombre_cientifico})`, relacion: p.relacion, m }))),
  ].slice(0, 4);
  if (refs.length) {
    lineas.push('Base científica:');
    for (const r of refs) {
      const sitio = idx.sitio.get(r.m.sitio)!;
      const fuente = idx.fuente.get(r.m.fuente)!;
      lineas.push(
        `- ${r.quien}${r.relacion ? `, ${RELACIONES[r.relacion].toLowerCase()}` : ''}: ${formatValor(r.m)} en ${r.m.tejido}` +
          ` (${describirMedicion(r.m).split(' · ').slice(1).join(', ')}), ${sitio.nombre}${sitio.pais ? `, ${sitio.pais}` : ''}. ${citaBreve(fuente.cita)}. ${fuente.url}`,
      );
    }
  }
  if (base) {
    lineas.push(`Similitud de condiciones: ${SIMILITUD[base.alcance]}`);
    lineas.push(`Solidez de la base: ${base.nivel} (${RELACIONES[base.relacion].toLowerCase()}, estudio en ${ALCANCES[base.alcance].label.toLowerCase()}${base.otraDieta ? ', dieta distinta' : ''}).`);
    if (base.otraDieta) {
      const ref = idx.taxon.get(base.m.taxon)!;
      lineas.push(
        `Diferencia de dieta: la referencia es ${ref.dieta.toLowerCase()} y esta especie es ${t.dieta.toLowerCase()}. ` +
          (esDepredador(ref.dieta) ? 'Se espera menos mercurio que en la referencia.' : 'Se espera más mercurio que en la referencia.'),
      );
    }
  }
  const funds = fundamentosDe(t, idx);
  if (funds.length) {
    lineas.push('Por qué podría ser bioindicador:');
    for (const f of funds) {
      const cita = f.fuentes.map((id) => citaBreve(idx.fuente.get(id)!.cita)).join('; ');
      lineas.push(`- ${f.titulo} (${TIPOS_FUNDAMENTO[f.tipo].toLowerCase()}): ${f.texto} [${cita}]`);
    }
  }
  if (base && base.m.taxon !== t.id) {
    const ref = idx.taxon.get(base.m.taxon)!;
    lineas.push(`Similitudes con la referencia (${ref.nombre_comun}, ${ref.nombre_cientifico}):`);
    for (const s of similitudes(t, ref, base.alcance)) lineas.push(`- ${s.label}: ${s.ok ? 'sí' : 'no'} (${s.detalle}).`);
  }
  const muestra = t.prioridad?.muestra ?? refs[0]?.m.tejido;
  if (muestra) lineas.push(`Muestra sugerida: ${muestra.toLowerCase()}, siguiendo el método del estudio de referencia.`);
  lineas.push(
    'Diseño sugerido: comparar ejemplares de sitios aguas abajo de zonas mineras con un sitio de referencia sin minería, registrar tamaño o edad de cada ejemplar e informar peso húmedo o seco.',
  );
  if (t.origen === 'pariente_gbif') lineas.push('Dieta y hábitat de la especie: confirmar con literatura antes de diseñar el muestreo; el parentesco por familia no garantiza la misma dieta.');
  lineas.push('Advertencia: los valores citados se midieron fuera de Bolivia o en otra especie; no son mediciones bolivianas.');
  return lineas.join('\n');
}

/* ---------- Why it could be a bioindicator (sourced rationale) ---------- */

export const TIPOS_FUNDAMENTO: Record<Fundamento['tipo'], string> = {
  quimico: 'Química',
  biologico: 'Biología',
  anatomico: 'Anatomía',
};

const genero = (t: Taxon) => t.nombre_cientifico.split(' ')[0];

/** Rationale entries whose rule (group, family, genus, diet) matches the taxon. */
export function fundamentosDe(t: Taxon, idx: IndiceBio) {
  return idx.catalogo.fundamentos.filter(({ aplica: a }) =>
    (!a.grupos.length || a.grupos.includes(t.grupo)) &&
    (!a.familias.length || a.familias.includes(t.familia)) &&
    (!a.generos.length || a.generos.includes(genero(t))) &&
    (!a.dietas.length || a.dietas.includes(normalize(t.dieta))),
  );
}

/** Point-by-point comparison between a Bolivian candidate and the measured reference. */
export function similitudes(t: Taxon, ref: Taxon, alcance: Alcance) {
  const grupoRef = ref.nivel === 'grupo';
  return [
    { label: 'Mismo grupo biológico', ok: t.grupo === ref.grupo, detalle: grupoLabel(ref.grupo) },
    ...(grupoRef ? [] : [
      { label: 'Misma familia', ok: t.familia === ref.familia, detalle: ref.familia },
      { label: 'Mismo género', ok: genero(t) === genero(ref), detalle: genero(ref) },
    ]),
    {
      label: 'Misma dieta',
      ok: grupoRef ? normalize(ref.dieta) === normalize(t.dieta) : !dietaDistinta(t, ref) && normalize(ref.dieta) === normalize(t.dieta),
      detalle: `${t.dieta.toLowerCase()} frente a ${ref.dieta.toLowerCase()}`,
    },
    { label: 'Estudio en la misma cuenca que Bolivia', ok: alcance === 'madeira' || alcance === 'bolivia', detalle: ALCANCES[alcance].label },
  ];
}

export const fotoUrl = (archivo: string, width = 640) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(archivo)}?width=${width}`;
export const fotoPagina = (archivo: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(archivo.replace(/ /g, '_'))}`;
