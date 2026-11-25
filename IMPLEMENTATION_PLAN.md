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

* [x] **Tarea 5: Pipeline de Ingesta y Parser Estructurado de Gemma** - *COMPLETADA*
  * Diseñado el System Prompt de **Gemma 2B** (`EcoGuardián`) con directrices estrictas de empatía, escucha activa y prohibición de emitir diagnósticos médicos directos.
  * Parser semántico con normalización fonética y de acentos para extraer especies de peces consumidas, checklist de signos neurológicos de hidrargirismo y cálculo calibrado de score de sospecha (1 a 5).
  * Endpoint `POST /api/v1/reportes` con geocodificación inversa automática (distancia Haversine a la comunidad y cuenca más cercana).
  * Batería de pruebas automatizadas en `backend/test_gemma_pipeline.py` validando con éxito los casos de alto y bajo riesgo y la actualización en vivo de las métricas.

---

## Fase 4: Aplicación Móvil del Comunario (Offline-First)
> **Objetivo:** Construir la app móvil ligera y sin login para el comunario.

* [x] **Tarea 6: Interfaz Móvil y Captura Local (Offline)** - *COMPLETADA*
  * Desarrollada la aplicación móvil en `app-comunario/` con diseño para smartphone (touch-friendly, cero login y acceso anónimo).
  * Módulo de captura visual con selector de categorías (Pez, Agua, Planta, Dragas), carga de evidencia fotográfica y geolocalización GPS.
  * Persistencia offline en el teléfono: guarda los reportes en almacenamiento local con indicador de cola pendiente cuando se está en el río sin cobertura.
  * Switch simulador de conectividad: permite alternar entre "Sin Red (Río Madre de Dios)" y "Conectado (Riberalta)" con sincronizador en segundo plano.

* [x] **Tarea 7: Integración del Chat Asistente con Gemma Local** - *COMPLETADA*
  * Pantalla de conversación empática y guiada por el System Prompt de **Gemma 2B** (`EcoGuardián`).
  * Sugerencias de diálogo rápido para probar síntomas clínicos de mercurio (temblores, adormecimiento, frecuencia de consumo de surubí/muturo).
  * Extracción del diálogo y compilación automática en reporte local con posterior sincronización a la API central y visualización inmediata en el dashboard web.

---

## Fase 5: Pruebas Integrales y Documentación del Prototipo
* [ ] **Tarea 8: Demostración Integral End-to-End**
  * Prueba de simulación completa: Comunario sin internet en Riberalta reporta -> sincroniza al conectarse -> Investigador lo ve en su PC, analiza la cuenca y valida el caso.
  * Manual de ejecución rápida (`README.md`) para levantar todo en minutos para demostraciones.
