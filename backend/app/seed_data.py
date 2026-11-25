import json

# GeoJSON con trazos reales simplificados de las cuencas de los ríos auríferos del norte boliviano
RIOS_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "id": "rio-madre-de-dios",
                "nombre": "Río Madre de Dios",
                "cuenca": "Amazonas / Madeira",
                "color": "#0ea5e9",
                "grosor": 4,
                "riesgo_minero": "Muy Alto (Balsas aluviales y dragas activas)",
                "descripcion": "Nace en Perú, cruza Pando y desemboca en Riberalta uniéndose al Río Beni. Ruta crítica de transporte de metilmercurio."
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-69.18, -12.59],
                    [-68.75, -12.30],
                    [-68.10, -11.90],
                    [-67.55, -11.60],
                    [-67.10, -11.35],
                    [-66.50, -11.15],
                    [-66.0825, -11.0065] # Riberalta (Confluencia con Río Beni)
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "rio-beni",
                "nombre": "Río Beni",
                "cuenca": "Amazonas / Madeira",
                "color": "#10b981",
                "grosor": 4,
                "riesgo_minero": "Crítico (Recibe aportes de Kaka, Mapiri y Tipuani)",
                "descripcion": "Fluye desde los Yungas y norte de La Paz hacia el norte, cruzando Rurrenabaque y llegando a Riberalta y Cachuela Esperanza."
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-67.7110, -15.4950], # Teoponte
                    [-67.65, -15.10],
                    [-67.5278, -14.4417], # Rurrenabaque
                    [-67.30, -13.80],
                    [-66.90, -12.80],
                    [-66.40, -11.80],
                    [-66.0825, -11.0065], # Riberalta
                    [-65.5833, -10.5333]  # Cachuela Esperanza
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "rio-kaka-mapiri",
                "nombre": "Río Kaka / Mapiri (Cuenca Alta)",
                "cuenca": "Alta Cuenca del Beni",
                "color": "#f59e0b",
                "grosor": 3,
                "riesgo_minero": "Extremo (Epicentro minero aurífero mecanizado)",
                "descripcion": "Cuencas de montaña y pie de monte donde se ubican las mayores cooperativas auríferas de La Paz con uso intensivo de mercurio."
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-68.15, -15.75], # Mapiri
                    [-67.8797, -15.4981], # Guanay
                    [-67.7110, -15.4950], # Teoponte
                    [-67.55, -15.20] # Confluencia con el Beni
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "rio-mamore",
                "nombre": "Río Mamoré",
                "cuenca": "Amazonas / Madeira",
                "color": "#3b82f6",
                "grosor": 3,
                "riesgo_minero": "Medio-Alto",
                "descripcion": "Eje fluvial principal del departamento de Beni, se une con el Río Beni en Guayaramerín para formar el Río Madeira."
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-64.90, -14.80], # Trinidad
                    [-65.10, -13.50],
                    [-65.30, -12.00],
                    [-65.35, -10.80], # Guayaramerín
                    [-65.40, -10.35]  # Villa Bella
                ]
            }
        }
    ]
}

COMUNIDADES_DATA = [
    {
        "id": "com-riberalta",
        "nombre": "Riberalta",
        "departamento": "Beni",
        "cuenca_principal": "Confluencia Río Beni y Madre de Dios",
        "latitud": -11.0065,
        "longitud": -66.0825,
        "poblacion_estimada": 95000,
        "posible_fuente_minera_aguas_arriba": "Dragas en Río Madre de Dios y vertidos del Alto Beni",
        "alerta_nivel": "Alto"
    },
    {
        "id": "com-cachuela",
        "nombre": "Cachuela Esperanza",
        "departamento": "Beni",
        "cuenca_principal": "Bajo Río Beni",
        "latitud": -10.5333,
        "longitud": -65.5833,
        "poblacion_estimada": 1800,
        "posible_fuente_minera_aguas_arriba": "Arrastre acumulado de metilmercurio aguas abajo de Riberalta",
        "alerta_nivel": "Critico"
    },
    {
        "id": "com-rurre",
        "nombre": "Rurrenabaque",
        "departamento": "Beni",
        "cuenca_principal": "Medio Río Beni",
        "latitud": -14.4417,
        "longitud": -67.5278,
        "poblacion_estimada": 19000,
        "posible_fuente_minera_aguas_arriba": "Afluentes Kaka, Mapiri y Tipuani",
        "alerta_nivel": "Medio"
    },
    {
        "id": "com-san-buenaventura",
        "nombre": "San Buenaventura",
        "departamento": "La Paz",
        "cuenca_principal": "Río Beni (Margen Izquierda)",
        "latitud": -14.4389,
        "longitud": -67.5417,
        "poblacion_estimada": 9000,
        "posible_fuente_minera_aguas_arriba": "Cuencas auríferas del Parque Madidi y Alto Beni",
        "alerta_nivel": "Medio"
    },
    {
        "id": "com-puerto-rico",
        "nombre": "Puerto Rico",
        "departamento": "Pando",
        "cuenca_principal": "Río Manuripi / Madre de Dios",
        "latitud": -11.1039,
        "longitud": -67.5531,
        "poblacion_estimada": 4500,
        "posible_fuente_minera_aguas_arriba": "Actividad aluvial flotante en la frontera amazónica",
        "alerta_nivel": "Alto"
    },
    {
        "id": "com-guanay",
        "nombre": "Guanay",
        "departamento": "La Paz",
        "cuenca_principal": "Río Mapiri / Tipuani",
        "latitud": -15.4981,
        "longitud": -67.8797,
        "poblacion_estimada": 14000,
        "posible_fuente_minera_aguas_arriba": "Zona de origen: Minería mecanizada aurífera directa",
        "alerta_nivel": "Critico"
    },
    {
        "id": "com-teoponte",
        "nombre": "Teoponte",
        "departamento": "La Paz",
        "cuenca_principal": "Río Kaka",
        "latitud": -15.4950,
        "longitud": -67.7110,
        "poblacion_estimada": 8500,
        "posible_fuente_minera_aguas_arriba": "Zona de origen: Dragas de succión e hidrocarburos/mercurio",
        "alerta_nivel": "Critico"
    },
    {
        "id": "com-guayaramerin",
        "nombre": "Guayaramerín",
        "departamento": "Beni",
        "cuenca_principal": "Río Mamoré",
        "latitud": -10.8258,
        "longitud": -65.3614,
        "poblacion_estimada": 42000,
        "posible_fuente_minera_aguas_arriba": "Tránsito fronterizo y pesca comercial",
        "alerta_nivel": "Bajo"
    }
]

BIOINDICADORES_DATA = [
    {
        "id": "bio-surubi",
        "nombre_comun": "Surubí / Pintado",
        "nombre_cientifico": "Pseudoplatystoma fasciatum",
        "tipo": "pez_carnivoro",
        "nivel_bioacumulacion": "Crítico",
        "factor_riesgo_salud": "Muy Alto - Pez predador tope de fondo. Concentra hasta 2.5 a 4.0 ppm de mercurio en zonas mineras.",
        "descripcion_ecologica": "Pez bentónico piscívoro de gran tamaño. Acumula metilmercurio a lo largo de 10 a 15 años de vida consumiendo otros peces.",
        "especies_similares": ["Pseudoplatystoma tigrinum", "Zungaro zungaro"],
        "icono": "Fish"
    },
    {
        "id": "bio-muturo",
        "nombre_comun": "Muturo / Manguruyú",
        "nombre_cientifico": "Zungaro zungaro",
        "tipo": "pez_carnivoro",
        "nivel_bioacumulacion": "Crítico",
        "factor_riesgo_salud": "Muy Alto - Especie predadora longeva con alto contenido graso en músculo donde se fija el tóxico.",
        "descripcion_ecologica": "Bagre gigante de fondo rocoso y pozas profundas. Muy apetecido por comunidades ribereñas para autoconsumo familiar.",
        "especies_similares": ["Paulicea luetkeni"],
        "icono": "Fish"
    },
    {
        "id": "bio-sabalo",
        "nombre_comun": "Sábalo Amazónico",
        "nombre_cientifico": "Prochilodus nigricans",
        "tipo": "pez_detritivoro",
        "nivel_bioacumulacion": "Bajo",
        "factor_riesgo_salud": "Bajo a Moderado - Se alimenta de fango, lodo y perifiton vegetal.",
        "descripcion_ecologica": "Especie iliófaga migratoria. Sirve como control biológico negativo: niveles bajos de metilmercurio comparado con los carnívoros.",
        "especies_similares": ["Curimata cyprinoides"],
        "icono": "FishSymbol"
    },
    {
        "id": "bio-pirana",
        "nombre_comun": "Piraña Cariba",
        "nombre_cientifico": "Pygocentrus nattereri",
        "tipo": "pez_carnivoro",
        "nivel_bioacumulacion": "Alto",
        "factor_riesgo_salud": "Alto - Dieta estrictamente carnívora / carroñera.",
        "descripcion_ecologica": "Bioindicador de remansos y lagunas laterales (várzea) donde los sedimentos finos con mercurio suelen estancarse.",
        "especies_similares": ["Serrasalmus rhombeus"],
        "icono": "Skull"
    },
    {
        "id": "bio-tarope",
        "nombre_comun": "Tarope / Jacinto de Agua",
        "nombre_cientifico": "Eichhornia crassipes",
        "tipo": "planta",
        "nivel_bioacumulacion": "Medio (Hiperacumuladora)",
        "factor_riesgo_salud": "Indicador Ambiental - Sus raíces retienen metales pesados disueltos.",
        "descripcion_ecologica": "Macrófita acuática flotante. Cuando hay alta turbidez y metales pesados presenta clorosis foliar y reducción de raíces.",
        "especies_similares": ["Pistia stratiotes"],
        "icono": "Leaf"
    }
]

REPORTES_INICIALES = [
    {
        "id": "rep-001",
        "latitud": -11.0150,
        "longitud": -66.0790,
        "categoria": "salud",
        "descripcion_usuario": "Comunario de ribera en Riberalta con hormigueo constante en dedos y mareos.",
        "url_foto": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
        "estado": "crudo",
        "score_sospecha": 4,
        "comunidad_id": "com-riberalta",
        "comunidad_nombre": "Riberalta",
        "fecha_reporte": "2026-11-20T14:30:00Z",
        "fecha_sincronizacion": "2026-11-20T18:15:00Z",
        "notas_investigador": None,
        "entrevista_ia": {
            "comunidad_mencionada": "Riberalta - Barrio Ribereño Los Tajibos",
            "frecuencia_consumo_pescado": "diario",
            "tipos_pescado_mencionados": ["surubí", "muturo"],
            "sintomas": {
                "temblores_extremidades": True,
                "parestesias_adormecimiento": True,
                "problemas_vision_marcha": False,
                "dolores_cabeza_cronicos": True,
                "fatiga_extrema": True,
                "perdida_memoria_concentracion": False
            },
            "tiempo_con_sintomas": "Aproximadamente 5 meses continuos",
            "fuente_agua_comunal": "Pozo artesiano cercano al río Madre de Dios",
            "indicio_ambiental_adicional": "Menciona que los pescadores sacan surubíes flacos y con piel amarillenta.",
            "score_sospecha": 4
        }
    },
    {
        "id": "rep-002",
        "latitud": -10.5310,
        "longitud": -65.5810,
        "categoria": "pez",
        "descripcion_usuario": "Surubí con manchas extrañas y comportamiento letárgico cerca a Cachuela Esperanza.",
        "url_foto": "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80",
        "estado": "crudo",
        "score_sospecha": 5,
        "comunidad_id": "com-cachuela",
        "comunidad_nombre": "Cachuela Esperanza",
        "fecha_reporte": "2026-11-22T09:15:00Z",
        "fecha_sincronizacion": "2026-11-22T12:00:00Z",
        "notas_investigador": None,
        "entrevista_ia": {
            "comunidad_mencionada": "Cachuela Esperanza",
            "frecuencia_consumo_pescado": "diario",
            "tipos_pescado_mencionados": ["surubí", "bagre"],
            "sintomas": {
                "temblores_extremidades": True,
                "parestesias_adormecimiento": True,
                "problemas_vision_marcha": True,
                "dolores_cabeza_cronicos": True,
                "fatiga_extrema": True,
                "perdida_memoria_concentracion": True
            },
            "tiempo_con_sintomas": "Más de 1 año",
            "fuente_agua_comunal": "Directo del Río Beni",
            "indicio_ambiental_adicional": "El comunario indica que su familia entera presenta dolor articular y espasmos nocturnos.",
            "score_sospecha": 5
        }
    },
    {
        "id": "rep-003",
        "latitud": -15.4920,
        "longitud": -67.7150,
        "categoria": "agua",
        "descripcion_usuario": "Agua excesivamente lechosa y turbia con presencia de balsas mineras activas.",
        "url_foto": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        "estado": "semiverificado",
        "score_sospecha": 5,
        "comunidad_id": "com-teoponte",
        "comunidad_nombre": "Teoponte",
        "fecha_reporte": "2026-11-18T16:45:00Z",
        "fecha_sincronizacion": "2026-11-18T17:00:00Z",
        "notas_investigador": "Coincide con sector de alta concentración de cooperativas en el Río Kaka. Urge visita con turbidímetro.",
        "entrevista_ia": {
            "comunidad_mencionada": "Teoponte",
            "frecuencia_consumo_pescado": "semanal",
            "tipos_pescado_mencionados": ["sábalo"],
            "sintomas": {
                "temblores_extremidades": False,
                "parestesias_adormecimiento": False,
                "problemas_vision_marcha": False,
                "dolores_cabeza_cronicos": True,
                "fatiga_extrema": False,
                "perdida_memoria_concentracion": False
            },
            "tiempo_con_sintomas": "Semanas recientes tras inicio de temporada seca",
            "fuente_agua_comunal": "Quebrada afluente al Kaka",
            "indicio_ambiental_adicional": "Tres balsas dragas operando a 2 km aguas arriba sin autorización visible.",
            "score_sospecha": 5
        }
    },
    {
        "id": "rep-004",
        "latitud": -14.4450,
        "longitud": -67.5320,
        "categoria": "planta",
        "descripcion_usuario": "Vegetación ribereña con amarillamiento acelerado en orilla de Rurrenabaque.",
        "url_foto": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80",
        "estado": "crudo",
        "score_sospecha": 2,
        "comunidad_id": "com-rurre",
        "comunidad_nombre": "Rurrenabaque",
        "fecha_reporte": "2026-11-21T11:20:00Z",
        "fecha_sincronizacion": "2026-11-21T15:40:00Z",
        "notas_investigador": None,
        "entrevista_ia": {
            "comunidad_mencionada": "Rurrenabaque",
            "frecuencia_consumo_pescado": "semanal",
            "tipos_pescado_mencionados": ["sábalo", "surubí"],
            "sintomas": {
                "temblores_extremidades": False,
                "parestesias_adormecimiento": False,
                "problemas_vision_marcha": False,
                "dolores_cabeza_cronicos": False,
                "fatiga_extrema": False,
                "perdida_memoria_concentracion": False
            },
            "tiempo_con_sintomas": "Sin síntomas clínicos graves reportados",
            "fuente_agua_comunal": "Red de agua de vertiente protegida",
            "indicio_ambiental_adicional": "Taropes en la orilla con pudrición basal.",
            "score_sospecha": 2
        }
    },
    {
        "id": "rep-005",
        "latitud": -11.0020,
        "longitud": -66.0910,
        "categoria": "salud",
        "descripcion_usuario": "Caso documentado con muestra de laboratorio de cabello enviada a la UMSA.",
        "url_foto": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
        "estado": "verificado",
        "score_sospecha": 5,
        "comunidad_id": "com-riberalta",
        "comunidad_nombre": "Riberalta",
        "fecha_reporte": "2026-11-10T10:00:00Z",
        "fecha_sincronizacion": "2026-11-10T10:00:00Z",
        "notas_investigador": "VERIFICADO CIENTÍFICAMENTE: Muestra de cabello con 8.4 ppm de Hg total (Límite OMS: 1.0 ppm). Sujeto de etnia Esse Ejja.",
        "entrevista_ia": {
            "comunidad_mencionada": "Comunidad Indígena Eyiyo Quibo / Riberalta",
            "frecuencia_consumo_pescado": "diario (2 a 3 veces al día)",
            "tipos_pescado_mencionados": ["surubí", "muturo", "bagre"],
            "sintomas": {
                "temblores_extremidades": True,
                "parestesias_adormecimiento": True,
                "problemas_vision_marcha": True,
                "dolores_cabeza_cronicos": True,
                "fatiga_extrema": True,
                "perdida_memoria_concentracion": True
            },
            "tiempo_con_sintomas": "3 años con deterioro progresivo",
            "fuente_agua_comunal": "Río Madre de Dios",
            "indicio_ambiental_adicional": "Toda la comunidad tiene dieta exclusivamente ictiófaga.",
            "score_sospecha": 5
        }
    }
]
