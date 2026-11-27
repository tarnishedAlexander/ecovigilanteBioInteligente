# Arquitectura y decisiones de diseño

Este documento registra las decisiones que dan forma a EcoVigilante y sus motivos. La descripción general del proyecto, la API y la puesta en marcha están en el [README](./README.md).

## Enfoque

La ubicación de las operaciones mineras y de los vertidos de mercurio cambia más rápido de lo que la registran los catastros oficiales. EcoVigilante no intenta vigilar directamente cada tramo de río: cruza tres señales independientes (reportes de las comunidades, detecciones satelitales de minería y resultados de muestreo en bioindicadores) para que el investigador decida dónde concentrar el trabajo de campo.

Un conjunto de reportes con síntomas compatibles con exposición a mercurio y un alto consumo de peces carnívoros, en una comunidad situada aguas abajo de una zona minera en expansión, es una hipótesis que merece muestreo. La plataforma ayuda a formular esa hipótesis; no la confirma.

## Decisiones

### 1. Aplicación web de escritorio para el investigador

- **Decisión:** la interfaz principal es un atlas web pensado para pantallas grandes, con soporte básico en pantallas pequeñas.
- **Motivo:** el análisis combina capas densas (huella minera, ríos, comunidades, reportes) con fichas de detalle extensas. Ese trabajo se hace en un computador.

### 2. Reportes anónimos

- **Decisión:** la API no asocia los reportes a una identidad. Un reporte se describe por sus coordenadas, fecha, categoría y contenido.
- **Motivo:** denunciar actividad minera en zonas de conflicto expone a represalias. No almacenar identidades reduce ese riesgo.

### 3. Ciclo de vida con validación progresiva

- **Decisión:** cada reporte pasa por los estados `crudo`, `semiverificado`, `verificado` o `descartado`. Solo un investigador autenticado puede cambiarlo.
- **Motivo:** separa la observación comunitaria de la evidencia de laboratorio sin descartar la primera. El mapa y las métricas muestran ambas, distinguidas por estado.

### 4. Huella minera como archivo estático

- **Decisión:** las detecciones de Amazon Mining Watch se preprocesan fuera de la aplicación (recorte a Bolivia, agrupación en zonas por municipio) y se sirven como GeoJSON desde el frontend.
- **Motivo:** son datos de publicación periódica que no cambian con el uso de la plataforma. Servirlos de forma estática evita carga en la API y permite que la capa funcione aunque el backend no responda. Si más adelante se actualizan con frecuencia, basta con apuntar `MINERIA_URL` a un endpoint.
- **Representación:** cada detección se dibuja como una celda de ~480 m en canvas, coloreada por el periodo de primera detección. Las detecciones aisladas (menos de 3 celdas) no se listan como zonas, para reducir falsos positivos.

### 5. Proximidad en línea recta, con advertencia explícita

- **Decisión:** la distancia entre comunidades y zonas mineras se calcula en línea recta, y la interfaz advierte que debe confirmarse si la zona está aguas arriba.
- **Motivo:** el mercurio viaja con la corriente; la distancia relevante es la del recorrido del río. Mientras no exista una red hidrográfica con topología completa, una distancia euclidiana con advertencia es más honesta que un cálculo de cuenca aproximado.
- **Trabajo pendiente:** incorporar una red fluvial con dirección de flujo (p. ej. HydroRIVERS) para clasificar cada comunidad como aguas arriba o aguas abajo de cada zona.

### 6. Datos de demostración aislados y señalizados

- **Decisión:** los reportes semilla y los testimonios son ficticios, viven en archivos dedicados (`backend/app/seed_data.py`, `web-investigador/src/data/`) y la interfaz los marca como demostración.
- **Motivo:** permiten evaluar el flujo de reportes sin datos reales de comunidades, y se reemplazan sin tocar los componentes.

### 7. Catálogo de bioindicadores como archivo versionado

- **Decisión:** las mediciones publicadas de mercurio, los sitios de muestreo, las fuentes y la presencia de cada especie en Bolivia viven en `backend/app/data/bioindicadores.json`. El backend lo valida al arrancar (cada medición debe apuntar a un taxón, sitio y fuente existentes) y lo sirve en `GET /api/v1/bioindicadores`.
- **Motivo:** son datos de referencia que cambian cuando se revisa la literatura, no con el uso de la plataforma. En git cada cambio queda revisable, y no se pierden con el reinicio de la base SQLite.
- **Modelo:** un taxón puede ser especie, género o grupo (por ejemplo "peces piscívoros del lago Puruzinho"). Cada medición guarda tejido, estadístico (media, mediana, individual o rango), dispersión, unidad, base de peso, n y fuente; no se mezclan varios tejidos en un valor.

### 8. Bioindicadores potenciales por parentesco

- **Decisión:** las especies que viven en Bolivia sin mediciones propias se vinculan con el taxón medido que les sirve de base (misma especie, mismo género, misma familia o mismo gremio trófico). La web las muestra como candidatas para investigación y nunca atribuye a Bolivia un valor medido en otro país.
- **Ampliación por familia:** para cada familia (o género, en plantas e insectos) con mediciones, se agregaron las especies con más registros de GBIF en Beni y Pando. Su dieta se anota como información general por confirmar.
- **Solidez de la base:** alta si es la misma especie medida en la cuenca del Madeira; baja si es un pariente de familia medido lejos. Baja un nivel cuando una especie es depredadora y la otra no, porque el mercurio se biomagnifica en la cadena trófica.
- **Motivo:** en Bolivia hay pocas mediciones publicadas. Los estudios de Perú y Brasil, sobre todo de la cuenca del Madeira, que comparte ríos con Bolivia, permiten priorizar qué estudiar, con una base científica explícita.

### 9. Fundamentos citados, no generados

- **Decisión:** el "por qué" de cada bioindicador viene de una lista de fundamentos escritos a partir de los papers del corpus, cada uno con su fuente. Se asignan a las especies por reglas (grupo, familia, género, dieta) y se muestran igual en la ficha y en la propuesta de estudio.
- **Motivo:** la explicación tiene que ser verificable. Una regla explícita evita atribuir a una especie un mecanismo que su grupo no tiene.

### 10. Sección Investigación con datos por matriz

- **Decisión:** los estudios sobre mercurio en aire, agua, sedimentos, peces y cabello viven en `backend/app/data/investigacion.json`. Ahí están los estudios, los sitios con coordenadas, las mediciones (valor, rango, dispersión, unidad, base de peso, n, año y periodo) y los valores de referencia. Se sirven en `GET /api/v1/investigacion`, que valida que cada medición apunte a un estudio y un sitio existentes.
- **Unidades:** cada matriz tiene una sola unidad para comparar: ng/m³ en aire, ng/L en agua, µg/g en peso seco en sedimentos y µg/g en peso húmedo en peces. Las mediciones en peso seco de peces y el metilmercurio aparecen en la tabla y en las notas, pero no en los gráficos de Hg total.
- **Trazabilidad:** cada estudio indica cómo se obtuvieron sus valores. Pueden venir del texto completo, del resumen publicado o de la hoja de centralización del equipo; estos últimos tienen el DOI verificado, pero falta cotejar el valor con el artículo. Los sitios sin coordenadas en el artículo se marcan como aproximados y en el mapa se dibujan con borde punteado.
- **Gráficos propios en SVG:** evitan sumar una librería de gráficos. Las escalas son logarítmicas cuando los valores abarcan varios órdenes de magnitud, como en agua y sedimentos.

### 11. Proyectos en la base de datos, con costos trazables

- **Decisión:** los proyectos de investigación viven en la tabla `proyectos` (contenido validado por Pydantic y guardado como JSON, con la comunidad como columna), no en un archivo del repositorio.
- **Motivo:** a diferencia del catálogo y de los estudios, cambian con el uso: estado, financiadores, cantidades y costos.
- **Costos:** cada actividad tiene un costo cotizado o, en su defecto, una estimación `referencial` (con fuente pública) o un `supuesto` (sin fuente). La interfaz separa los tres montos para que un presupuesto nunca presente una estimación como cotización.
- **Financiadores:** un financiador es `potencial` salvo que exista convenio o carta; solo entonces se registra como `confirmado`, con su monto comprometido.
- **Por qué aquí:** la justificación de cada proyecto no se guarda; se calcula al mostrarla con los datos vigentes del atlas.

## Stack

| Módulo | Tecnología | Motivo |
| --- | --- | --- |
| API | Python, FastAPI, Pydantic | Validación de esquemas, documentación OpenAPI automática, ecosistema geoespacial de Python. |
| Base de datos | SQLite (prototipo) | Sin infraestructura adicional. La migración prevista es PostgreSQL con PostGIS para consultas espaciales. |
| Frontend | React, TypeScript, Vite, Tailwind CSS | Desarrollo rápido con tipado estricto. |
| Mapas | Leaflet, react-leaflet | Ligero, con renderizado en canvas suficiente para miles de celdas. |
| Despliegue | Vercel (frontend), Render (API) | Planes gratuitos adecuados para una demostración. |
