export interface PendingReport {
  id: string;
  latitud: number;
  longitud: number;
  categoria: 'pez' | 'agua' | 'planta' | 'salud' | 'mineria';
  descripcion_usuario?: string;
  url_foto?: string;
  comunidad_nombre?: string;
  transcripcion_chat?: string;
  fecha_local: string;
  sincronizado: boolean;
  score_sospecha?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemma';
  text: string;
  timestamp: string;
}
