// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE DEMOSTRACIÓN (hardcodeados en el frontend)
//
// Los estudios de campo, resultados de laboratorio y testimonios de este archivo
// son FICTICIOS: sirven para mostrar cómo se verá la plataforma con datos reales.
// Los valores de mercurio son plausibles pero no son mediciones. La interfaz los
// marca como "Datos de demostración". Cuando exista la tabla en el backend, este
// archivo debe reemplazarse por llamadas a la API.
//
// Las fotografías son reales y de licencia libre (Wikimedia Commons). Se muestran
// como referenciales, con su crédito y enlace a la fuente.
// ─────────────────────────────────────────────────────────────────────────────

export interface Foto {
  src: string;
  titulo: string;
  fuente: string; // página del archivo en Commons (licencia y autor)
}

const commons = (archivo: string, titulo: string, width = 800): Foto => ({
  src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(archivo)}?width=${width}`,
  titulo,
  fuente: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(archivo.replace(/ /g, '_'))}`,
});

/* ---------- Fotos ---------- */

export const FOTOS_BIOINDICADOR: Record<string, Foto> = {
  'bio-surubi': commons('Pseudoplatystoma-fasciatum.jpg', 'Surubí (Pseudoplatystoma fasciatum)', 480),
  'bio-muturo': commons('Zungaro_zungaro.jpg', 'Muturo (Zungaro zungaro)', 480),
  'bio-sabalo': commons(
    'Prochilodus_nigricans_from_the_Lajeado_reservoir_(1_of_2)_(cropped).png',
    'Sábalo (Prochilodus nigricans)',
    480,
  ),
  'bio-pirana': commons('Pygocentrus_nattereri_-_Karlsruhe_Zoo_01.jpg', 'Piraña (Pygocentrus nattereri)', 480),
  'bio-tarope': commons('Eichhornia_crassipes_C.jpg', 'Tarope (Eichhornia crassipes)', 480),
};

const RIO_BENI_RIBERALTA = commons('Río Beni Riberalta.jpg', 'Río Beni a la altura de Riberalta');
const RIBERALTA = commons('Riberalta Beni Bolivia.jpg', 'Riberalta, Beni');
const CRUCE_BENI = commons('Cruzando el río Beni, Bolivia.JPG', 'Cruce del río Beni');
const TACANA_BOTE = commons('Tacana en bote por el rio Beni.jpg', 'Familia tacana navegando el río Beni');
const BENI_ANOCHECER = commons('Rio Beni - anochecer.jpg', 'Río Beni al anochecer');
const RIO_BENI = commons('Río Beni.jpg', 'Río Beni');
const MAMORE_BENI = commons('Encuentro de los ríos Mamoré y Beni desde Brasil.jpg', 'Confluencia de los ríos Mamoré y Beni');
const DRAGA = commons(
  'Gold Suction Dredge - Madre de Dios River (8183089237).jpg',
  'Draga de succión aurífera en el río Madre de Dios',
);

export const FOTOS_COMUNIDAD: Record<string, Foto[]> = {
  'com-riberalta': [RIO_BENI_RIBERALTA, RIBERALTA, DRAGA],
  'com-cachuela': [BENI_ANOCHECER, RIO_BENI],
  'com-rurre': [CRUCE_BENI, TACANA_BOTE],
  'com-san-buenaventura': [TACANA_BOTE, CRUCE_BENI],
  'com-puerto-rico': [DRAGA],
  'com-guanay': [DRAGA, RIO_BENI],
  'com-teoponte': [DRAGA],
  'com-guayaramerin': [MAMORE_BENI],
};

/** Foto adjunta a cada reporte del seed (referencial). */
export const FOTOS_REPORTE: Record<string, Foto> = {
  'rep-002': FOTOS_BIOINDICADOR['bio-surubi'],
  'rep-003': DRAGA,
  'rep-004': FOTOS_BIOINDICADOR['bio-tarope'],
};

/* ---------- Estudios de campo ---------- */

export interface Muestra {
  bioindicadorId?: string; // undefined para matrices humanas o ambientales
  especie: string;
  matriz: 'Músculo' | 'Cabello humano' | 'Raíz' | 'Agua';
  n: number;
  valor: number; // media
  unidad: 'mg/kg' | 'µg/g' | 'µg/L';
  limite?: number;
  referenciaLimite?: string;
}

export interface EstudioCampo {
  id: string;
  comunidadId: string;
  equipo: string;
  fecha: string; // ISO
  objetivo: string;
  metodo: string;
  muestras: Muestra[];
  conclusion: string;
}

// Límites de referencia usados en los ejemplos
const PEZ_PREDADOR = { limite: 1.0, referenciaLimite: 'Codex Alimentarius, peces predadores' };
const PEZ_NO_PREDADOR = { limite: 0.5, referenciaLimite: 'Codex Alimentarius, otros peces' };
const CABELLO = { limite: 1.0, referenciaLimite: 'Valor de referencia US EPA' };
const AGUA = { limite: 6, referenciaLimite: 'OMS, agua de consumo (Hg inorgánico)' };

export const ESTUDIOS: EstudioCampo[] = [
  {
    id: 'est-cachuela-2026',
    comunidadId: 'com-cachuela',
    equipo: 'Equipo de campo A (demo)',
    fecha: '2026-09-14',
    objetivo: 'Evaluar exposición alimentaria en familias pescadoras aguas abajo de Riberalta.',
    metodo: 'Captura con pescadores locales, músculo dorsal; cabello de 20 voluntarios adultos. Espectrometría de absorción atómica (vapor frío).',
    muestras: [
      { bioindicadorId: 'bio-surubi', especie: 'Surubí', matriz: 'Músculo', n: 12, valor: 1.9, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { bioindicadorId: 'bio-muturo', especie: 'Muturo', matriz: 'Músculo', n: 6, valor: 2.4, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { bioindicadorId: 'bio-sabalo', especie: 'Sábalo', matriz: 'Músculo', n: 10, valor: 0.18, unidad: 'mg/kg', ...PEZ_NO_PREDADOR },
      { especie: 'Pobladores', matriz: 'Cabello humano', n: 20, valor: 9.1, unidad: 'µg/g', ...CABELLO },
    ],
    conclusion:
      'Los predadores superan casi al doble el límite; el sábalo sirve como control negativo. El mercurio en cabello es 9 veces el valor de referencia: se recomienda guía de consumo y seguimiento clínico.',
  },
  {
    id: 'est-riberalta-2026',
    comunidadId: 'com-riberalta',
    equipo: 'Equipo de campo A (demo)',
    fecha: '2026-08-02',
    objetivo: 'Línea base en la confluencia Beni – Madre de Dios.',
    metodo: 'Muestreo en mercado y puerto; agua de pozos ribereños; cabello de 35 voluntarios.',
    muestras: [
      { bioindicadorId: 'bio-surubi', especie: 'Surubí', matriz: 'Músculo', n: 18, valor: 1.3, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { bioindicadorId: 'bio-sabalo', especie: 'Sábalo', matriz: 'Músculo', n: 15, valor: 0.12, unidad: 'mg/kg', ...PEZ_NO_PREDADOR },
      { especie: 'Pozos ribereños', matriz: 'Agua', n: 8, valor: 0.4, unidad: 'µg/L', ...AGUA },
      { especie: 'Pobladores', matriz: 'Cabello humano', n: 35, valor: 5.2, unidad: 'µg/g', ...CABELLO },
    ],
    conclusion:
      'El agua de pozo está bajo el límite: la exposición es por dieta, no por consumo de agua. Prioridad: familias que comen surubí a diario.',
  },
  {
    id: 'est-guanay-2026',
    comunidadId: 'com-guanay',
    equipo: 'Equipo de campo B (demo)',
    fecha: '2026-07-21',
    objetivo: 'Caracterizar la zona de origen cerca de cooperativas auríferas del río Mapiri.',
    metodo: 'Agua superficial aguas abajo de 3 frentes mineros; raíces de tarope; peces de pozas laterales.',
    muestras: [
      { especie: 'Río Mapiri', matriz: 'Agua', n: 6, valor: 3.8, unidad: 'µg/L', ...AGUA },
      { bioindicadorId: 'bio-tarope', especie: 'Tarope', matriz: 'Raíz', n: 9, valor: 2.1, unidad: 'mg/kg' },
      { bioindicadorId: 'bio-pirana', especie: 'Piraña', matriz: 'Músculo', n: 11, valor: 1.1, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { bioindicadorId: 'bio-sabalo', especie: 'Sábalo', matriz: 'Músculo', n: 8, valor: 0.35, unidad: 'mg/kg', ...PEZ_NO_PREDADOR },
    ],
    conclusion:
      'El agua se acerca al límite de la OMS y las raíces de tarope acumulan metal: indicio de vertido activo aguas arriba. La piraña ya supera el límite para consumo.',
  },
  {
    id: 'est-rurre-2026',
    comunidadId: 'com-rurre',
    equipo: 'Equipo de campo B (demo)',
    fecha: '2026-06-10',
    objetivo: 'Verificar si la contaminación del alto Beni llega al tramo medio.',
    metodo: 'Peces del puerto y macrófitas de la orilla.',
    muestras: [
      { bioindicadorId: 'bio-surubi', especie: 'Surubí', matriz: 'Músculo', n: 10, valor: 0.7, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { bioindicadorId: 'bio-tarope', especie: 'Tarope', matriz: 'Raíz', n: 6, valor: 0.6, unidad: 'mg/kg' },
    ],
    conclusion: 'Valores bajo el límite pero en aumento respecto a la zona baja: mantener vigilancia semestral.',
  },
  {
    id: 'est-puerto-rico-2026',
    comunidadId: 'com-puerto-rico',
    equipo: 'Equipo de campo A (demo)',
    fecha: '2026-05-28',
    objetivo: 'Evaluar el impacto de balsas aluviales en el río Manuripi.',
    metodo: 'Peces de lagunas laterales; cabello de 15 voluntarios.',
    muestras: [
      { bioindicadorId: 'bio-pirana', especie: 'Piraña', matriz: 'Músculo', n: 9, valor: 0.9, unidad: 'mg/kg', ...PEZ_PREDADOR },
      { especie: 'Pobladores', matriz: 'Cabello humano', n: 15, valor: 3.4, unidad: 'µg/g', ...CABELLO },
    ],
    conclusion: 'Exposición humana moderada; la piraña está cerca del límite. Se sugiere un segundo muestreo en época seca.',
  },
];

/* ---------- Testimonios ---------- */

export interface Testimonio {
  texto: string;
  quien: string; // siempre anónimo: rol, nunca nombre
}

export const TESTIMONIOS: Record<string, Testimonio[]> = {
  'com-cachuela': [
    { texto: 'Antes sacábamos surubí grande y gordo. Ahora sale flaco y con manchas, y igual lo comemos porque no hay otra cosa.', quien: 'Pescador, 52 años' },
    { texto: 'Mis hijos se quejan de que se les duermen las manos en la noche.', quien: 'Madre de familia' },
  ],
  'com-riberalta': [
    { texto: 'El agua del río ya no es como antes; baja más turbia desde que subieron las balsas por el Madre de Dios.', quien: 'Comerciante del puerto' },
    { texto: 'Comemos pescado todos los días, es lo más barato del mercado.', quien: 'Vecina del barrio ribereño' },
  ],
  'com-guanay': [
    { texto: 'Se escucha la maquinaria día y noche río arriba. El agua llega lechosa.', quien: 'Agricultor' },
  ],
  'com-teoponte': [
    { texto: 'Ya nadie se baña en la quebrada; dicen que el agua pica.', quien: 'Profesor de la unidad educativa' },
  ],
  'com-rurre': [
    { texto: 'En la orilla el tarope se está pudriendo desde abajo, eso no pasaba.', quien: 'Guía de turismo' },
  ],
  'com-puerto-rico': [
    { texto: 'Las balsas se mueven cada semana, nunca están en el mismo lugar.', quien: 'Pescador' },
  ],
};
