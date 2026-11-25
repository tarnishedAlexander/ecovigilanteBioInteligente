#!/usr/bin/env python3
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.gemma_extractor import extract_entrevista_from_text, haversine_distance, GEMMA_SYSTEM_PROMPT
from app.main import submit_reporte, get_metricas, list_reportes
from app.models import ReporteCreate

def run_tests():
    print("=" * 70)
    print("🌿 ECOVIGILANTE: Pruebas del Pipeline y Parser de Gemma 2B")
    print("=" * 70)

    # 1. Probar System Prompt
    print("\n[1] Verificando System Prompt de Gemma...")
    assert "EcoGuardián" in GEMMA_SYSTEM_PROMPT
    assert "NUNCA des diagnósticos médicos" in GEMMA_SYSTEM_PROMPT
    print("  ✓ Prompt verificado con instrucciones de empatía y no-diagnóstico.")

    # 2. Caso de Prueba 1: Pescador ribereño con síntomas neurológicos severos
    conversacion_caso_1 = """
    Asistente: Hola hermano, cuéntame qué malestar o situación has observado en tu comunidad.
    Comunario: Buenas tardes. Desde hace unos 4 meses me tiemblan mucho las manos cuando intento agarrar cosas,
    y a veces se me adormecen los dedos de las manos y de los pies como si tuviera hormigas.
    Asistente: Lamento escuchar eso. ¿Consumen pescado del río en tu hogar?
    Comunario: Sí, todos los días almorzamos pescado, principalmente surubí y muturo que saco con espinel en el Madre de Dios.
    También tenemos un dolor de cabeza constante en la familia. El agua la sacamos de un arroyo cercano pero pasa turbia
    porque arriba hay dos dragas mineras trabajando noche y día.
    """

    print("\n[2] Probando extracción semántica de Conversación 1...")
    entrevista_1 = extract_entrevista_from_text(conversacion_caso_1, comunidad_hint="Riberalta")
    
    print(f"  • Comunidad: {entrevista_1.comunidad_mencionada}")
    print(f"  • Frecuencia consumo pescado: {entrevista_1.frecuencia_consumo_pescado}")
    print(f"  • Peces identificados: {entrevista_1.tipos_pescado_mencionados}")
    print(f"  • Síntomas detectados:")
    print(f"      - Temblores: {entrevista_1.sintomas.temblores_extremidades}")
    print(f"      - Parestesias (hormigueo/adormecimiento): {entrevista_1.sintomas.parestesias_adormecimiento}")
    print(f"      - Dolor de cabeza crónico: {entrevista_1.sintomas.dolores_cabeza_cronicos}")
    print(f"  • Fuente agua: {entrevista_1.fuente_agua_comunal}")
    print(f"  • Indicio ambiental: {entrevista_1.indicio_ambiental_adicional}")
    print(f"  • Score de Sospecha Calculado (1-5): {entrevista_1.score_sospecha}")

    assert entrevista_1.frecuencia_consumo_pescado == "diario"
    assert "surubi" in entrevista_1.tipos_pescado_mencionados or "surubí" in entrevista_1.tipos_pescado_mencionados
    assert entrevista_1.sintomas.temblores_extremidades is True
    assert entrevista_1.sintomas.parestesias_adormecimiento is True
    assert entrevista_1.score_sospecha >= 4
    print("  ✓ Conversación 1 parseada con alta precisión clínica y score de riesgo crítico (>=4).")

    # 3. Caso de Prueba 2: Comunario con consumo de pez detritívoro sin síntomas
    conversacion_caso_2 = """
    Asistente: Hola, cuéntame si has sentido algún síntoma o visto algo extraño.
    Comunario: Todo tranquilo por aquí, no sentimos dolores. Comemos sábalo una vez a la semana cuando vamos a la feria.
    El agua viene de red protegida.
    """
    print("\n[3] Probando extracción semántica de Conversación 2 (Bajo riesgo)...")
    entrevista_2 = extract_entrevista_from_text(conversacion_caso_2, comunidad_hint="Guayaramerín")
    print(f"  • Peces: {entrevista_2.tipos_pescado_mencionados}")
    print(f"  • Temblores: {entrevista_2.sintomas.temblores_extremidades}")
    print(f"  • Score de Sospecha: {entrevista_2.score_sospecha}")
    assert entrevista_2.score_sospecha <= 2
    print("  ✓ Conversación 2 clasificada adecuadamente como bajo riesgo (<=2).")

    # 4. Probar Ingesta Completa a través de submit_reporte con geolocalización automática
    print("\n[4] Probando ingesta anónima en el endpoint /api/v1/reportes con GPS...")
    # Coordenadas cerca de Riberalta: -11.0200, -66.0700
    nuevo_reporte = submit_reporte(ReporteCreate(
        latitud=-11.0200,
        longitud=-66.0700,
        categoria="salud",
        descripcion_usuario="Reporte enviado por voz al asistente comunitario",
        url_foto="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
        transcripcion_chat=conversacion_caso_1
    ))

    print(f"  • Reporte Creado ID: {nuevo_reporte['id']}")
    print(f"  • Asignado a Comunidad más cercana: {nuevo_reporte['comunidad_nombre']} (ID: {nuevo_reporte['comunidad_id']})")
    print(f"  • Estado Inicial: {nuevo_reporte['estado']}")
    print(f"  • Score Guardado: {nuevo_reporte['score_sospecha']}")
    assert nuevo_reporte["comunidad_nombre"] == "Riberalta"
    assert nuevo_reporte["estado"] == "crudo"
    assert nuevo_reporte["entrevista_ia"] is not None
    print("  ✓ Reporte integrado y georreferenciado con éxito en la base de datos.")

    # 5. Métricas actualizadas
    print("\n[5] Verificando actualización de métricas del panel del investigador...")
    metricas = get_metricas()
    print(f"  • Total Reportes: {metricas['total_reportes']}")
    print(f"  • En Crudo: {metricas['en_crudo']}")
    print(f"  • Síntomas Frecuentes: {metricas['sintomas_frecuentes']}")
    assert metricas['total_reportes'] >= 6
    print("  ✓ Las métricas se actualizan dinámicamente.")

    print("\n" + "=" * 70)
    print("🎉 TODAS LAS PRUEBAS DEL PIPELINE DE GEMMA PASARON EXITOSAMENTE")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
