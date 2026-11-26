// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE DEMOSTRACIÓN (hardcodeados en el frontend)
//
// Los testimonios de este archivo son FICTICIOS: muestran cómo se verá la plataforma
// con relatos reales y la interfaz los marca como "demo". Las mediciones de mercurio
// ya no viven aquí: vienen del catálogo del backend (GET /bioindicadores), con fuente.
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

// Claves = id del taxón en el catálogo del backend.

export const FOTOS_BIOINDICADOR: Record<string, Foto> = {
  'pseudoplatystoma-fasciatum': commons('Pseudoplatystoma-fasciatum.jpg', 'Surubí (Pseudoplatystoma fasciatum)', 480),
  'zungaro-zungaro': commons('Zungaro_zungaro.jpg', 'Muturo (Zungaro zungaro)', 480),
  'prochilodus-nigricans': commons(
    'Prochilodus_nigricans_from_the_Lajeado_reservoir_(1_of_2)_(cropped).png',
    'Sábalo (Prochilodus nigricans)',
    480,
  ),
  'pygocentrus-nattereri': commons('Pygocentrus_nattereri_-_Karlsruhe_Zoo_01.jpg', 'Piraña (Pygocentrus nattereri)', 480),
  'eichhornia-crassipes': commons('Eichhornia_crassipes_C.jpg', 'Tarope (Eichhornia crassipes)', 480),
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
  'rep-002': FOTOS_BIOINDICADOR['pseudoplatystoma-fasciatum'],
  'rep-003': DRAGA,
  'rep-004': FOTOS_BIOINDICADOR['eichhornia-crassipes'],
};

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
