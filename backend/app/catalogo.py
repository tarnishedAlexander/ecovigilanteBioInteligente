"""Catálogo de bioindicadores: datos de referencia versionados en app/data/bioindicadores.json.

Son mediciones publicadas y registros de presencia que no cambian con el uso de la plataforma,
por eso viven en un archivo revisable en git y no en la base SQLite (que se resiembra en cada arranque).
"""
import json
import os
from functools import lru_cache

from app.models import CatalogoBioindicadores

RUTA = os.path.join(os.path.dirname(__file__), "data", "bioindicadores.json")


def validar(catalogo: CatalogoBioindicadores) -> None:
    """Falla al arrancar si una medición o referencia apunta a algo que no existe."""
    taxones = {t.id for t in catalogo.taxones}
    sitios = {s.id for s in catalogo.sitios}
    fuentes = {f.id for f in catalogo.fuentes}
    errores = []
    if len(taxones) != len(catalogo.taxones):
        errores.append("ids de taxón repetidos")
    for m in catalogo.mediciones:
        if m.taxon not in taxones:
            errores.append(f"{m.id}: taxón desconocido {m.taxon}")
        if m.sitio not in sitios:
            errores.append(f"{m.id}: sitio desconocido {m.sitio}")
        if m.fuente not in fuentes:
            errores.append(f"{m.id}: fuente desconocida {m.fuente}")
    for f in catalogo.fundamentos:
        for fid in f.fuentes:
            if fid not in fuentes:
                errores.append(f"{f.id}: fuente desconocida {fid}")
    for t in catalogo.taxones:
        for r in t.referencias:
            if r.taxon not in taxones:
                errores.append(f"{t.id}: referencia a taxón desconocido {r.taxon}")
    if errores:
        raise ValueError("Catálogo de bioindicadores inválido: " + "; ".join(errores))


@lru_cache(maxsize=1)
def cargar_catalogo() -> CatalogoBioindicadores:
    with open(RUTA, encoding="utf-8") as f:
        catalogo = CatalogoBioindicadores.model_validate(json.load(f))
    validar(catalogo)
    return catalogo
