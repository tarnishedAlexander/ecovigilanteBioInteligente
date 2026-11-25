# EcoVigilante 🌿💧

Plataforma de Alerta Temprana, Detección de Mercurio y Monitoreo de Cuencas Hidrográficas en Bolivia.

> **Idea Central:** Transformar las observaciones y síntomas de las comunidades ribereñas en *sensores biológicos inversos* para detectar e investigar zonas de contaminación por minería de oro aguas arriba en la Amazonía boliviana.

---

## 📚 Documentación del Proyecto

* **[RESUMEN_PROYECTO.md](./RESUMEN_PROYECTO.md):** Resumen ejecutivo completo del problema, propuesta de valor, perfiles de usuario, arquitectura y manual de uso.
* **[ARCHITECTURE_AND_DECISIONS.md](./ARCHITECTURE_AND_DECISIONS.md):** Registro formal de decisiones de diseño (ADRs), justificación técnica de la separación Web/Móvil, Edge AI con Gemma y análisis hidrológico.
* **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md):** Plan de trabajo secuencial paso a paso con el seguimiento de tareas completadas y pendientes.

---

## 🚀 Inicio Rápido (Prototipo en Vivo)

### 1. Backend (FastAPI + SQLite + GeoJSON)
```bash
cd backend
./run.sh
# API disponible en http://localhost:8000
# Documentación interactiva en http://localhost:8000/docs
```

### 2. Frontend del Investigador (React + Vite + Leaflet + Google Earth)
```bash
cd web-investigador
npm run dev
# Dashboard disponible en http://localhost:5173
```

---

## 🗺️ Mapa de Cuencas y Datos Semilla
El sistema cuenta con datos precargados de la cuenca amazónica y subandina de Bolivia:
* **Ríos:** Río Beni, Río Madre de Dios, Río Kaka / Mapiri, Río Mamoré.
* **Comunidades:** Riberalta, Cachuela Esperanza, Guanay, Teoponte, Rurrenabaque, San Buenaventura, Puerto Rico, Guayaramerín.
* **Bioindicadores:** Surubí (*Pseudoplatystoma fasciatum*), Muturo (*Zungaro zungaro*), Sábalo (*Prochilodus nigricans*), Tarope (*Eichhornia crassipes*), Piraña Cariba (*Pygocentrus nattereri*).
