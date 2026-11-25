# Plan de Implementación Progresiva: EcoVigilante

Este plan está dividido en tareas secuenciales. Siguiendo la estrategia acordada, **priorizamos primero el Backend y la Web del Investigador**, ya que permiten validar visualmente todo el concepto en pantalla de computadora de inmediato sin la fricción de compilación móvil inicial.

---

## Fase 1: Backend Central y Datos Geoespaciales de Bolivia
> **Objetivo:** Tener la API lista con la base de datos, los modelos relacionales y datos geográficos base de la Amazonía boliviana (Riberalta, Río Beni, Madre de Dios).

* [x] **Tarea 1: Inicialización del Backend (FastAPI + SQLite/GeoJSON)** - *COMPLETADA*
  * Configurado entorno Python con FastAPI y Pydantic en `backend/`.
  * Modelos de datos: `Comunidades`, `Reportes`, `Bioindicadores`, `EntrevistasIA`.
  * Base de datos SQLite inicializada y sembrada con datos de cuencas de Bolivia (Riberalta, Cachuela Esperanza, Río Beni, Madre de Dios, Mamoré, Kaka/Mapiri).
  * Catálogo de bioindicadores clave (*Surubí*, *Muturo*, *Sábalo*, *Tarope*, *Piraña*) con niveles de bioacumulación de mercurio.
  * Endpoints REST funcionando: `/api/v1/rios`, `/api/v1/comunidades`, `/api/v1/bioindicadores`, `/api/v1/reportes`, `/api/v1/metricas` y actualización de estado.

---

## Fase 2: Plataforma Web del Investigador (Dashboard SIG)
> **Objetivo:** Construir la interfaz de escritorio tal como se diseñó en la Pizarra 2, donde el investigador explora el mapa, revisa las denuncias en crudo y pondera el riesgo.

* [x] **Tarea 2: Scaffolding de la Web del Investigador (React + Vite + TailwindCSS)** - *COMPLETADA*
  * Configurado proyecto web con React, TypeScript, TailwindCSS y Lucide en `web-investigador/`.
  * Paleta visual inspirada en la Amazonía (tonos esmeralda, verdes bosque, azul río y acentos ámbar/rojo de alerta).
  * Header con métricas vivas (Total, En Crudo, Semiverificados, Verificados) e insignia de investigador.

* [x] **Tarea 3: Mapa SIG Interactivo de Cuencas y Comunidades (Leaflet)** - *COMPLETADA*
  * Mapa centrado en el norte amazónico de Bolivia con soporte multi-capa.
  * Trazados vectoriales de ríos auríferos (Río Beni, Madre de Dios, Mamoré, Kaka/Mapiri).
  * Marcadores con efecto pulso CSS para alertas en crudo (rojo), semiverificado (ámbar) y verificado (verde).
  * Selector de mapa base: Modo Noche / Modo Satelital (simulando Google Earth) y conmutador de Trazado Aguas Arriba.

* [x] **Tarea 4: Panel Lateral de Detalle, Evidencias e IA** - *COMPLETADA*
  * Pestañas interactivas: *Denuncias*, *Comunidades* y *Bioindicadores*.
  * Ficha expandida con fotos de evidencia, transcripción de comunarios y análisis clínico-dietético de **Gemma 2B**.
  * Acciones de ponderación: Botones para cambiar estado a *Semiverificado* o *Verificado Lab* con actualización en la API en tiempo real.

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
