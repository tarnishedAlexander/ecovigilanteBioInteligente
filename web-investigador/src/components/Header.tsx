import { Fish, Layers3, NotebookTabs, Pickaxe, RefreshCw, Waves } from 'lucide-react';

const sections = [
  { id: 'comunidades', label: 'Territorio', Icon: Layers3 },
  { id: 'bioindicadores', label: 'Bioindicadores', Icon: Fish },
  { id: 'mineria', label: 'Minería', Icon: Pickaxe },
  { id: 'reportes', label: 'Reportes', Icon: NotebookTabs },
] as const;

export type AtlasSection = typeof sections[number]['id'];

interface Props {
  active: AtlasSection;
  onNavigate: (section: AtlasSection) => void;
  loading: boolean;
  onRefresh: () => void;
  backendOnline: boolean;
}

export function Header({ active, onNavigate, loading, onRefresh, backendOnline }: Props) {
  return (
    <header className="atlas-header">
      <div className="wordmark"><span className="brand-symbol"><Waves size={23}/></span>
        <span>EcoVigilante</span><span className="brand-atlas">Atlas</span>
      </div>
      <nav className="atlas-nav" aria-label="Secciones del atlas">
        {sections.map(({ id, label, Icon }) => (
          <button key={id} aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
            <Icon size={16}/>{label}
          </button>
        ))}
      </nav>
      <div className="atlas-session">
        <span className={backendOnline ? 'online' : ''}>{loading ? 'Actualizando' : backendOnline ? 'Conectado' : 'Sin conexión'}</span>
        <button aria-label="Actualizar datos" title="Actualizar datos" onClick={onRefresh} disabled={loading}><RefreshCw size={16}/></button>
      </div>
    </header>
  );
}
