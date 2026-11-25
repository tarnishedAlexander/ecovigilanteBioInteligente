import { Comunidad, Bioindicador, Reporte, Metricas, RioGeoJSON } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async getHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getRios(): Promise<RioGeoJSON> {
    const res = await fetch(`${API_BASE}/rios`);
    if (!res.ok) throw new Error('Error al cargar ríos');
    return res.json();
  },

  async getComunidades(): Promise<Comunidad[]> {
    const res = await fetch(`${API_BASE}/comunidades`);
    if (!res.ok) throw new Error('Error al cargar comunidades');
    return res.json();
  },

  async getBioindicadores(): Promise<Bioindicador[]> {
    const res = await fetch(`${API_BASE}/bioindicadores`);
    if (!res.ok) throw new Error('Error al cargar bioindicadores');
    return res.json();
  },

  async getReportes(estado?: string, comunidadId?: string): Promise<Reporte[]> {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (comunidadId) params.append('comunidad_id', comunidadId);
    
    const url = `${API_BASE}/reportes${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar reportes');
    return res.json();
  },

  async updateReporteEstado(id: string, estado: string, notasInvestigador?: string): Promise<Reporte> {
    const res = await fetch(`${API_BASE}/reportes/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado,
        notas_investigador: notasInvestigador,
        investigador_id: 'dr_investigador_principal'
      })
    });
    if (!res.ok) throw new Error('Error al actualizar estado del reporte');
    return res.json();
  },

  async getMetricas(): Promise<Metricas> {
    const res = await fetch(`${API_BASE}/metricas`);
    if (!res.ok) throw new Error('Error al cargar métricas');
    return res.json();
  }
};
