import re
import math
import unicodedata
from typing import List, Dict, Any, Optional, Tuple
from app.models import EntrevistaIAModel, SintomasModel

def normalize_text(text: str) -> str:
    """Elimina acentos y normaliza a minúsculas para matching fonético y semántico robusto"""
    text = text.lower()
    return "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

# System Prompt formal para guiar a Gemma 2B en el dispositivo del comunario
GEMMA_SYSTEM_PROMPT = """Eres EcoGuardián, un asistente de salud comunitaria y medio ambiente para comunidades rurales y ribereñas de Bolivia.
Tu objetivo es escuchar al comunario con calidez y respeto, haciéndole preguntas breves y sencillas para comprender:
1. Qué síntomas o malestares siente él o su familia.
2. Si consume pescado del río, qué tipo (ej. surubí, muturo, sábalo) y con qué frecuencia.
3. De dónde obtienen el agua que beben (río, quebrada, pozo).
4. Si ha notado cosas raras en los peces, plantas o en el color del río.

REGLAS DE ORO:
- NUNCA des diagnósticos médicos ("tienes intoxicación", "es por el mercurio").
- Solo haz 1 pregunta breve a la vez para no cansar al usuario.
- Habla en español claro, usando términos locales respetuosos.
- Al final, agradece el reporte e indica que la información ayudará a los equipos de salud e investigación a priorizar la zona."""

# Palabras clave y heurísticas para extracción semántica
SINTOMAS_KEYWORDS = {
    "temblores_extremidades": [
        "tiembla", "temblor", "temblores", "sacudida", "espasmo", "no puedo sostener", "temblorina", "vibracion"
    ],
    "parestesias_adormecimiento": [
        "adormecido", "adormecimiento", "hormigueo", "entumecido", "entumecimiento", "no siento", "adormecen"
    ],
    "problemas_vision_marcha": [
        "vision borrosa", "no veo bien", "tropiezo", "pierdo equilibrio", "tambaleo", "vision de tunel", "mareos al caminar"
    ],
    "dolores_cabeza_cronicos": [
        "dolor de cabeza", "jaqueca", "cefalea", "me duele la cabeza", "dolor constante de cabeza", "punzadas en la cabeza"
    ],
    "fatiga_extrema": [
        "muy cansado", "sin fuerzas", "agotado", "fatiga", "debilidad", "no tengo energia", "cuerpo pesado"
    ],
    "perdida_memoria_concentracion": [
        "se me olvidan", "olvidadizo", "no me acuerdo", "pierdo la memoria", "desconcentrado"
    ]
}

PECES_BIOACUMULADORES = {
    "surubi": "Pseudoplatystoma fasciatum",
    "surubí": "Pseudoplatystoma fasciatum",
    "pintado": "Pseudoplatystoma fasciatum",
    "muturo": "Zungaro zungaro",
    "manguruyu": "Zungaro zungaro",
    "manguruyú": "Zungaro zungaro",
    "bagre": "Pimelodidae",
    "pirana": "Pygocentrus nattereri",
    "piraña": "Pygocentrus nattereri",
    "blanquillo": "Calophysus macropterus",
    "dorado": "Salminus brasiliensis"
}

PECES_DETRITIVOROS_BAJO_RIESGO = {
    "sabalo": "Prochilodus nigricans",
    "sábalo": "Prochilodus nigricans",
    "boga": "Leporinus spp.",
    "bentonico": "Detritívoro"
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia en kilómetros entre dos coordenadas geográficas"""
    R = 6371.0 # Radio de la Tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def extract_entrevista_from_text(transcripcion: str, comunidad_hint: Optional[str] = None) -> EntrevistaIAModel:
    """
    Analizador y parser semántico que procesa la transcripción de la conversación 
    con el comunario y genera el payload estructurado EntrevistaIAModel.
    """
    text_lower = transcripcion.lower()

    # 1. Extracción de síntomas
    sintomas_dict = {}
    total_sintomas_detectados = 0
    for sintoma_key, keywords in SINTOMAS_KEYWORDS.items():
        detected = any(k in text_lower for k in keywords)
        sintomas_dict[sintoma_key] = detected
        if detected:
            total_sintomas_detectados += 1

    sintomas = SintomasModel(**sintomas_dict)

    # 2. Extracción de consumo de pescado
    peces_mencionados = []
    es_carnivoro = False
    for pez in PECES_BIOACUMULADORES.keys():
        if re.search(r'\b' + re.escape(pez) + r'\b', text_lower):
            if pez not in peces_mencionados:
                peces_mencionados.append(pez)
                es_carnivoro = True

    for pez in PECES_DETRITIVOROS_BAJO_RIESGO.keys():
        if re.search(r'\b' + re.escape(pez) + r'\b', text_lower):
            if pez not in peces_mencionados:
                peces_mencionados.append(pez)

    norm_text = normalize_text(text_lower)

    frecuencia = "desconocido"
    if any(k in norm_text for k in ["todos los dias", "diario", "diariamente", "cada dia", "almuerzo y cena", "a diario"]):
        frecuencia = "diario"
    elif any(k in norm_text for k in ["semanal", "veces a la semana", "veces por semana", "dos veces", "tres veces"]):
        frecuencia = "semanal"
    elif any(k in norm_text for k in ["rara vez", "casi nunca", "ocasionalmente", "de vez en cuando"]):
        frecuencia = "rara_vez"
    elif any(k in norm_text for k in ["no comemos", "nunca", "no consumo"]):
        frecuencia = "nunca"

    # 3. Fuente de agua
    fuente_agua = None
    if "rio" in text_lower or "río" in text_lower:
        fuente_agua = "Río directo / Arroyo"
    elif "pozo" in text_lower:
        fuente_agua = "Pozo artesiano / comunal"
    elif "lluvia" in text_lower:
        fuente_agua = "Agua de lluvia colectada"
    elif "red" in text_lower or "grifo" in text_lower:
        fuente_agua = "Red de cañería"

    # 4. Indicios ambientales adicionales
    indicios = []
    if any(k in text_lower for k in ["draga", "balsa", "motor minero", "mineros"]):
        indicios.append("Presencia de dragas o balsas mineras activas en la zona")
    if any(k in text_lower for k in ["manchas", "flaco", "muerto", "ojos blancos", "pez raro", "deforme"]):
        indicios.append("Anomalías visuales en fauna acuática")
    if any(k in text_lower for k in ["agua blanca", "lechosa", "turbia", "barro espesa", "grasa en agua"]):
        indicios.append("Agua con turbidez atípica o sedimentos lechosos")
    if any(k in text_lower for k in ["planta seca", "amarillo", "hojas quemadas"]):
        indicios.append("Afectación en vegetación de ribera")

    indicio_adicional = " • ".join(indicios) if indicios else None

    # 5. Cálculo calibrado de Score de Sospecha (1 a 5)
    score = 1
    if frecuencia == "diario" and es_carnivoro:
        score += 2
    elif frecuencia == "semanal" and es_carnivoro:
        score += 1
    elif frecuencia == "diario":
        score += 1

    if sintomas.temblores_extremidades:
        score += 1
    if sintomas.parestesias_adormecimiento:
        score += 1
    if total_sintomas_detectados >= 3:
        score += 1
    if indicio_adicional:
        score += 1

    # Normalizar entre 1 y 5
    score = max(1, min(5, score))

    return EntrevistaIAModel(
        comunidad_mencionada=comunidad_hint,
        frecuencia_consumo_pescado=frecuencia,
        tipos_pescado_mencionados=peces_mencionados,
        sintomas=sintomas,
        tiempo_con_sintomas="Reportado en entrevista con asistente",
        fuente_agua_comunal=fuente_agua,
        indicio_ambiental_adicional=indicio_adicional,
        score_sospecha=score
    )
