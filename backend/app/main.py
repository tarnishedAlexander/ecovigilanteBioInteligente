import os
import secrets
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from app.models import Reporte, ReporteCreate, ReporteUpdateEstado, Comunidad, Bioindicador
from app.database import (
    init_db,
    get_all_comunidades,
    get_all_bioindicadores,
    get_all_reportes,
    get_reporte_by_id,
    update_reporte_estado,
    create_reporte
)
from app.seed_data import RIOS_GEOJSON
from app.services.gemma_extractor import extract_entrevista_from_text, haversine_distance, GEMMA_SYSTEM_PROMPT

app = FastAPI(
    title="EcoVigilante API",
    description="Backend para monitoreo de mercurio, cuencas y bioindicadores en Bolivia",
    version="1.0.0"
)

# CORS: solo los orígenes configurados. En local, el frontend de Vite.
# En el servidor: CORS_ORIGINS="https://mi-sitio.vercel.app,https://otro-dominio"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
# Opcional: expresión regular para aceptar las URLs de vista previa de Vercel del proyecto.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Clave simple para acciones del investigador (cambiar el estado de un reporte).
# Si ADMIN_API_KEY no está definida (desarrollo local), no se exige.
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

def requiere_investigador(x_api_key: Optional[str] = Header(default=None)):
    if ADMIN_API_KEY and not (x_api_key and secrets.compare_digest(x_api_key, ADMIN_API_KEY)):
        raise HTTPException(status_code=401, detail="Clave de investigador inválida o ausente")

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoVigilante Core API",
        "region": "Cuencas Amazónicas Bolivia",
        "version": "1.0.0"
    }

@app.get("/api/v1/rios")
def get_rios():
    """Devuelve el GeoJSON con los trazos vectoriales de los ríos amazónicos principales"""
    return RIOS_GEOJSON

@app.get("/api/v1/comunidades", response_model=List[Comunidad])
def list_comunidades():
    """Lista de comunidades monitoreadas con coordenadas y nivel de alerta"""
    return get_all_comunidades()

@app.get("/api/v1/bioindicadores", response_model=List[Bioindicador])
def list_bioindicadores():
    """Catálogo de especies bioindicadoras de acumulación de mercurio"""
    return get_all_bioindicadores()

@app.get("/api/v1/reportes", response_model=List[Reporte])
def list_reportes(
    estado: Optional[str] = Query(None, description="Filtrar por: crudo | semiverificado | verificado | descartado"),
    comunidad_id: Optional[str] = Query(None, description="Filtrar por id de comunidad")
):
    """Lista de reportes anónimos y de terreno con georreferenciación y análisis de Gemma"""
    return get_all_reportes(estado=estado, comunidad_id=comunidad_id)

@app.get("/api/v1/reportes/{reporte_id}", response_model=Reporte)
def get_reporte(reporte_id: str):
    rep = get_reporte_by_id(reporte_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return rep

@app.patch("/api/v1/reportes/{reporte_id}/estado", response_model=Reporte, dependencies=[Depends(requiere_investigador)])
def change_reporte_estado(reporte_id: str, payload: ReporteUpdateEstado):
    """Acción del investigador para ponderar un reporte: crudo -> semiverificado -> verificado"""
    updated = update_reporte_estado(reporte_id, payload.estado, payload.notas_investigador)
    if not updated:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated

@app.get("/api/v1/gemma/prompt")
def get_gemma_prompt():
    """Devuelve el system prompt y especificación para Gemma 2B local"""
    return {
        "model_target": "Gemma 2B / Gemma-2 2B (4-bit)",
        "role": "Entrevistador Comunitario Empático (Sin diagnóstico médico directo)",
        "system_prompt": GEMMA_SYSTEM_PROMPT
    }

@app.post("/api/v1/reportes", response_model=Reporte, status_code=201)
def submit_reporte(payload: ReporteCreate):
    """Ingesta anónima de reportes desde la aplicación móvil del comunario"""
    data = payload.dict()

    # 1. Si no viene entrevista_ia estructurada pero hay transcripción cruda, extraerla
    if not data.get("entrevista_ia") and data.get("transcripcion_chat"):
        extracted = extract_entrevista_from_text(
            data["transcripcion_chat"],
            comunidad_hint=data.get("comunidad_nombre")
        )
        data["entrevista_ia"] = extracted.dict()

    # 2. Si no tiene comunidad asignada, calcular la más cercana según coordenadas GPS
    if not data.get("comunidad_id") or not data.get("comunidad_nombre"):
        todas_comunidades = get_all_comunidades()
        if todas_comunidades:
            comunidad_mas_cercana = min(
                todas_comunidades,
                key=lambda c: haversine_distance(data["latitud"], data["longitud"], c["latitud"], c["longitud"])
            )
            data["comunidad_id"] = comunidad_mas_cercana["id"]
            data["comunidad_nombre"] = comunidad_mas_cercana["nombre"]

    nuevo = create_reporte(data)
    return nuevo

@app.get("/api/v1/metricas")
def get_metricas():
    """Métricas resumen para el encabezado del panel del investigador"""
    reportes = get_all_reportes()
    total = len(reportes)
    crudos = sum(1 for r in reportes if r["estado"] == "crudo")
    semiverificados = sum(1 for r in reportes if r["estado"] == "semiverificado")
    verificados = sum(1 for r in reportes if r["estado"] == "verificado")
    
    # Síntomas más reportados
    conteo_sintomas = {
        "temblores": 0,
        "parestesias": 0,
        "dolor_cabeza": 0,
        "fatiga": 0,
        "vision_marcha": 0
    }
    for r in reportes:
        e = r.get("entrevista_ia")
        if e and isinstance(e, dict):
            s = e.get("sintomas", {})
            if s.get("temblores_extremidades"): conteo_sintomas["temblores"] += 1
            if s.get("parestesias_adormecimiento"): conteo_sintomas["parestesias"] += 1
            if s.get("dolores_cabeza_cronicos"): conteo_sintomas["dolor_cabeza"] += 1
            if s.get("fatiga_extrema"): conteo_sintomas["fatiga"] += 1
            if s.get("problemas_vision_marcha"): conteo_sintomas["vision_marcha"] += 1

    return {
        "total_reportes": total,
        "en_crudo": crudos,
        "semiverificados": semiverificados,
        "verificados": verificados,
        "sintomas_frecuentes": conteo_sintomas,
        "cuenca_foco_principal": "Río Beni / Río Madre de Dios (Riberalta)"
    }
