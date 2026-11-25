from fastapi import FastAPI, HTTPException, Query
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

app = FastAPI(
    title="EcoVigilante API",
    description="Backend para monitoreo de mercurio, cuencas y bioindicadores en Bolivia",
    version="1.0.0"
)

# Permitir CORS para el frontend de desarrollo (Vite / React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.patch("/api/v1/reportes/{reporte_id}/estado", response_model=Reporte)
def change_reporte_estado(reporte_id: str, payload: ReporteUpdateEstado):
    """Acción del investigador para ponderar un reporte: crudo -> semiverificado -> verificado"""
    updated = update_reporte_estado(reporte_id, payload.estado, payload.notas_investigador)
    if not updated:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return updated

@app.post("/api/v1/reportes", response_model=Reporte, status_code=201)
def submit_reporte(payload: ReporteCreate):
    """Ingesta anónima de reportes desde la aplicación móvil del comunario"""
    data = payload.dict()
    # Si viene con entrevista_ia, calcular comunidad más cercana o asignar
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
