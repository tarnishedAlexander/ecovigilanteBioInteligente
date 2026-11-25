from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class SintomasModel(BaseModel):
    temblores_extremidades: bool = False
    parestesias_adormecimiento: bool = False
    problemas_vision_marcha: bool = False
    dolores_cabeza_cronicos: bool = False
    fatiga_extrema: bool = False
    perdida_memoria_concentracion: bool = False

class EntrevistaIAModel(BaseModel):
    comunidad_mencionada: Optional[str] = None
    frecuencia_consumo_pescado: Optional[str] = "desconocido" # "diario", "semanal", "rara_vez", "nunca"
    tipos_pescado_mencionados: List[str] = Field(default_factory=list)
    sintomas: SintomasModel = Field(default_factory=SintomasModel)
    tiempo_con_sintomas: Optional[str] = None
    fuente_agua_comunal: Optional[str] = None
    indicio_ambiental_adicional: Optional[str] = None
    score_sospecha: int = Field(default=1, ge=1, le=5) # 1 a 5

class ReporteCreate(BaseModel):
    latitud: float
    longitud: float
    categoria: str = Field(..., description="pez | agua | planta | salud | mineria")
    descripcion_usuario: Optional[str] = None
    url_foto: Optional[str] = None
    comunidad_id: Optional[str] = None
    comunidad_nombre: Optional[str] = None
    transcripcion_chat: Optional[str] = Field(None, description="Transcripción cruda de la conversación con el asistente para ser parseada")
    entrevista_ia: Optional[EntrevistaIAModel] = None

class ReporteUpdateEstado(BaseModel):
    estado: Literal["crudo", "semiverificado", "verificado", "descartado"]
    notas_investigador: Optional[str] = None
    investigador_id: Optional[str] = "investigador_demo"

class Reporte(BaseModel):
    id: str
    latitud: float
    longitud: float
    categoria: str
    descripcion_usuario: Optional[str]
    url_foto: Optional[str]
    estado: str # "crudo", "semiverificado", "verificado", "descartado"
    score_sospecha: int
    comunidad_id: Optional[str]
    comunidad_nombre: Optional[str]
    fecha_reporte: str
    fecha_sincronizacion: str
    notas_investigador: Optional[str]
    entrevista_ia: Optional[EntrevistaIAModel]

class Bioindicador(BaseModel):
    id: str
    nombre_comun: str
    nombre_cientifico: str
    tipo: str # "pez_carnivoro", "pez_detritivoro", "planta", "macroinvertebrado"
    nivel_bioacumulacion: str # "Crítico", "Alto", "Medio", "Bajo"
    factor_riesgo_salud: str
    descripcion_ecologica: str
    especies_similares: List[str] = Field(default_factory=list)
    icono: str

class Comunidad(BaseModel):
    id: str
    nombre: str
    departamento: str # "Beni", "Pando", "La Paz"
    cuenca_principal: str
    latitud: float
    longitud: float
    poblacion_estimada: int
    posible_fuente_minera_aguas_arriba: str
    total_reportes: int = 0
    alerta_nivel: str = "Bajo" # "Bajo", "Medio", "Alto", "Critico"
