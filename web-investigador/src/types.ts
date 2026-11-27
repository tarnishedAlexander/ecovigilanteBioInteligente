export interface Sintomas {
  temblores_extremidades: boolean;
  parestesias_adormecimiento: boolean;
  problemas_vision_marcha: boolean;
  dolores_cabeza_cronicos: boolean;
  fatiga_extrema: boolean;
  perdida_memoria_concentracion: boolean;
}

export interface EntrevistaIA {
  comunidad_mencionada?: string;
  frecuencia_consumo_pescado?: string;
  tipos_pescado_mencionados: string[];
  sintomas: Sintomas;
  tiempo_con_sintomas?: string;
  fuente_agua_comunal?: string;
  indicio_ambiental_adicional?: string;
  score_sospecha: number;
}

export interface Reporte {
  id: string;
  latitud: number;
  longitud: number;
  categoria: 'pez' | 'agua' | 'planta' | 'salud' | 'mineria';
  descripcion_usuario?: string;
  url_foto?: string;
  estado: 'crudo' | 'semiverificado' | 'verificado' | 'descartado';
  score_sospecha: number;
  comunidad_id?: string;
  comunidad_nombre?: string;
  fecha_reporte: string;
  fecha_sincronizacion: string;
  notas_investigador?: string;
  entrevista_ia?: EntrevistaIA;
}

export interface Comunidad {
  id: string;
  nombre: string;
  departamento: string;
  cuenca_principal: string;
  latitud: number;
  longitud: number;
  poblacion_estimada: number;
  posible_fuente_minera_aguas_arriba: string;
  alerta_nivel: 'Bajo' | 'Medio' | 'Alto' | 'Critico';
  total_reportes?: number;
}

/* ---------- Catálogo de bioindicadores (GET /bioindicadores) ---------- */

export type Grupo = 'pez' | 'ave' | 'reptil' | 'mamifero' | 'insecto' | 'planta' | 'abiotico';
export type Alcance = 'bolivia' | 'madeira' | 'amazonia' | 'fuera' | 'neotropico';
export type Relacion = 'misma_especie' | 'mismo_genero' | 'misma_familia' | 'mismo_gremio' | 'mismo_habito';

export interface Fuente {
  id: string;
  cita: string;
  url: string;
}

export interface Sitio {
  id: string;
  nombre: string;
  pais: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  precision: 'exacta' | 'aproximada' | 'desconocida';
  contexto: 'minero' | 'referencia' | 'mixto' | 'mercado' | 'desconocido';
  alcance: Alcance;
}

export interface Taxon {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string;
  grupo: Grupo;
  nivel: 'especie' | 'genero' | 'grupo';
  dieta: string;
  introducida: boolean;
  bolivia: { gbif_key: number; registros: number; departamentos: string[] } | null;
  referencias: { taxon: string; relacion: Relacion }[];
  prioridad: { orden: number; motivo: string; muestra: string } | null;
  nota: string | null;
  origen: 'corpus' | 'pariente_gbif';
  amazonia_bolivia: number | null;
  foto: { archivo: string; licencia: string | null; autor: string | null } | null;
}

export interface Fundamento {
  id: string;
  tipo: 'quimico' | 'biologico' | 'anatomico';
  titulo: string;
  texto: string;
  fuentes: string[];
  aplica: { grupos: string[]; familias: string[]; generos: string[]; dietas: string[] };
}

export interface Medicion {
  id: string;
  taxon: string;
  sitio: string;
  tejido: string;
  estadistico: 'media' | 'mediana' | 'individual' | 'rango' | 'total' | 'bajo_ld';
  valor: number | null;
  min: number | null;
  max: number | null;
  dispersion: number | null;
  dispersion_tipo: 'DE' | 'EE' | null;
  unidad: 'mg/kg' | 'µg/g' | 'ng/L' | 'µg/m²';
  base: 'humedo' | 'seco' | null;
  n: number | null;
  periodo: string | null;
  fuente: string;
  nota: string | null;
}

export interface CatalogoBioindicadores {
  version: string;
  nota: string;
  fundamentos: Fundamento[];
  fuentes: Fuente[];
  sitios: Sitio[];
  taxones: Taxon[];
  mediciones: Medicion[];
}

/* ---------- Investigación (GET /investigacion) ---------- */

export type Matriz = 'aire' | 'agua' | 'sedimentos' | 'peces' | 'cabello';
export type Gremio = 'carnivoro' | 'no_carnivoro' | 'reptil' | 'mixto';

export interface EstudioHg {
  id: string;
  cita: string;
  anio: number;
  titulo: string;
  autores: string;
  revista: string;
  url: string;
  matrices: Matriz[];
  muestreo: [number | null, number | null];
  verificacion: 'texto' | 'resumen' | 'compilacion';
  hallazgo: string;
}

export interface SitioHg {
  id: string;
  nombre: string;
  region: string | null;
  pais: string;
  lat: number;
  lng: number;
  precision: 'exacta' | 'aproximada';
  nota: string | null;
}

export interface MedicionHg {
  id: string;
  estudio: string;
  sitio: string;
  matriz: Matriz;
  forma: string;
  especie: { comun: string; cientifico: string; gremio: Gremio } | null;
  estadistico: 'media' | 'mediana' | 'individual' | 'rango' | 'bajo_ld';
  valor: number | null;
  min: number | null;
  max: number | null;
  de: number | null;
  unidad: 'ng/m³' | 'ng/L' | 'µg/g' | 'ng/g';
  base: 'humedo' | 'seco' | null;
  n: number | null;
  anio: number | null;
  periodo: string | null;
  nota: string | null;
}

export interface ReferenciaHg {
  id: string;
  matriz: Matriz;
  valor: number;
  unidad: string;
  etiqueta: string;
  fuente: string;
}

export interface Investigacion {
  version: string;
  nota: string;
  estudios: EstudioHg[];
  sitios: SitioHg[];
  mediciones: MedicionHg[];
  referencias: ReferenciaHg[];
}

/* ---------- Proyectos de investigación e inversión (GET /proyectos) ---------- */

export type EstadoProyecto = 'idea' | 'propuesta' | 'gestion_fondos' | 'financiado' | 'en_ejecucion' | 'concluido';
export type RubroActividad = 'peces' | 'cabello' | 'agua' | 'sedimentos' | 'aire' | 'social' | 'logistica' | 'difusion';

export interface ActividadProyecto {
  id: string;
  nombre: string;
  descripcion: string;
  rubro: RubroActividad;
  cantidad: number;
  unidad: string;
  /** Quoted by the team; null = no quote yet. */
  costo_unitario: number | null;
  /** Estimate used until there is a quote: 'referencial' has a public source, 'supuesto' has none. */
  costo_referencial: number | null;
  base_referencia: 'referencial' | 'supuesto' | null;
  fuente_costo: string | null;
  mes_inicio: number;
  mes_fin: number;
  completada: boolean;
}

export interface Financiador {
  nombre: string;
  tipo: 'cooperacion' | 'gobierno' | 'ong' | 'universidad' | 'privado' | 'por_definir';
  estado: 'potencial' | 'confirmado';
  monto_comprometido: number | null;
  nota: string | null;
}

export interface ProyectoDatos {
  titulo: string;
  comunidad_id: string;
  estado: EstadoProyecto;
  objetivo: string;
  duracion_meses: number;
  moneda: 'BOB' | 'USD';
  financiadores: Financiador[];
  contrapartes: string[];
  actividades: ActividadProyecto[];
  resultados: string[];
  notas: string;
  demo: boolean;
}

export interface Proyecto extends ProyectoDatos {
  id: string;
  creado: string;
  actualizado: string;
}

export interface Metricas {
  total_reportes: number;
  en_crudo: number;
  semiverificados: number;
  verificados: number;
  sintomas_frecuentes: {
    temblores: number;
    parestesias: number;
    dolor_cabeza: number;
    fatiga: number;
    vision_marcha: number;
  };
  cuenca_foco_principal: string;
}

export interface RioGeoJSON {
  type: string;
  features: Array<{
    type: string;
    properties: {
      id: string;
      nombre: string;
      cuenca: string;
      color: string;
      grosor: number;
      riesgo_minero: string;
      descripcion: string;
    };
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
  }>;
}
