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

# --- Catálogo de bioindicadores (datos de referencia en app/data/bioindicadores.json) ---

class Fuente(BaseModel):
    id: str
    cita: str
    url: str

class Sitio(BaseModel):
    id: str
    nombre: str
    pais: Optional[str] = None
    region: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    precision: Literal["exacta", "aproximada", "desconocida"]
    contexto: Literal["minero", "referencia", "mixto", "mercado", "desconocido"]
    alcance: Literal["bolivia", "madeira", "amazonia", "fuera", "neotropico"]

class PresenciaBolivia(BaseModel):
    gbif_key: int
    registros: int
    departamentos: List[str] = Field(default_factory=list)

class Referencia(BaseModel):
    taxon: str
    relacion: Literal["misma_especie", "mismo_genero", "misma_familia", "mismo_gremio", "mismo_habito"]

class Prioridad(BaseModel):
    orden: int
    motivo: str
    muestra: str

class Foto(BaseModel):
    archivo: str  # nombre del archivo en Wikimedia Commons
    licencia: Optional[str] = None
    autor: Optional[str] = None

class Taxon(BaseModel):
    id: str
    nombre_comun: str
    nombre_cientifico: str
    familia: str
    grupo: Literal["pez", "ave", "reptil", "mamifero", "insecto", "planta", "abiotico"]
    nivel: Literal["especie", "genero", "grupo"]
    dieta: str
    introducida: bool = False
    bolivia: Optional[PresenciaBolivia] = None
    referencias: List[Referencia] = Field(default_factory=list)
    prioridad: Optional[Prioridad] = None
    nota: Optional[str] = None
    # "corpus": aparece en los papers; "pariente_gbif": especie boliviana agregada por familia o género.
    origen: Literal["corpus", "pariente_gbif"] = "corpus"
    # Registros de GBIF en Beni y Pando (núcleo amazónico de Bolivia), solo para parientes agregados.
    amazonia_bolivia: Optional[int] = None
    foto: Optional[Foto] = None

class Medicion(BaseModel):
    id: str
    taxon: str
    sitio: str
    tejido: str
    estadistico: Literal["media", "mediana", "individual", "rango", "total", "bajo_ld"]
    valor: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    dispersion: Optional[float] = None
    dispersion_tipo: Optional[Literal["DE", "EE"]] = None
    unidad: Literal["mg/kg", "µg/g", "ng/L", "µg/m²"]
    base: Optional[Literal["humedo", "seco"]] = None
    n: Optional[int] = None
    periodo: Optional[str] = None
    fuente: str
    nota: Optional[str] = None

class AplicaFundamento(BaseModel):
    grupos: List[str] = Field(default_factory=list)
    familias: List[str] = Field(default_factory=list)
    generos: List[str] = Field(default_factory=list)
    dietas: List[str] = Field(default_factory=list)  # normalizadas, sin tildes

class Fundamento(BaseModel):
    """Por qué un grupo de organismos sirve como bioindicador, según los papers citados."""
    id: str
    tipo: Literal["quimico", "biologico", "anatomico"]
    titulo: str
    texto: str
    fuentes: List[str]
    aplica: AplicaFundamento

class CatalogoBioindicadores(BaseModel):
    version: str
    nota: str
    fundamentos: List[Fundamento] = Field(default_factory=list)
    fuentes: List[Fuente]
    sitios: List[Sitio]
    taxones: List[Taxon]
    mediciones: List[Medicion]

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

# --- Investigación: estudios de mercurio por matriz (datos de referencia en app/data/investigacion.json) ---

Matriz = Literal["aire", "agua", "sedimentos", "peces", "cabello"]

class EstudioHg(BaseModel):
    id: str
    cita: str
    anio: int
    titulo: str
    autores: str
    revista: str
    url: str = ""
    matrices: List[Matriz]
    # Años de muestreo [inicio, fin]; None si el artículo no lo indica.
    muestreo: List[Optional[int]]
    # "texto": valores leídos en el texto completo; "resumen": confirmados en el resumen;
    # "hoja": tomados de la hoja del equipo (DOI verificado, valor sin cotejar con el artículo).
    verificacion: Literal["texto", "resumen", "hoja"]
    hallazgo: str

class SitioHg(BaseModel):
    id: str
    nombre: str
    region: Optional[str] = None
    pais: str
    lat: float
    lng: float
    precision: Literal["exacta", "aproximada"]
    nota: Optional[str] = None

class EspecieHg(BaseModel):
    comun: str
    cientifico: str
    gremio: Literal["carnivoro", "no_carnivoro", "reptil", "mixto"]

class MedicionHg(BaseModel):
    id: str
    estudio: str
    sitio: str
    matriz: Matriz
    forma: str  # Hg total, Hg particulado, MeHg, GEM, TGM
    especie: Optional[EspecieHg] = None
    estadistico: Literal["media", "mediana", "individual", "rango", "bajo_ld"]
    valor: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    de: Optional[float] = None
    unidad: Literal["ng/m³", "ng/L", "µg/g", "ng/g"]
    base: Optional[Literal["humedo", "seco"]] = None
    n: Optional[int] = None
    anio: Optional[float] = None  # año (fracción para meses) usado en series y línea de tiempo
    periodo: Optional[str] = None
    nota: Optional[str] = None

class ReferenciaHg(BaseModel):
    id: str
    matriz: Matriz
    valor: float
    unidad: str
    etiqueta: str
    fuente: str

class Investigacion(BaseModel):
    version: str
    nota: str
    estudios: List[EstudioHg]
    sitios: List[SitioHg]
    mediciones: List[MedicionHg]
    referencias: List[ReferenciaHg]
