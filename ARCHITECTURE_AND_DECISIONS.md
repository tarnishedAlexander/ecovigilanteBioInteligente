# EcoVigilante: Monitoreo Comunitario y Detección de Mercurio en Cuencas Mineras de Bolivia

## 1. Contexto y Problemática

En Bolivia, la minería aurífera (tanto legal como no regulada / ilegal) utiliza activamente mercurio elemental para el proceso de amalgamación de oro en cuencas amazónicas y subandinas (ej. ríos Beni, Madre de Dios, Mapiri, Kaka, Tuichi).

### Los Problemas Clave
1. **Contaminación y Bioacumulación:** El mercurio vertido a los ríos se metila en sedimentos convirtiéndose en metilmercurio, la forma más neurotóxica. Este asciende rápidamente por la cadena trófica mediante peces piscívoros/carnívoros (surubí, bagre, zúngara), base de la alimentación de comunidades ribereñas e indígenas (Esse Ejja, Tsimane', Tacana, Lecos).
2. **Brecha Crítica de Información:** Los investigadores, biólogos y epidemiólogos no cuentan con datos oportunos en tiempo real de campo. Trabajan "a ciegas" por la lejanía geográfica y el costo de expediciones científicas.
3. **Especulación sobre Ubicación Minera:** La ubicación real de operaciones mineras y dragas aluviales en constante movimiento es incierta para el Estado y la academia.

---

## 2. Decisión de Diseño: El Enfoque del Proyecto

En lugar de depender exclusivamente de catastros mineros estáticos, se propone un enfoque de **sensores biológicos y ciencia ciudadana inversa**:
> *"Si una comunidad ribereña registra síntomas neurológicos atípicos, malformaciones o anomalías en peces, la comunidad misma actúa como indicio sensor de que aguas arriba existe actividad minera activa."*

---

## 3. Registro de Decisiones de Arquitectura (ADR)

### Decisión 1: Separación de Experiencias (Opción B: Móvil para Comunario + Web para Investigador)
* **Decisión:** Desarrollar dos interfaces especializadas conectadas a un mismo Backend y Base de Datos unificada.
* **Por qué se tomó:**
  * **Comunarios:** Están en territorio, necesitan interfaz simple, cero texto complejo, captura fotográfica con GPS rápido y soporte **100% offline**.
  * **Investigadores:** Necesitan pantallas grandes (laptop/PC) para analizar mapas de información densa: capas de ríos, trazado de cuencas aguas arriba, fotos satelitales multitemporales (Google Earth / Sentinel) y gráficos de concentración. Obligarlos a usar un teléfono arruinaría la experiencia analítica.
* **Alternativa descartada:** Unificar todo en una sola aplicación móvil. Hubiera sacrificado la potencia del análisis SIG de escritorio.

---

### Decisión 2: Privacidad y Acceso Anónimo para Comunarios
* **Decisión:** La app comunaria **no requiere login ni registro de cuenta**.
* **Por qué se tomó:**
  * Denunciar minería ilegal o problemas ambientales acarrea riesgos serios de represalias en zonas conflictivas.
  * Elimina la fricción de uso (no pedir correos ni contraseñas que en zonas rurales causan abandono).
  * Los reportes se identifican solo por coordenadas GPS, fecha y metadatos técnicos.

---

### Decisión 3: Uso de Edge AI (Gemma Local) como Entrevistador Clínico-Ambiental
* **Decisión:** Ejecutar un modelo de lenguaje local (Gemma 2B) en el dispositivo del comunario.
* **Por qué se tomó:**
  * Funciona en zonas remotas sin señal de internet.
  * **Comportamiento clave:** No emite diagnósticos médicos (no dice *"tienes hidrargirismo/Minamata"*). Actúa como un encuestador empático que indaga hábitos de consumo de pescado, síntomas neurológicos/motores e indicios del agua/fauna, extrayendo silenciosamente un **JSON estructurado**.

---

### Decisión 4: Análisis Hidrográfico (Topología de Río vs. Distancia en Línea Recta)
* **Decisión:** El motor espacial evaluará la proximidad mediante **conectividad de cuencas aguas abajo y aguas arriba**, no con simples círculos euclidianos (radios de 25 km).
* **Por qué se tomó:**
  * El mercurio viaja con la corriente fluvial. Comunidades a 10 km aguas arriba de una minera no sufren el vertido de ese afluente; comunidades a 50 km aguas abajo sí.

---

### Decisión 5: Ciclo de Vida de los Datos (Filtrado Progresivo)
* **Decisión:** Los datos pasan por tres estados:
  1. `En Crudo`: Datos reportados directamente por comunarios con el pre-procesamiento del LLM.
  2. `Semiverificado`: Reportes que cumplen umbrales de consistencia geográfica y sintomatológica (alerta para científicos).
  3. `Verificado / Muestreado`: Casos validados por investigadores tras tomas de muestra biológica (cabello, sangre, agua).

---

## 4. Stack Tecnológico Elegido

| Módulo | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Backend API** | Python (FastAPI) | Rápido, tipado estricto, nativo para manejo de datos geoespaciales y payloads JSON de IA. |
| **Base de Datos** | SQLite (Prototipo) / PostgreSQL + PostGIS (Producción) | Almacenamiento geoespacial relacional de coordenadas, ríos y comunidades. |
| **Web Investigador** | React + Vite + TailwindCSS + Leaflet / Mapbox | Mapas fluidos, interactividad visual de alta densidad, ligero de levantar y probar. |
| **App Comunario** | Flutter (o React Native / Expo) | Soporte nativo para cámara, GPS, SQLite local y sincronización en segundo plano. |
| **Motor LLM Local** | Google MediaPipe LLM Inference / LiteRT (Gemma 2B) | Inferencia optimizada para chips móviles sin requerir conexión de red. |
