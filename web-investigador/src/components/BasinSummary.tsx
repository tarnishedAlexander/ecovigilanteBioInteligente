import { useEffect, useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import type { Comunidad, Metricas } from '../types';
import { NIVELES, normalize } from '../lib/ui';

export function BasinSummary({ comunidades, metricas }: { comunidades: Comunidad[]; metricas: Metricas | null }) {
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)');
    const update = () => setExpanded(wide.matches);
    wide.addEventListener('change', update);
    return () => wide.removeEventListener('change', update);
  }, []);
  const levels = NIVELES.map((level) => ({
    ...level, count: comunidades.filter((place) => normalize(place.alerta_nivel) === normalize(level.key)).length,
  }));
  return (
    <aside className="basin-summary glass" aria-label="Resumen de la cuenca">
      <button className="summary-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <Activity size={17} /><strong>Resumen de la cuenca</strong><ChevronDown size={16} />
      </button>
      {expanded && <div className="summary-body">
        <dl className="summary-metrics">
          <div><dt>Comunidades</dt><dd>{metricas || comunidades.length ? comunidades.length : '—'}</dd></div>
          <div><dt>Reportes</dt><dd>{metricas?.total_reportes ?? '—'}</dd></div>
          <div><dt>Por revisar</dt><dd>{metricas?.en_crudo ?? '—'}</dd></div>
        </dl>
        <h3>Nivel de alerta comunitaria</h3>
        <div className="risk-strip" aria-hidden="true">{levels.filter(l => l.count).map(l =>
          <span key={l.key} style={{ flexGrow: l.count, background: l.color }} />
        )}</div>
        <ul className="risk-key">{levels.map(l => <li key={l.key}><i style={{ background: l.color }} />{l.label} <b>{l.count}</b></li>)}</ul>
      </div>}
    </aside>
  );
}
