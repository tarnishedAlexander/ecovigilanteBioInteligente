import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.seed_data import COMUNIDADES_DATA, BIOINDICADORES_DATA, REPORTES_INICIALES, RIOS_GEOJSON

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ecovigilante.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Tabla Comunidades
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comunidades (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        departamento TEXT NOT NULL,
        cuenca_principal TEXT NOT NULL,
        latitud REAL NOT NULL,
        longitud REAL NOT NULL,
        poblacion_estimada INTEGER NOT NULL,
        posible_fuente_minera_aguas_arriba TEXT,
        alerta_nivel TEXT DEFAULT 'Bajo'
    )
    """)

    # Tabla Bioindicadores
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bioindicadores (
        id TEXT PRIMARY KEY,
        nombre_comun TEXT NOT NULL,
        nombre_cientifico TEXT NOT NULL,
        tipo TEXT NOT NULL,
        nivel_bioacumulacion TEXT NOT NULL,
        factor_riesgo_salud TEXT NOT NULL,
        descripcion_ecologica TEXT NOT NULL,
        especies_similares TEXT, -- JSON Array
        icono TEXT
    )
    """)

    # Tabla Reportes de Comunarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reportes (
        id TEXT PRIMARY KEY,
        latitud REAL NOT NULL,
        longitud REAL NOT NULL,
        categoria TEXT NOT NULL,
        descripcion_usuario TEXT,
        url_foto TEXT,
        estado TEXT NOT NULL DEFAULT 'crudo',
        score_sospecha INTEGER DEFAULT 1,
        comunidad_id TEXT,
        comunidad_nombre TEXT,
        fecha_reporte TEXT NOT NULL,
        fecha_sincronizacion TEXT NOT NULL,
        notas_investigador TEXT,
        entrevista_ia_json TEXT, -- JSON
        FOREIGN KEY (comunidad_id) REFERENCES comunidades (id)
    )
    """)

    conn.commit()

    # Sembrar comunidades si está vacía
    cursor.execute("SELECT COUNT(*) FROM comunidades")
    if cursor.fetchone()[0] == 0:
        for c in COMUNIDADES_DATA:
            cursor.execute("""
            INSERT INTO comunidades (id, nombre, departamento, cuenca_principal, latitud, longitud, poblacion_estimada, posible_fuente_minera_aguas_arriba, alerta_nivel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (c["id"], c["nombre"], c["departamento"], c["cuenca_principal"], c["latitud"], c["longitud"], c["poblacion_estimada"], c["posible_fuente_minera_aguas_arriba"], c["alerta_nivel"]))

    # Sembrar bioindicadores si está vacía
    cursor.execute("SELECT COUNT(*) FROM bioindicadores")
    if cursor.fetchone()[0] == 0:
        for b in BIOINDICADORES_DATA:
            cursor.execute("""
            INSERT INTO bioindicadores (id, nombre_comun, nombre_cientifico, tipo, nivel_bioacumulacion, factor_riesgo_salud, descripcion_ecologica, especies_similares, icono)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (b["id"], b["nombre_comun"], b["nombre_cientifico"], b["tipo"], b["nivel_bioacumulacion"], b["factor_riesgo_salud"], b["descripcion_ecologica"], json.dumps(b["especies_similares"]), b["icono"]))

    # Sembrar reportes si está vacía
    cursor.execute("SELECT COUNT(*) FROM reportes")
    if cursor.fetchone()[0] == 0:
        for r in REPORTES_INICIALES:
            cursor.execute("""
            INSERT INTO reportes (id, latitud, longitud, categoria, descripcion_usuario, url_foto, estado, score_sospecha, comunidad_id, comunidad_nombre, fecha_reporte, fecha_sincronizacion, notas_investigador, entrevista_ia_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r["id"],
                r["latitud"],
                r["longitud"],
                r["categoria"],
                r["descripcion_usuario"],
                r["url_foto"],
                r["estado"],
                r["score_sospecha"],
                r["comunidad_id"],
                r["comunidad_nombre"],
                r["fecha_reporte"],
                r["fecha_sincronizacion"],
                r["notas_investigador"],
                json.dumps(r["entrevista_ia"])
            ))

    conn.commit()
    conn.close()

def get_all_comunidades() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, COUNT(r.id) as total_reportes
        FROM comunidades c
        LEFT JOIN reportes r ON c.id = r.comunidad_id
        GROUP BY c.id
        ORDER BY c.nombre ASC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_all_bioindicadores() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bioindicadores")
    rows = []
    for row in cursor.fetchall():
        d = dict(row)
        if d.get("especies_similares"):
            try:
                d["especies_similares"] = json.loads(d["especies_similares"])
            except:
                d["especies_similares"] = []
        rows.append(d)
    conn.close()
    return rows

def get_all_reportes(estado: Optional[str] = None, comunidad_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM reportes WHERE 1=1"
    params = []
    if estado:
        query += " AND estado = ?"
        params.append(estado)
    if comunidad_id:
        query += " AND comunidad_id = ?"
        params.append(comunidad_id)
    
    query += " ORDER BY fecha_reporte DESC"
    cursor.execute(query, params)
    
    reportes = []
    for row in cursor.fetchall():
        item = dict(row)
        if item.get("entrevista_ia_json"):
            try:
                item["entrevista_ia"] = json.loads(item["entrevista_ia_json"])
            except:
                item["entrevista_ia"] = None
        else:
            item["entrevista_ia"] = None
        reportes.append(item)
    conn.close()
    return reportes

def get_reporte_by_id(reporte_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reportes WHERE id = ?", (reporte_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    # Siempre definir la clave: el modelo de respuesta la exige aunque no haya entrevista.
    item["entrevista_ia"] = None
    if item.get("entrevista_ia_json"):
        try:
            item["entrevista_ia"] = json.loads(item["entrevista_ia_json"])
        except (TypeError, ValueError):
            item["entrevista_ia"] = None
    return item

def update_reporte_estado(reporte_id: str, estado: str, notas_investigador: Optional[str]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE reportes
        SET estado = ?, notas_investigador = COALESCE(?, notas_investigador)
        WHERE id = ?
    """, (estado, notas_investigador, reporte_id))
    conn.commit()
    conn.close()
    return get_reporte_by_id(reporte_id)

def create_reporte(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    import uuid
    reporte_id = f"rep-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    entrevista_json = json.dumps(data.get("entrevista_ia", {})) if data.get("entrevista_ia") else None
    score = 1
    if data.get("entrevista_ia"):
        score = data["entrevista_ia"].get("score_sospecha", 1)
        
    cursor.execute("""
        INSERT INTO reportes (
            id, latitud, longitud, categoria, descripcion_usuario, url_foto,
            estado, score_sospecha, comunidad_id, comunidad_nombre,
            fecha_reporte, fecha_sincronizacion, notas_investigador, entrevista_ia_json
        ) VALUES (?, ?, ?, ?, ?, ?, 'crudo', ?, ?, ?, ?, ?, NULL, ?)
    """, (
        reporte_id,
        data["latitud"],
        data["longitud"],
        data["categoria"],
        data.get("descripcion_usuario"),
        data.get("url_foto"),
        score,
        data.get("comunidad_id"),
        data.get("comunidad_nombre", "Comunidad Ribereña"),
        now_iso,
        now_iso,
        entrevista_json
    ))
    conn.commit()
    conn.close()
    return get_reporte_by_id(reporte_id)
