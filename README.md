# EcoVigilante

Atlas geoespacial para la vigilancia de la contaminación por mercurio asociada a la minería aurífera en la Amazonía boliviana.

- Aplicación web: https://ecovigilante.vercel.app
- API: https://ecovigilante-api.onrender.com/docs

## Contexto

La minería aurífera aluvial en las cuencas del Beni, Madre de Dios, Kaka, Mapiri y Mamoré utiliza mercurio elemental para amalgamar el oro. Una parte llega a los ríos, se transforma en metilmercurio en los sedimentos y se acumula en los peces carnívoros (surubí, muturo, piraña), que son la base de la dieta de las comunidades ribereñas e indígenas de la región.

Los equipos de investigación en salud ambiental trabajan con información fragmentada: los muestreos de campo son costosos y esporádicos, las operaciones mineras se desplazan constantemente y los registros oficiales no reflejan la actividad no regulada. EcoVigilante reúne en un solo mapa tres fuentes que normalmente se consultan por separado:

1. **Reportes comunitarios.** Observaciones de las comunidades (peces con lesiones, agua turbia, vegetación afectada, síntomas neurológicos compatibles con exposición a mercurio) georreferenciadas y con una entrevista estructurada.
2. **Huella minera satelital.** Detecciones de minería aurífera sobre imágenes Sentinel-2 publicadas por Amazon Mining Watch, recortadas a Bolivia y agrupadas en zonas por municipio.
3. **Bioindicadores.** Mercurio medido en peces, aves, reptiles, mamíferos, insectos, plantas y sedimentos en estudios publicados de la Amazonía (Bolivia, Perú, Brasil) y, como comparación, de otros ecosistemas tropicales. Cada especie indica si vive en Bolivia (registros de GBIF) y, si no tiene mediciones propias, qué pariente medido sirve de base para investigarla.

El objetivo es que un investigador pueda priorizar dónde muestrear: qué comunidades acumulan reportes, qué zonas mineras crecieron recientemente y cuáles están cerca, para luego validar cada caso.

## Funcionalidades

- **Territorio.** Directorio de comunidades monitoreadas por departamento, con nivel de alerta, población estimada, actividad reciente, síntomas referidos y huella minera en un radio de 25 km.
- **Minería.** Zonas mineras detectadas por satélite, ordenables por actividad reciente o extensión, con su evolución anual (2018–2026) y las comunidades más próximas.
- **Bioindicadores.** Catálogo por grupo biológico. Cada ficha muestra el mercurio medido (valor, tejido, sitio y artículo de origen), la presencia en Bolivia según GBIF, los parientes bolivianos que pueden estudiarse y, para las especies prioritarias, la muestra sugerida. El mapa muestra los sitios de muestreo coloreados por alcance (Bolivia, cuenca del Madeira, resto de la Amazonía, fuera de la Amazonía).
- **Candidatos para investigar en Bolivia.** Además de las especies de los papers, el catálogo incluye especies de la misma familia o género registradas en Beni y Pando (GBIF). Cada candidato tiene una solidez de la base (alta, media o baja), que combina el parentesco, la cercanía geográfica del estudio de referencia y la dieta. También trae una propuesta de estudio que el investigador puede copiar.
- **Por qué podría ser bioindicador.** Cada ficha explica, con cita al paper, los motivos químicos (afinidad del mercurio por el azufre de proteínas y queratina), anatómicos (qué tejido registra qué periodo) y biológicos (nivel trófico, longevidad, sedentarismo) que hacen útil a ese grupo. Si la especie no tiene mediciones propias, muestra el bioindicador de referencia y las similitudes punto por punto.
- **Bioindicadores potenciales por comunidad.** La ficha de cada comunidad lista las especies del catálogo registradas en su departamento, ordenadas por prioridad de investigación.
- **Investigación.** Estudios publicados sobre mercurio en Bolivia y la cuenca del Madeira, en cuatro pestañas: aire, agua, sedimentos y peces (esta última incluye el mercurio en cabello de la población ribereña). Cada pestaña resume lo que muestran los estudios en conjunto, con gráficos por sitio o especie y series en el tiempo, comparados con valores de referencia (límite boliviano para agua, TEL y PEL para sedimentos, Codex y OMS para pescado). También trae una línea de tiempo de los muestreos, fichas de cada estudio con su DOI y una tabla de mediciones. Los sitios de muestreo aparecen en el mapa; al seleccionar un estudio, el mapa se centra en sus sitios.
- **Proyectos.** Cartera de investigaciones por comunidad, con estado (de idea a concluido), financiadores marcados como potenciales o confirmados, plan de trabajo, cronograma y presupuesto. Cada actividad usa un costo cotizado por el equipo o, mientras no lo haya, una estimación referencial (con fuente pública) o un supuesto (sin fuente), siempre identificados como tales. La ficha explica por qué invertir en esa comunidad con los datos del atlas (alerta, huella minera, estudios cercanos, especies registradas). Desde la ficha de cada comunidad, "Generar propuesta" arma un plan de 12 meses.
- **Reportes.** Bandeja de reportes por estado. El investigador registra notas y cambia el estado de cada reporte.
- **Mapa.** Capas base satelital, híbrida y de relieve; red hidrográfica; límite nacional; huella minera filtrable por periodo de detección.

### Ciclo de vida de un reporte

| Estado | Significado |
| --- | --- |
| `crudo` | Recibido, sin revisar. |
| `semiverificado` | Revisado por un investigador; coherente en ubicación y síntomas. Prioridad para muestreo. |
| `verificado` | Confirmado con análisis de laboratorio (cabello, sangre, agua o sedimento). |
| `descartado` | Revisado y sin fundamento suficiente. |

## Arquitectura

```
web-investigador/   React 18, TypeScript, Vite, Tailwind CSS, Leaflet   (Vercel)
        |
        |  HTTPS / JSON
        v
backend/            Python 3.12, FastAPI, Pydantic, SQLite               (Render)
```

La capa de huella minera y el límite de Bolivia son archivos GeoJSON estáticos servidos por el propio frontend (`web-investigador/public/data/`), por lo que el mapa minero funciona aunque la API no esté disponible.

```
.
├── backend/
│   ├── app/
│   │   ├── main.py          Endpoints, CORS y autenticación por clave
│   │   ├── models.py        Esquemas Pydantic
│   │   ├── database.py      Acceso a SQLite y siembra inicial
│   │   ├── seed_data.py     Ríos, comunidades y reportes de ejemplo
│   │   ├── catalogo.py      Carga y valida el catálogo de bioindicadores
│   │   ├── investigacion.py Carga y valida los estudios de la sección Investigación
│   │   ├── data/
│   │   │   ├── bioindicadores.json  Mediciones publicadas, sitios, fuentes y presencia en Bolivia
│   │   │   └── investigacion.json   Estudios de mercurio en aire, agua, sedimentos, peces y cabello
│   │   └── geo.py           Utilidades geográficas
│   ├── requirements.txt
│   └── run.sh
├── web-investigador/
│   ├── public/data/         GeoJSON de huella minera y límite nacional
│   └── src/
│       ├── components/      Mapa, paneles y directorios
│       ├── data/            Fotos referenciales y testimonios de demostración
│       ├── lib/             Lógica de minería, del catálogo de bioindicadores y de presentación
│       └── services/api.ts  Cliente de la API
├── render.yaml              Blueprint de despliegue del backend
└── ARCHITECTURE_AND_DECISIONS.md
```

## API

Base: `/api/v1`. Documentación interactiva en `/docs`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio |
| GET | `/rios` | Red hidrográfica principal (GeoJSON) |
| GET | `/comunidades` | Comunidades con nivel de alerta y total de reportes |
| GET | `/bioindicadores` | Catálogo de bioindicadores: taxones, mediciones de mercurio, sitios de muestreo, fuentes y presencia en Bolivia |
| GET | `/investigacion` | Estudios de mercurio por matriz (aire, agua, sedimentos, peces, cabello): sitios con coordenadas, mediciones y valores de referencia |
| GET | `/proyectos` | Proyectos de investigación por comunidad; filtro opcional `comunidad_id` |
| GET | `/proyectos/{id}` | Detalle de un proyecto |
| POST | `/proyectos` | Crea un proyecto. Requiere la cabecera `X-API-Key` |
| PUT | `/proyectos/{id}` | Actualiza un proyecto. Requiere la cabecera `X-API-Key` |
| GET | `/reportes` | Reportes; filtros opcionales `estado` y `comunidad_id` |
| GET | `/reportes/{id}` | Detalle de un reporte |
| POST | `/reportes` | Registro de un reporte; si no indica comunidad, se asigna la más cercana |
| PATCH | `/reportes/{id}/estado` | Cambio de estado y notas. Requiere la cabecera `X-API-Key` |
| GET | `/metricas` | Totales por estado y síntomas más frecuentes |

## Desarrollo local

Requisitos: Python 3.10 o superior y Node.js 18 o superior.

**Backend**

```bash
cd backend
python -m venv venv
./venv/bin/pip install -r requirements.txt
./run.sh
```

La API queda en `http://localhost:8000`. La base `ecovigilante.db` se crea y se siembra automáticamente al iniciar.

**Frontend**

```bash
cd web-investigador
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173` y en desarrollo usa la API local sin configuración adicional.

## Configuración y despliegue

**Backend (Render).** Se despliega con el Blueprint `render.yaml` desde la rama `main`.

| Variable | Descripción |
| --- | --- |
| `ADMIN_API_KEY` | Clave exigida para cambiar el estado de un reporte. Si no está definida, no se exige (solo desarrollo). |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. Ej.: `https://ecovigilante.vercel.app` |
| `CORS_ORIGIN_REGEX` | Opcional. Expresión regular para aceptar las URL de vista previa de Vercel. |

**Frontend (Vercel).** Directorio raíz `web-investigador`, comando `npm run build`, salida `dist`.

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL base de la API, p. ej. `https://ecovigilante-api.onrender.com/api/v1`. Obligatoria en producción. |
| `VITE_API_KEY` | Clave del investigador; debe coincidir con `ADMIN_API_KEY`. |

## Limitaciones conocidas

- **Datos de demostración.** Los reportes semilla y los testimonios de las comunidades son ficticios, y la interfaz los identifica como tales. Las mediciones de mercurio del catálogo de bioindicadores, en cambio, provienen de artículos publicados y cada una enlaza a su fuente.
- **Extrapolación entre regiones.** La mayoría de las mediciones son de Perú y Brasil. La web las presenta como referencia para especies que viven en Bolivia, nunca como valores bolivianos. La presencia en Bolivia se basa en registros de GBIF, que dependen del esfuerzo de muestreo. Las coordenadas de los sitios son aproximadas.
- **Persistencia.** El plan gratuito de Render no tiene disco persistente: la base SQLite vuelve a su estado inicial en cada reinicio o despliegue, incluidos los proyectos creados o editados. La primera petición tras un periodo de inactividad puede tardar alrededor de un minuto.
- **Proximidad.** La cercanía entre comunidades y zonas mineras se calcula en línea recta. El mercurio viaja con la corriente, por lo que la relación aguas arriba / aguas abajo debe confirmarse sobre la red hidrográfica.
- **Autenticación.** La clave del investigador se incluye en el bundle del frontend; protege contra cambios accidentales, no contra un usuario malintencionado. Un despliegue real requiere autenticación por usuario.
- **Costos de los proyectos.** Los costos referenciales provienen de tarifas públicas (análisis de mercurio en una universidad de EE. UU., arancel del INLASA para agua) y no reemplazan una cotización. Los supuestos no tienen fuente y se muestran como tales. Los proyectos de demostración son ficticios y no representan compromisos de ninguna institución.
- **Huella minera.** El modelo de Amazon Mining Watch no distingue minería legal de ilegal ni identifica a los operadores; las detecciones de 2025–2026 son provisionales.

## Fuentes de datos

| Dato | Fuente | Licencia |
| --- | --- | --- |
| Mercurio en organismos y sedimentos | Artículos científicos citados en `backend/app/data/bioindicadores.json` (DOI en cada registro) | Según cada artículo |
| Estudios de mercurio en aire, agua, sedimentos, peces y cabello | Artículos e informes citados en `backend/app/data/investigacion.json`. Cada estudio indica si sus valores se leyeron en el texto completo, en el resumen o en una compilación secundaria aún sin cotejar | Según cada artículo |
| Presencia de especies en Bolivia | [GBIF](https://www.gbif.org), consulta del 26 de noviembre de 2026 | Según cada conjunto de datos (CC0, CC BY, CC BY-NC) |
| Huella de minería aurífera | [Amazon Mining Watch](https://source.coop/earthgenome/amazon-mining-watch) (Earth Genome) | CC BY 4.0 |
| Límite nacional de Bolivia | Natural Earth 1:10m | Dominio público |
| Límites municipales | geoBoundaries / GeoBolivia | Según cada fuente |
| Fotografías de comunidades y especies | Wikimedia Commons (especies vía la propiedad P18 de Wikidata) | Según cada archivo; autor y licencia en la interfaz |
| Imágenes base del mapa | Google Maps | Términos de servicio de Google |
