# EcoVigilante

Atlas geoespacial para la vigilancia de la contaminación por mercurio asociada a la minería aurífera en la Amazonía boliviana.

- Aplicación web: https://ecovigilante.vercel.app
- API: https://ecovigilante-api.onrender.com/docs

## Contexto

La minería aurífera aluvial en las cuencas del Beni, Madre de Dios, Kaka, Mapiri y Mamoré utiliza mercurio elemental para amalgamar el oro. Una parte llega a los ríos, se transforma en metilmercurio en los sedimentos y se acumula en los peces carnívoros (surubí, muturo, piraña), que son la base de la dieta de las comunidades ribereñas e indígenas de la región.

Los equipos de investigación en salud ambiental trabajan con información fragmentada: los muestreos de campo son costosos y esporádicos, las operaciones mineras se desplazan constantemente y los registros oficiales no reflejan la actividad no regulada. EcoVigilante reúne en un solo mapa tres fuentes que normalmente se consultan por separado:

1. **Reportes comunitarios.** Observaciones de las comunidades (peces con lesiones, agua turbia, vegetación afectada, síntomas neurológicos compatibles con exposición a mercurio) georreferenciadas y con una entrevista estructurada.
2. **Huella minera satelital.** Detecciones de minería aurífera sobre imágenes Sentinel-2 publicadas por Amazon Mining Watch, recortadas a Bolivia y agrupadas en zonas por municipio.
3. **Bioindicadores y estudios de campo.** Catálogo de especies con su nivel de bioacumulación y resultados de muestreo comparados con límites de referencia.

El objetivo es que un investigador pueda priorizar dónde muestrear: qué comunidades acumulan reportes, qué zonas mineras crecieron recientemente y cuáles están cerca, para luego validar cada caso.

## Funcionalidades

- **Territorio.** Directorio de comunidades monitoreadas por departamento, con nivel de alerta, población estimada, actividad reciente, síntomas referidos y huella minera en un radio de 25 km.
- **Minería.** Zonas mineras detectadas por satélite, ordenables por actividad reciente o extensión, con su evolución anual (2018–2026) y las comunidades más próximas.
- **Bioindicadores.** Fichas de especies y filtro que resalta en el mapa las comunidades con muestras registradas.
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
│   │   ├── seed_data.py     Ríos, comunidades, bioindicadores y reportes de ejemplo
│   │   └── geo.py           Utilidades geográficas
│   ├── requirements.txt
│   └── run.sh
├── web-investigador/
│   ├── public/data/         GeoJSON de huella minera y límite nacional
│   └── src/
│       ├── components/      Mapa, paneles y directorios
│       ├── data/            Datos de demostración (estudios, testimonios, fotos)
│       ├── lib/             Lógica de minería y utilidades de presentación
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
| GET | `/bioindicadores` | Catálogo de especies bioindicadoras |
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

- **Datos de demostración.** Los reportes semilla, los estudios de campo y los testimonios son ficticios y la interfaz los identifica como tales. Los valores de mercurio son plausibles, pero no son mediciones.
- **Persistencia.** El plan gratuito de Render no tiene disco persistente: la base SQLite vuelve a su estado inicial en cada reinicio o despliegue. La primera petición tras un periodo de inactividad puede tardar alrededor de un minuto.
- **Proximidad.** La cercanía entre comunidades y zonas mineras se calcula en línea recta. El mercurio viaja con la corriente, por lo que la relación aguas arriba / aguas abajo debe confirmarse sobre la red hidrográfica.
- **Autenticación.** La clave del investigador se incluye en el bundle del frontend; protege contra cambios accidentales, no contra un usuario malintencionado. Un despliegue real requiere autenticación por usuario.
- **Huella minera.** El modelo de Amazon Mining Watch no distingue minería legal de ilegal ni identifica a los operadores; las detecciones de 2025–2026 son provisionales.

## Fuentes de datos

| Dato | Fuente | Licencia |
| --- | --- | --- |
| Huella de minería aurífera | [Amazon Mining Watch](https://source.coop/earthgenome/amazon-mining-watch) (Earth Genome) | CC BY 4.0 |
| Límite nacional de Bolivia | Natural Earth 1:10m | Dominio público |
| Límites municipales | geoBoundaries / GeoBolivia | Según cada fuente |
| Fotografías de comunidades y especies | Wikimedia Commons | Según cada archivo; crédito en la interfaz |
| Imágenes base del mapa | Google Maps | Términos de servicio de Google |
