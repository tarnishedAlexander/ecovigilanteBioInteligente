"""Estudios de mercurio en aire, agua, sedimentos, peces y cabello: app/data/investigacion.json.

Igual que el catálogo de bioindicadores, son datos de referencia revisables en git y se validan al arrancar.
"""
import json
import os
from functools import lru_cache

from app.models import Investigacion

RUTA = os.path.join(os.path.dirname(__file__), "data", "investigacion.json")


def validar(inv: Investigacion) -> None:
    estudios = {e.id: e for e in inv.estudios}
    sitios = {s.id for s in inv.sitios}
    errores = []
    if len(estudios) != len(inv.estudios):
        errores.append("ids de estudio repetidos")
    if len({m.id for m in inv.mediciones}) != len(inv.mediciones):
        errores.append("ids de medición repetidos")
    for m in inv.mediciones:
        e = estudios.get(m.estudio)
        if e is None:
            errores.append(f"{m.id}: estudio desconocido {m.estudio}")
        elif m.matriz not in e.matrices:
            errores.append(f"{m.id}: la matriz {m.matriz} no figura en el estudio {m.estudio}")
        if m.sitio not in sitios:
            errores.append(f"{m.id}: sitio desconocido {m.sitio}")
        if m.valor is None and m.min is None and m.max is None:
            errores.append(f"{m.id}: sin valor")
        if m.matriz == "peces" and m.especie is None:
            errores.append(f"{m.id}: medición en peces sin especie")
    if errores:
        raise ValueError("Datos de investigación inválidos: " + "; ".join(errores))


@lru_cache(maxsize=1)
def cargar_investigacion() -> Investigacion:
    with open(RUTA, encoding="utf-8") as f:
        inv = Investigacion.model_validate(json.load(f))
    validar(inv)
    return inv
