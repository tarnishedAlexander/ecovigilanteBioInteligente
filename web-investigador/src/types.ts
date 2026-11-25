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

export interface Bioindicador {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  tipo: string;
  nivel_bioacumulacion: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
  factor_riesgo_salud: string;
  descripcion_ecologica: string;
  especies_similares: string[];
  icono: string;
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
