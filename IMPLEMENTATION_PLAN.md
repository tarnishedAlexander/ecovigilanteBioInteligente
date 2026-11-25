# Plan de Implementación Progresiva: EcoVigilante

Este plan está dividido en tareas secuenciales. Siguiendo la estrategia acordada, **priorizamos primero el Backend y la Web del Investigador**, ya que permiten validar visualmente todo el concepto en pantalla de computadora de inmediato sin la fricción de compilación móvil inicial.

---

## Fase 1: Backend Central y Datos Geoespaciales de Bolivia
> **Objetivo:** Tener la API lista con la base de datos, los modelos relacionales y datos geográficos base de la Amazonía boliviana (Riberalta, Río Beni, Madre de Dios).

* [ ] **Tarea 1: Inicialización del Backend (FastAPI + SQLite/GeoJSON)**
  * Configurar entorno Python (`backend/`).
  * Crear modelos de datos: `Comunidades`, `Reportes`, `Bioindicadores`, `EntrevistasIA`.
  * Poblar datos semilla (seed data) realistas: cuencas del norte amazónico (Riberalta, Cachuela Esperanza, Rurrenabaque), especies bioindicadoras (*Pseudoplatystoma*, *Zungaro zungaro*) y reportes simulados con síntomas de mercurio.
  * Endpoints REST para servir mapa, capas y actualización de estados (`crudo` -> `semiverificado`).
  * **Hito / Feedback:** Servidor levantado respondiendo datos geográficos y reportes en formato GeoJSON.

---

## Fase 2: Plataforma Web del Investigador (Dashboard SIG)
> **Objetivo:** Construir la interfaz de escritorio tal como se diseñó en la Pizarra 2, donde el investigador explora el mapa, revisa las denuncias en crudo y pondera el riesgo.

* [ ] **Tarea 2: Scaffolding de la Web del Investigador (React + Vite + TailwindCSS)**
  * Configurar el proyecto web en `web-investigador/`.
  * Diseñar el layout responsivo de escritorio: Barra superior de autenticación/investigador, panel lateral de análisis a la izquierda y contenedor de mapa a la derecha.
  * **Hito / Feedback:** Interfaz base visual montada y funcional en navegador.

* [ ] **Tarea 3: Mapa SIG Interactivo de Cuencas y Comunidades (Leaflet)**
  * Montar mapa centrado en el norte amazónico de Bolivia.
  * Capa de ríos y afluentes.
  * Capa de comunidades ribereñas.
  * Marcadores de reportes ciudadanos con código de colores según estado (Rojo: Crudo, Amarillo: Semiverificado, Verde: Verificado).
  * Selector de capas y filtros por fecha/tipo de bioindicador.
  * **Hito / Feedback:** Navegación en el mapa con marcadores interactivos conectados a la API.

* [ ] **Tarea 4: Panel Lateral de Detalle, Evidencias e IA**
  * Al hacer clic en un reporte o comunidad:
    * Vista de fotos de peces/plantas/agua subidas por comunarios.
    * Gráfico / Resumen de los síntomas clínicos extraídos por Gemma.
    * Ficha de bioindicadores de la zona (nivel de bioacumulación de especies locales).
    * Botón de acción: `[Ponderar / Marcar como Semiverificado]` que actualiza la API en tiempo real.
  * **Hito / Feedback:** Flujo completo de revisión del investigador probado de extremo a extremo en la web.

---

## Fase 3: Motor de Ingesta y Lógica de Extracción de Gemma
> **Objetivo:** Dejar completamente estandarizado el procesamiento de las entrevistas y reportes anónimos.

* [ ] **Tarea 5: Pipeline de Ingesta y Parser Estructurado de Gemma**
  * Endpoint `POST /api/reportes/sync` para recibir paquetes de la app móvil (fotos, GPS y JSON de la entrevista).
  * Validaciones de integridad y cálculo del score preliminar de sospecha.
  * Servicio de simulación/test del prompt de Gemma para pruebas en terminal.
  * **Hito / Feedback:** Prueba de envío de reporte y reflejo instantáneo en el mapa web.

---

## Fase 4: Aplicación Móvil del Comunario (Offline-First)
> **Objetivo:** Construir la app móvil ligera y sin login para el comunario.

* [ ] **Tarea 6: Interfaz Móvil y Captura Local (Offline)**
  * Pantalla inicial con accesos gigantes: "Reportar Hallazgo (Cámara/GPS)" y "Hablar con el Asistente".
  * Almacenamiento local en SQLite de los reportes cuando no hay red.
  * Detector de conexión para sincronización automática en segundo plano hacia la API.
  * **Hito / Feedback:** App registrando eventos offline y guardándolos en base local.

* [ ] **Tarea 7: Integración del Chat Asistente con Gemma Local**
  * Interfaz de conversación empática para el comunario.
  * Integración del modelo Gemma 2B en el dispositivo (MediaPipe / LiteRT) o fallback de desarrollo.
  * Generación y guardado del payload JSON con los síntomas detectados.
  * **Hito / Feedback:** Conversación con la IA en el teléfono generando el reporte estructurado.

---

## Fase 5: Pruebas Integrales y Documentación del Prototipo
* [ ] **Tarea 8: Demostración Integral End-to-End**
  * Prueba de simulación completa: Comunario sin internet en Riberalta reporta -> sincroniza al conectarse -> Investigador lo ve en su PC, analiza la cuenca y valida el caso.
  * Manual de ejecución rápida (`README.md`) para levantar todo en minutos para demostraciones.
