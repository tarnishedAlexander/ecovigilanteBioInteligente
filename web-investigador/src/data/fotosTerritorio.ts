import type { Foto } from './expedientes';

interface FotoTerritorio extends Foto {
  autor: string;
  licencia: string;
  urlLicencia: string;
}

export const FOTOS_TERRITORIO: Record<string, FotoTerritorio> = {
  'com-riberalta': {
    src: '/comunidades/riberalta.webp',
    titulo: 'Río Beni en Riberalta',
    fuente: 'https://commons.wikimedia.org/wiki/File:R%C3%ADo_Beni_Riberalta.jpg',
    autor: 'Cesqsc',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0',
  },
  'com-cachuela': {
    src: '/comunidades/cachuela.webp',
    titulo: 'Cachuela Esperanza al atardecer',
    fuente: 'https://commons.wikimedia.org/wiki/File:Una_tarde_cualquiera_en_Cachuela_Esperanza.jpg',
    autor: 'Manuel Seoane',
    licencia: 'CC BY 2.0',
    urlLicencia: 'https://creativecommons.org/licenses/by/2.0',
  },
  'com-rurre': {
    src: '/comunidades/rurre.webp',
    titulo: 'Rurrenabaque y el río Beni',
    fuente: 'https://commons.wikimedia.org/wiki/File:Vista_del_r%C3%ADo_que_divide_Rurrenabaque_de_San_Buenaventura,_Bolivia.jpg',
    autor: 'Carlillasa',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0',
  },
  'com-guayaramerin': {
    src: '/comunidades/guayaramerin.webp',
    titulo: 'Puerto de Guayaramerín',
    fuente: 'https://commons.wikimedia.org/wiki/File:Guayaramer%C3%ADn_Port.jpg',
    autor: 'Filzstift',
    licencia: 'CC BY-SA 3.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/3.0',
  },
  'com-san-buenaventura': {
    src: '/comunidades/san-buenaventura.webp',
    titulo: 'San Buenaventura a orillas del Beni',
    fuente: 'https://commons.wikimedia.org/wiki/File:San_Buenaventura,_Beni_River,_Bolivia.jpg',
    autor: 'Arthur Chapman',
    licencia: 'CC BY 2.0',
    urlLicencia: 'https://creativecommons.org/licenses/by/2.0',
  },
  'com-guanay': {
    src: '/comunidades/guanay.webp',
    titulo: 'Vista de Guanay',
    fuente: 'https://commons.wikimedia.org/wiki/File:Guanay_02.jpg',
    autor: 'Das Morton',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0',
  },
  'com-teoponte': {
    src: '/comunidades/teoponte.webp',
    titulo: 'Calle adoquinada de Teoponte',
    fuente: 'https://commons.wikimedia.org/wiki/File:Teoponte_calle_adoquinada.jpg',
    autor: 'Alfredobi',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0',
  },
  'com-puerto-rico': {
    src: '/comunidades/puerto-rico.webp',
    titulo: 'Confluencia del Manuripi y el Tahuamanu cerca de Puerto Rico',
    fuente: 'https://commons.wikimedia.org/wiki/File:Confluence_of_r%C3%ADo_Manuripi_and_r%C3%ADo_Tahuamanu,_close_to_Puerto_Rico,_Bolivia_2.png',
    autor: 'Das Morton',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0',
  },
};
