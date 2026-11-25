import { PendingReport } from '../types';

const STORAGE_KEY = 'ecoguardian_pending_reports_v1';
const API_URL = 'http://localhost:8000/api/v1';

export const storageService = {
  getReports(): PendingReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveReport(report: PendingReport): void {
    const list = this.getReports();
    list.unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  updateReport(id: string, updates: Partial<PendingReport>): void {
    const list = this.getReports();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  },

  deleteReport(id: string): void {
    const list = this.getReports().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  async syncReport(report: PendingReport): Promise<boolean> {
    try {
      const payload: any = {
        latitud: report.latitud,
        longitud: report.longitud,
        categoria: report.categoria,
        descripcion_usuario: report.descripcion_usuario,
        url_foto: report.url_foto,
        comunidad_nombre: report.comunidad_nombre
      };

      if (report.transcripcion_chat) {
        payload.transcripcion_chat = report.transcripcion_chat;
      }

      const res = await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.updateReport(report.id, { sincronizado: true });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Sync failed:', e);
      return false;
    }
  },

  async syncAllPending(): Promise<{ synced: number; failed: number }> {
    const list = this.getReports().filter(r => !r.sincronizado);
    let synced = 0;
    let failed = 0;

    for (const rep of list) {
      const success = await this.syncReport(rep);
      if (success) synced++;
      else failed++;
    }

    return { synced, failed };
  }
};
