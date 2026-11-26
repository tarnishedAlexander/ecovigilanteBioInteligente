/// <reference types="vite/client" />
import { Comunidad, CatalogoBioindicadores, Investigacion, Reporte, Metricas, RioGeoJSON } from '../types';

// Local backend only in development. A deployed build must get VITE_API_BASE_URL explicitly:
// falling back to localhost would make a public page try to reach the visitor's own machine.
const API_BASE: string = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '');
// Researcher key for write actions. Only needed when the backend defines ADMIN_API_KEY.
const API_KEY: string | undefined = import.meta.env.VITE_API_KEY;

export const api = {
  async getHealth(): Promise<boolean> {
    if (!API_BASE) return false;
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

  async getBioindicadores(): Promise<CatalogoBioindicadores> {
    const res = await fetch(`${API_BASE}/bioindicadores`);
    if (!res.ok) throw new Error('Error al cargar bioindicadores');
    return res.json();
  },

  async getInvestigacion(): Promise<Investigacion> {
    const res = await fetch(`${API_BASE}/investigacion`);
    if (!res.ok) throw new Error('Error al cargar investigación');
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
      headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
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
