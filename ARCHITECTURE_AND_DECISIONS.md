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

- **Decisión:** los estudios de campo, testimonios y reportes semilla son ficticios, viven en archivos dedicados (`web-investigador/src/data/`, `backend/app/seed_data.py`) y la interfaz los marca como datos de demostración.
- **Motivo:** permiten evaluar la plataforma sin presentar como mediciones valores que no lo son, y se pueden reemplazar por datos reales sin tocar los componentes.

## Stack

| Módulo | Tecnología | Motivo |
| --- | --- | --- |
| API | Python, FastAPI, Pydantic | Validación de esquemas, documentación OpenAPI automática, ecosistema geoespacial de Python. |
| Base de datos | SQLite (prototipo) | Sin infraestructura adicional. La migración prevista es PostgreSQL con PostGIS para consultas espaciales. |
| Frontend | React, TypeScript, Vite, Tailwind CSS | Desarrollo rápido con tipado estricto. |
| Mapas | Leaflet, react-leaflet | Ligero, con renderizado en canvas suficiente para miles de celdas. |
| Despliegue | Vercel (frontend), Render (API) | Planes gratuitos adecuados para una demostración. |
