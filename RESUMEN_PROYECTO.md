# EcoVigilante: Sistema de Alerta Temprana y Monitoreo de Mercurio en Cuencas de Bolivia

## 1. Contexto y Problema

En Bolivia, la minería aurífera aluvial y de veta (tanto en cooperativas registradas como en operaciones no reguladas) utiliza activamente **mercurio elemental** para la amalgamación del oro. Este proceso genera vertidos directos e indirectos a las redes fluviales amazónicas y subandinas (ríos Beni, Madre de Dios, Kaka, Mapiri, Mamoré).

### Puntos Críticos del Problema:
1. **Bioacumulación y Biomagnificación:** El mercurio inorgánico vertido se transforma en **metilmercurio** en los sedimentos de los ríos. Esta neurotoxina asciende en la cadena alimenticia acuática: los peces piscívoros y carnívoros de fondo (*Surubí*, *Muturo*, *Bagre*) concentran dosis críticas que son consumidas a diario por pueblos indígenas y comunidades ribereñas (Esse Ejja, Tsimane', Tacana, etc.).
2. **Brecha de Información para la Ciencia:** Las expediciones toxicológicas son costosas, esporádicas y logísticamente complejas. Científicos y epidemiólogos a menudo carecen de datos actualizados en tiempo real y trabajan "a ciegas".
3. **Incertidumbre Geográfica:** Para el Estado y la academia, la ubicación exacta y dinámica de las balsas y dragas mineras en los afluentes es difícil de rastrear debido a su constante desplazamiento.

---

## 2. La Propuesta de Valor: "Sensores Biológicos Inversos"

En lugar de intentar vigilar manualmente miles de kilómetros de selva y ríos, **EcoVigilante** convierte a las comunidades y sus observaciones en **sensores biológicos distribuidos**:

> *"Si en una comunidad ribereña los pescadores reportan anomalías en peces carnívoros y los comunarios manifiestan síntomas neurológicos compatibles con hidrargirismo, esa información delata que aguas arriba existe actividad minera activa con vertidos de mercurio."*

---

## 3. Arquitectura del Sistema (2 Frentes Especializados)

El proyecto se diseñó bajo la **Opción B: Dos experiencias frontend desacopladas que comparten un único núcleo de datos y API**.

```
                           ┌────────────────────────────────────────┐
                           │      COMUNARIO (Móvil en Terreno)      │
                           │  - 100% Anónimo (Sin login/registro)   │
                           │  - Captura foto + GPS offline          │
                           │  - Asistente Gemma 2B local            │
                           └──────────────────┬─────────────────────┘
                                              │ Sincronización al haber red
                                              ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                         BACKEND CENTRAL & API (FastAPI)                          │
 │  - Base de datos relacional y geoespacial (SQLite / PostGIS)                    │
 │  - Catastro hidrográfico: Cuencas de ríos Beni, Madre de Dios, Kaka, Mamoré      │
 │  - Catálogo de bioindicadores y cálculo de scores de sospecha                    │
 └────────────────────────────────────┬─────────────────────────────────────────────┘
                                      │ Consulta de capas y triaje
                                      ▼
                           ┌────────────────────────────────────────┐
                           │     INVESTIGADOR (Web de Escritorio)   │
                           │  - Google Earth (Satélite, Relieve)    │
                           │  - Trazado de ríos aguas arriba        │
                           │  - Ficha clínica extraída por IA       │
                           │  - Ponderación: Crudo -> Semiverificado│
                           └────────────────────────────────────────┘
```

---

## 4. Descripción de los Dos Módulos

### A. La App Móvil (El Comunario)
* **Acceso Anónimo Garantizado:** Cero registro, sin correos ni contraseñas, para proteger al comunario frente a riesgos de represalias en zonas de conflicto minero.
* **Captura de Indicios:** Reporte fotográfico rápido de peces con lesiones, agua turbia o vegetación marchita, asociando coordenadas GPS de manera automática.
* **Edge AI con Gemma Local (Offline):**
  * Modelo de lenguaje (Gemma 2B cuantizado) corriendo directamente en el teléfono sin requerir señal de internet.
  * **Rol:** Actúa como entrevistador empático. Hace preguntas sencillas sobre hábitos de consumo de pescado del río y síntomas físicos (temblores de manos, adormecimiento de extremidades, dolores de cabeza crónicos, fatiga).
  * **Regla estricta:** No da diagnósticos médicos directos; extrae silenciosamente un objeto estructurado `JSON` con los factores de riesgo.
* **Persistencia Offline:** Almacenamiento local en SQLite que se sincroniza automáticamente en segundo plano cuando el teléfono ingresa a una zona con cobertura (ej. Riberalta o puntos Wi-Fi).

### B. El Dashboard Web SIG (El Investigador)
* **Navegación Geoespacial de Alta Densidad:**
  * Integración con **Google Earth Satélite Híbrido, Satélite Puro y Relieve Topográfico 3D**.
  * Capa vectorial de los ríos auríferos del norte boliviano (Río Beni, Madre de Dios, Kaka, Mapiri, Mamoré).
  * Marcadores con alerta visual según estado del reporte:
    * 🔴 **En Crudo:** Reportes directos de la ciudadanía.
    * 🟡 **Semiverificado:** Casos con coherencia sintomatológica e hidrográfica.
    * 🟢 **Verificado Lab:** Casos confirmados con muestras biológicas de cabello o agua.
* **Herramienta "Trazado Aguas Arriba":** Resalta la red del río hacia atrás para indicar a los científicos dónde buscar el origen del vertido.
* **Panel Lateral Analítico:**
  * Visualización de fotos subidas por los comunarios.
  * Desglose del análisis de Gemma: frecuencia de dieta piscívora, checklist de signos clínicos y transcripción de voz a texto.
  * Catálogo de **Bioindicadores locales**:
    * *Surubí (Pseudoplatystoma fasciatum)*: Carnívoro tope, acumulación crítica (hasta 4 ppm de Hg).
    * *Muturo (Zungaro zungaro)*: Predador longevo, bioacumulación crítica.
    * *Sábalo (Prochilodus nigricans)*: Detritívoro, control biológico de baja bioacumulación.
    * *Tarope (Eichhornia crassipes)*: Macrófita bioacumuladora de metales pesados en agua.
  * **Acción de Ponderación:** Botón para cambiar el estado del reporte a *Semiverificado* o *Verificado*, guardando notas de campo directamente en la base de datos central.

---

## 5. Ciclo de Vida de los Datos

```
[Reporte Móvil] ──► [Estado: En Crudo] ──► [Filtro Heurístico / IA] ──► [Semiverificado] ──► [Validación Muestreo Lab] ──► [Verificado]
```

1. **En Crudo:** Información cruda recolectada por el comunario y pre-procesada por Gemma.
2. **Semiverificado:** Reporte evaluado por el investigador o el algoritmo que cumple criterios de cercanía a cuenca y síntomas neurológicos sospechosos.
3. **Verificado:** Reporte contrastado con análisis toxicológicos de laboratorio (ej. espectrometría de absorción atómica en muestras de cabello de la UMSA/UAB).

---

## 6. Estado Actual del Desarrollo

| Componente | Estado | Detalles Técnicos |
| :--- | :---: | :--- |
| **Backend API** | ✅ Completado | FastAPI con SQLite, endpoints GeoJSON, modelos relacionales y datos semilla de cuencas de Bolivia. |
| **Datos Semilla** | ✅ Completado | 8 comunidades clave (Riberalta, Cachuela Esperanza, Guanay, Teoponte, etc.), 4 cuencas de ríos y 5 bioindicadores. |
| **Dashboard Web** | ✅ Completado | React + Vite + TailwindCSS + Leaflet con capas satelitales de Google Earth en vivo en `http://localhost:5173`. |
| **Integración Google Earth** | ✅ Completado | 3 capas satelitales fotorrealistas sin necesidad de API keys. |
| **App Móvil Comunario** | ⏳ Siguiente Fase | Estructura en Flutter/React Native, SQLite local y empaquetado del runtime de Gemma. |
| **Pipeline de Gemma** | ⏳ Siguiente Fase | Pruebas formales de extracción estructurada del LLM. |

---

## 7. Instrucciones para Ejecutar el Prototipo

### Requisitos Previos
* Python 3.10+
* Node.js v18+ y npm

### 1. Iniciar el Backend (API)
```bash
cd backend
./run.sh
# El servidor levantará en http://localhost:8000
# Documentación Swagger en http://localhost:8000/docs
```

### 2. Iniciar el Dashboard Web (Investigador)
```bash
cd web-investigador
npm run dev
# Abrir en el navegador: http://localhost:5173
```

### 3. Iniciar la App Móvil del Comunario (EcoGuardián)
```bash
cd app-comunario
npm run dev
# Abrir en el navegador (vista smartphone): http://localhost:5175
```
