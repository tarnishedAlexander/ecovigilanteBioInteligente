import React, { useState } from 'react';
import { ArrowLeft, Check, Crosshair, ExternalLink, Minus, Pickaxe, X } from 'lucide-react';
import { Comunidad, Reporte, Sitio, Taxon } from '../types';
import { CATEGORIAS, SINTOMAS, formatCoord, formatFecha, normalize, estadoTone } from '../lib/ui';
import {
  FOTOS_BIOINDICADOR,
  FOTOS_COMUNIDAD,
  FOTOS_REPORTE,
  Foto,
  TESTIMONIOS,
} from '../data/expedientes';
import { FOTOS_TERRITORIO } from '../data/fotosTerritorio';
import { EstadoPill, Field, RiskPill, ScoreBar, Section, Stat } from './primitives';
import { BioView, BioindicadoresPotenciales, EstadoChip, SitioView } from './BioViews';
import type { IndiceBio } from '../lib/bio';
import {
  ANIO_RECIENTE,
  DatosMineria,
  RADIO_CERCANIA_KM,
  ZonaMinera,
  comunidadesCercanas,
  describirAnio,
  formatKm,
  formatKm2,
  huellaCercana,
  periodoDe,
} from '../lib/mineria';

export type Seleccion =
  | { tipo: 'comunidad'; comunidad: Comunidad }
  | { tipo: 'bioindicador'; bio: Taxon }
  | { tipo: 'sitio'; sitio: Sitio }
  | { tipo: 'reporte'; reporte: Reporte; desde?: Comunidad }
  | { tipo: 'zona'; zona: ZonaMinera };

interface DetailPanelProps {
  seleccion: Seleccion;
  comunidades: Comunidad[];
  reportes: Reporte[];
  bio: IndiceBio | null;
  onClose: () => void;
  onSelectComunidad: (c: Comunidad) => void;
  onSelectBio: (t: Taxon) => void;
  onSelectSitio: (s: Sitio) => void;
  onSelectReporte: (r: Reporte, desde?: Comunidad) => void;
  onUpdateEstado: (id: string, estado: string, notas?: string) => Promise<void>;
  onCenter: (lat: number, lng: number) => void;
  mineria: DatosMineria | null;
  onSelectZona: (zona: ZonaMinera) => void;
}

/* ---------- Shared bits ---------- */

const Credito: React.FC<{ foto: Foto }> = ({ foto }) => (
  <a
    href={foto.fuente}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 text-[10px] text-ink-3 hover:text-ink"
  >
    Foto referencial · Wikimedia Commons <ExternalLink className="h-3 w-3" />
  </a>
);

const Galeria: React.FC<{ fotos: Foto[] }> = ({ fotos }) => {
  const [activa, setActiva] = useState(0);
  if (fotos.length === 0) return null;
  const foto = fotos[Math.min(activa, fotos.length - 1)];
  return (
    <figure className="px-5 pb-4">
      <img src={foto.src} alt={foto.titulo} className="h-48 w-full rounded border border-line object-cover" />
      <figcaption className="mt-1.5 flex items-start justify-between gap-3">
        <span className="text-[12px] text-ink-2">{foto.titulo}</span>
        <Credito foto={foto} />
      </figcaption>
      {fotos.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {fotos.map((f, i) => (
            <button
              key={f.src}
              onClick={() => setActiva(i)}
              className={`h-11 w-16 overflow-hidden rounded border-2 ${i === activa ? 'border-forest-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
              aria-label={`Ver foto: ${f.titulo}`}
            >
              <img src={f.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
};

const Header: React.FC<{ onBack?: () => void; backLabel?: string; onClose: () => void; aside?: React.ReactNode }> = ({
  onBack,
  backLabel,
  onClose,
  aside,
}) => (
  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-5 py-2.5">
    {onBack ? (
      <button onClick={onBack} className="flex items-center gap-1 text-[13px] font-medium text-forest-600 hover:text-forest-700">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </button>
    ) : (
      <span />
    )}
    <div className="flex items-center gap-2">
      {aside}
      <button onClick={onClose} className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink" aria-label="Cerrar panel">
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/* ---------- Mining ---------- */

const zonaColor = (zona: ZonaMinera) => periodoDe(Math.max(...Object.keys(zona.por_anio).map(Number))).color;

/** Community panel: satellite mining footprint within RADIO_CERCANIA_KM. */
const HuellaMineraCercana: React.FC<{
  c: Comunidad;
  mineria: DatosMineria | null;
  onSelectZona: (zona: ZonaMinera) => void;
}> = ({ c, mineria, onSelectZona }) => {
  const h = React.useMemo(() => (mineria ? huellaCercana(mineria, c.latitud, c.longitud) : null), [mineria, c]);
  return (
    <Section title="Huella minera cercana" aside={<span className="text-[11px] text-ink-3">satélite · {RADIO_CERCANIA_KM} km</span>}>
      {!h ? (
        <p className="text-[13px] text-ink-3">Cargando huella minera…</p>
      ) : (
        <>
          {h.celdas > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
              <Stat label={`Cuadros con huella a ≤ ${h.radioKm} km`} value={h.celdas} />
              <Stat label={`Nuevos en ${ANIO_RECIENTE}–26`} value={h.recientes} />
            </div>
          ) : (
            <p className="mb-3 text-[13px] leading-relaxed text-ink-2">Sin huella minera detectada a menos de {h.radioKm} km.</p>
          )}
          {h.zonas.length > 0 && (
            <ul className="mining-nearby">
              {h.zonas.slice(0, 5).map(({ zona, km }) => (
                <li key={zona.id}>
                  <button onClick={() => onSelectZona(zona)}>
                    <span className="mining-badge" style={{ ['--zona' as string]: zonaColor(zona) }}>
                      <Pickaxe size={13} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong>
                        {h.celdas > 0 ? '' : 'Más cercana: '}
                        {zona.nombre}
                      </strong>
                      <small>
                        {formatKm2(zona.km2)} · desde {describirAnio(zona.primer_anio)}
                        {zona.recientes > 0 ? ` · +${zona.recientes} nuevas` : ''}
                      </small>
                    </span>
                    <b>{formatKm(km)}</b>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] leading-snug text-ink-3">
            Distancia en línea recta al cuadro más cercano. El mercurio viaja con la corriente: confirma si la zona está aguas
            arriba de la comunidad.
          </p>
        </>
      )}
    </Section>
  );
};

/** Bars of newly detected cells per year, colored like the map layer. */
const EvolucionAnual: React.FC<{ zona: ZonaMinera }> = ({ zona }) => {
  const anios = Array.from({ length: 2026 - 2018 + 1 }, (_, i) => 2018 + i);
  const valores = anios.map((a) => zona.por_anio[String(a)] ?? 0);
  const max = Math.max(...valores, 1);
  const ultimo = anios.length - 1;
  const pico = valores.indexOf(max);
  return (
    <figure>
      <div
        className="zona-bars"
        role="img"
        aria-label={`Cuadros nuevos por año: ${anios.map((a, i) => `${a}: ${valores[i]}`).join(', ')}`}
      >
        {anios.map((a, i) => (
          <div key={a} className="zona-bar" title={`${describirAnio(a)}: ${valores[i]} cuadros nuevos`}>
            <span
              className="zona-bar-fill"
              style={{ height: `${(valores[i] / max) * 100}%`, background: periodoDe(a).color, minHeight: valores[i] ? 3 : 0 }}
            />
            {(i === pico || i === ultimo) && (
              <span className="zona-bar-value" style={{ bottom: `calc(${(valores[i] / max) * 100}% + 3px)` }}>
                {valores[i]}
              </span>
            )}
            <span className="zona-bar-label">{String(a).slice(2)}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 text-[11px] leading-snug text-ink-3">
        Cuadros detectados por primera vez cada año. 2018 incluye minería anterior; 2025–26 aún es provisional.
      </figcaption>
    </figure>
  );
};

const ZonaView: React.FC<{
  zona: ZonaMinera;
  mineria: DatosMineria;
  comunidades: Comunidad[];
  onSelectComunidad: (c: Comunidad) => void;
}> = ({ zona, mineria, comunidades, onSelectComunidad }) => {
  const cercanas = React.useMemo(() => comunidadesCercanas(mineria, zona, comunidades), [mineria, zona, comunidades]);
  return (
    <>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-1.5">
          <span className="mining-chip">
            <Pickaxe className="h-3 w-3" aria-hidden="true" /> Huella detectada por satélite
          </span>
        </div>
        <h2 className="community-title font-serif text-[24px] font-semibold leading-tight text-ink">Zona minera · {zona.nombre}</h2>
        <p className="text-[13px] text-ink-3">
          Municipio de {zona.municipio} · {zona.departamento}
        </p>
      </div>

      <div className="mx-5 mb-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
        <Stat label="Área de cuadros con huella" value={formatKm2(zona.km2)} />
        <Stat label="Cuadros detectados" value={zona.celdas} />
        <Stat label="Primera detección" value={describirAnio(zona.primer_anio)} />
        <Stat label={`Nuevos en ${ANIO_RECIENTE}–26`} value={zona.recientes} />
      </div>

      <Section title="Evolución por año">
        <EvolucionAnual zona={zona} />
      </Section>

      <Section title="Comunidades cercanas" aside={<span className="text-[11px] text-ink-3">≤ 150 km</span>}>
        {cercanas.length === 0 ? (
          <p className="text-[13px] text-ink-3">Ninguna comunidad monitoreada a menos de 150 km.</p>
        ) : (
          <ul className="mining-nearby">
            {cercanas.map(({ comunidad, km }) => (
              <li key={comunidad.id}>
                <button onClick={() => onSelectComunidad(comunidad)}>
                  <span className="min-w-0 flex-1">
                    <strong>{comunidad.nombre}</strong>
                    <small>{comunidad.cuenca_principal}</small>
                  </span>
                  <RiskPill nivel={comunidad.alerta_nivel} />
                  <b>{formatKm(km)}</b>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Distancia en línea recta. El riesgo es mayor para las comunidades aguas abajo de la zona.
        </p>
      </Section>

      <Section title="Sobre este dato">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Un modelo de IA analiza imágenes Sentinel-2 y marca cuadros de ~480 m con huella de minería aurífera. No distingue minería
          legal de ilegal ni identifica a los operadores. {zona.confirmadas} de {zona.celdas} cuadros están confirmados; el resto es
          provisional.
        </p>
        <p className="mt-2 text-[11px] text-ink-3">
          Fuente:{' '}
          <a href={mineria.url} target="_blank" rel="noreferrer" className="underline">
            Amazon Mining Watch
          </a>{' '}
          ({mineria.licencia}), datos del {mineria.version.split(' ')[0]}.
        </p>
      </Section>
    </>
  );
};

/* ---------- Community ---------- */

const ComunidadView: React.FC<{
  c: Comunidad;
  reportes: Reporte[];
  bio: IndiceBio | null;
  onSelectBio: (t: Taxon) => void;
  onSelectReporte: (r: Reporte) => void;
  mineria: DatosMineria | null;
  onSelectZona: (zona: ZonaMinera) => void;
}> = ({ c, reportes, bio, onSelectBio, onSelectReporte, mineria, onSelectZona }) => {
  const cover = FOTOS_TERRITORIO[c.id];
  const photos = FOTOS_COMUNIDAD[c.id] ?? [];
  const actividad = [...reportes].sort((a, b) => b.fecha_reporte.localeCompare(a.fecha_reporte)).slice(0, 5);
  const entrevistas = reportes.map((r) => r.entrevista_ia).filter((e): e is NonNullable<typeof e> => !!e);
  const verificados = reportes.filter((r) => r.estado === 'verificado').length;
  const promedio = reportes.length
    ? (reportes.reduce((s, r) => s + r.score_sospecha, 0) / reportes.length).toFixed(1)
    : '—';

  const sintomas = Object.keys(SINTOMAS)
    .map((key) => ({ key, count: entrevistas.filter((e) => e.sintomas[key as keyof typeof e.sintomas]).length }))
    .sort((a, b) => b.count - a.count);

  // Voices: hand-written demo quotes + what came in through the reports.
  const voces = [
    ...(TESTIMONIOS[c.id] ?? []).map((t) => ({ ...t, demo: true })),
    ...reportes
      .map((r) => r.entrevista_ia?.indicio_ambiental_adicional || r.descripcion_usuario)
      .filter((t): t is string => !!t)
      .map((texto) => ({ texto, quien: 'Reporte comunitario', demo: false })),
  ];

  const especies = Array.from(new Set(entrevistas.flatMap((e) => e.tipos_pescado_mencionados.map(normalize))));
  const especiesInfo = especies.map((nombre) => ({
    nombre,
    taxon: bio?.catalogo.taxones.find((t) => t.nivel === 'especie' && normalize(t.nombre_comun).includes(nombre)),
  }));

  return (
    <>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-1.5">
          <RiskPill nivel={c.alerta_nivel} prefix="Riesgo " />
        </div>
        <h2 className="community-title font-serif text-[24px] font-semibold leading-tight text-ink">{c.nombre}</h2>
        <p className="text-[13px] text-ink-3">
          {c.cuenca_principal} · {c.departamento}
        </p>
      </div>

      <Galeria fotos={cover ? [cover, ...photos.filter((p) => p.fuente !== cover.fuente)] : photos} />

      <div className="mx-5 mb-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
        <Stat label="Habitantes (est.)" value={c.poblacion_estimada.toLocaleString('es-BO')} />
        <Stat label="Reportes de comunarios" value={reportes.length} />
        <Stat label="Reportes verificados" value={verificados} />
        <Stat label="Sospecha promedio (1–5)" value={promedio} />
      </div>

      <HuellaMineraCercana c={c} mineria={mineria} onSelectZona={onSelectZona} />

      <Section title="Actividad reciente">
        {actividad.length === 0 ? <p className="text-[13px] text-ink-3">Aún no hay actividad registrada.</p> : (
          <ol className="activity-list">
            {actividad.map((r) => (
              <li key={r.id}>
                <time>{formatFecha(r.fecha_reporte)}</time>
                <button onClick={() => onSelectReporte(r)}>
                  <strong>{CATEGORIAS[r.categoria] ?? r.categoria}</strong>
                  <span>Reporte comunitario · {estadoTone(r.estado).label}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Posible fuente aguas arriba">
        <p className="text-[13px] leading-relaxed text-ink-2">{c.posible_fuente_minera_aguas_arriba}</p>
      </Section>

      <BioindicadoresPotenciales c={c} idx={bio} onSelectTaxon={onSelectBio} />

      {voces.length > 0 && (
        <Section title="Lo que dicen los comunarios">
          <ul className="space-y-2.5">
            {voces.map((v, i) => (
              <li key={i} className="border-l-2 border-line-strong pl-3">
                <p className="text-[13px] leading-relaxed text-ink">“{v.texto}”</p>
                <p className="mt-0.5 text-[11px] text-ink-3">
                  {v.quien} · anónimo{v.demo ? ' · demo' : ''}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Síntomas referidos" aside={<span className="text-[11px] text-ink-3">{entrevistas.length} entrevistas</span>}>
        {entrevistas.length === 0 ? (
          <p className="text-[13px] text-ink-3">Aún no hay entrevistas en esta comunidad.</p>
        ) : (
          <ul className="space-y-2">
            {sintomas.map(({ key, count }) => (
              <li key={key} title={`${SINTOMAS[key]}: ${count} de ${entrevistas.length}`}>
                <div className="mb-0.5 flex justify-between text-[12px]">
                  <span className={count ? 'text-ink' : 'text-ink-3'}>{SINTOMAS[key]}</span>
                  <span className="font-semibold text-ink-2">
                    {count}/{entrevistas.length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-paper">
                  <div className="h-1.5 rounded-full bg-clay" style={{ width: `${(count / entrevistas.length) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {especiesInfo.length > 0 && (
        <Section title="Especies que consume la comunidad">
          <ul className="divide-y divide-line rounded border border-line">
            {especiesInfo.map(({ nombre, taxon }) => (
              <li key={nombre}>
                <button
                  disabled={!taxon}
                  onClick={() => taxon && onSelectBio(taxon)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left enabled:hover:bg-paper"
                >
                  <div className="h-9 w-11 shrink-0 overflow-hidden rounded bg-paper">
                    {taxon && FOTOS_BIOINDICADOR[taxon.id] && (
                      <img src={FOTOS_BIOINDICADOR[taxon.id].src} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] capitalize text-ink">{nombre}</div>
                    <div className="text-[11px] italic text-ink-3">{taxon ? taxon.nombre_cientifico : 'Sin ficha en el catálogo'}</div>
                  </div>
                  {taxon && bio && <EstadoChip t={taxon} idx={bio} />}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Reportes de la comunidad">
        {reportes.length === 0 ? (
          <p className="text-[13px] text-ink-3">Sin reportes registrados.</p>
        ) : (
          <ul className="-mx-5 divide-y divide-line border-y border-line">
            {reportes.map((r) => (
              <li key={r.id}>
                <button onClick={() => onSelectReporte(r)} className="relative block w-full px-5 py-3 text-left hover:bg-paper">
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: estadoTone(r.estado).color }} />
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{CATEGORIAS[r.categoria] ?? r.categoria}</span>
                    <EstadoPill estado={r.estado} />
                  </div>
                  <p className="line-clamp-2 text-[12px] leading-snug text-ink-2">
                    {r.descripcion_usuario || 'Reporte de síntomas o indicio ambiental'}
                  </p>
                  <div className="mt-1 text-[11px] text-ink-3">
                    {formatFecha(r.fecha_reporte)} · sospecha {r.score_sospecha}/5
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
};

/* ---------- Report ---------- */

const ReporteView: React.FC<{
  r: Reporte;
  onUpdateEstado: (id: string, estado: string, notas?: string) => Promise<void>;
  onCenter: (lat: number, lng: number) => void;
}> = ({ r, onUpdateEstado, onCenter }) => {
  const [notasTemp, setNotasTemp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const foto = FOTOS_REPORTE[r.id];

  const handleUpdate = async (nuevoEstado: string) => {
    setSaving(true);
    setSaveError(false);
    try {
      await onUpdateEstado(r.id, nuevoEstado, notasTemp || r.notas_investigador);
      setNotasTemp('');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-1.5 flex items-center gap-2">
          <EstadoPill estado={r.estado} />
          <span className="text-[12px] text-ink-3">{formatFecha(r.fecha_reporte)}</span>
        </div>
        <h2 className="font-serif text-[20px] font-semibold leading-snug text-ink">
          {CATEGORIAS[r.categoria] ?? r.categoria} · {r.comunidad_nombre}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{r.descripcion_usuario || 'Sin descripción del comunario.'}</p>
      </div>

      {(r.url_foto || foto) && (
        <figure className="px-5 pb-4">
          <img src={r.url_foto || foto?.src} alt={r.url_foto ? 'Foto adjunta al reporte' : foto?.titulo} className="h-44 w-full rounded border border-line object-cover" />
          <figcaption className="mt-1.5 flex items-start justify-between gap-3">
            <span className="text-[12px] text-ink-2">{r.url_foto ? 'Foto adjunta al reporte' : 'Imagen referencial'}</span>
            {!r.url_foto && foto && <Credito foto={foto} />}
          </figcaption>
        </figure>
      )}

      <Section title="Ubicación">
        <dl>
          <Field label="Comunidad">{r.comunidad_nombre}</Field>
          <Field label="Coordenadas">
            <span className="flex items-center justify-between">
              {formatCoord(r.latitud, r.longitud)}
              <button
                onClick={() => onCenter(r.latitud, r.longitud)}
                className="ml-2 text-forest-600 hover:text-forest-700"
                title="Centrar en el mapa"
                aria-label="Centrar en el mapa"
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </span>
          </Field>
          <Field label="Sincronizado">{formatFecha(r.fecha_sincronizacion)}</Field>
        </dl>
      </Section>

      {r.entrevista_ia && (
        <Section title="Información extraída de la entrevista" aside={<ScoreBar score={r.entrevista_ia.score_sospecha} />}>
          <p className="mb-3 text-[12px] leading-relaxed text-ink-3">Información estructurada para revisión. Los campos reflejan lo registrado en la entrevista.</p>
          <dl className="mb-3">
            <Field label="Consumo de pescado">
              <span className="capitalize">{r.entrevista_ia.frecuencia_consumo_pescado ?? '—'}</span>
            </Field>
            {r.entrevista_ia.tipos_pescado_mencionados.length > 0 && (
              <Field label="Especies">
                <span className="capitalize">{r.entrevista_ia.tipos_pescado_mencionados.join(', ')}</span>
              </Field>
            )}
            {r.entrevista_ia.tiempo_con_sintomas && <Field label="Evolución">{r.entrevista_ia.tiempo_con_sintomas}</Field>}
            {r.entrevista_ia.fuente_agua_comunal && <Field label="Fuente de agua">{r.entrevista_ia.fuente_agua_comunal}</Field>}
          </dl>

          <div className="eyebrow mb-2">Síntomas referidos</div>
          <ul className="divide-y divide-line rounded border border-line">
            {Object.entries(r.entrevista_ia.sintomas).map(([key, val]) => (
              <li key={key} className="flex items-center gap-2.5 px-3 py-2 text-[13px]">
                {val ? <Check className="h-4 w-4 shrink-0 text-clay" /> : <Minus className="h-4 w-4 shrink-0 text-line-strong" />}
                <span className={val ? 'text-ink' : 'text-ink-3'}>{SINTOMAS[key] ?? key}</span>
              </li>
            ))}
          </ul>

          {r.entrevista_ia.indicio_ambiental_adicional && (
            <blockquote className="mt-3 border-l-2 border-ochre bg-ochre-bg/60 px-3 py-2 text-[13px] leading-relaxed text-ink-2">
              <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-ochre">Observación ambiental</span>
              {r.entrevista_ia.indicio_ambiental_adicional}
            </blockquote>
          )}
        </Section>
      )}

      <Section title="Evaluación del investigador">
        {r.notas_investigador && (
          <div className="mb-3 rounded border border-line bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink-2">
            <span className="mb-0.5 block text-[11px] font-semibold text-ink-3">Notas registradas</span>
            {r.notas_investigador}
          </div>
        )}
        <label htmlFor="notas" className="mb-1 block text-[12px] text-ink-3">
          Nueva nota o criterio de muestreo
        </label>
        <textarea
          id="notas"
          value={notasTemp}
          onChange={(e) => setNotasTemp(e.target.value)}
          placeholder="Ej.: programar muestreo de cabello y sedimento…"
          className="h-20 w-full resize-none rounded border border-line-strong bg-surface p-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
        />
        {saveError && <p role="alert" className="mt-2 text-[13px] text-clay">No se pudo guardar la evaluación. Tu nota sigue aquí; intenta de nuevo.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button disabled={saving} onClick={() => handleUpdate('semiverificado')} className="btn-secondary">
            Marcar semiverificado
          </button>
          <button disabled={saving} onClick={() => handleUpdate('verificado')} className="btn-primary">
            Verificar (laboratorio)
          </button>
        </div>
      </Section>
    </>
  );
};

/* ---------- Panel shell ---------- */

export const DetailPanel: React.FC<DetailPanelProps> = ({
  seleccion,
  comunidades,
  reportes,
  bio,
  onClose,
  onSelectComunidad,
  onSelectBio,
  onSelectSitio,
  onSelectReporte,
  onUpdateEstado,
  onCenter,
  mineria,
  onSelectZona,
}) => {
  // Re-key on every selection so scroll resets and the entrance animation replays.
  const key =
    seleccion.tipo === 'comunidad'
      ? seleccion.comunidad.id
      : seleccion.tipo === 'bioindicador'
        ? seleccion.bio.id
        : seleccion.tipo === 'zona'
          ? seleccion.zona.id
          : seleccion.tipo === 'sitio'
            ? seleccion.sitio.id
            : seleccion.reporte.id;

  return (
    <aside
      key={key}
      className="panel-right card absolute bottom-3 right-3 top-3 z-[1000] flex w-[420px] flex-col overflow-hidden shadow-lg"
    >
      {seleccion.tipo === 'reporte' ? (
        <Header
          onBack={seleccion.desde ? () => onSelectComunidad(seleccion.desde!) : undefined}
          backLabel={seleccion.desde ? `Volver a ${seleccion.desde.nombre}` : undefined}
          onClose={onClose}
          aside={<span className="font-mono text-[11px] text-ink-3">{seleccion.reporte.id}</span>}
        />
      ) : (
        <Header onClose={onClose} aside={<span className="eyebrow">{seleccion.tipo === 'comunidad' ? 'Comunidad' : seleccion.tipo === 'zona' ? 'Zona minera' : seleccion.tipo === 'sitio' ? 'Sitio de muestreo' : 'Bioindicador'}</span>} />
      )}

      <div className="flex-1 overflow-y-auto">
        {seleccion.tipo === 'comunidad' && (
          <ComunidadView
            c={seleccion.comunidad}
            reportes={reportes.filter((r) => r.comunidad_id === seleccion.comunidad.id)}
            bio={bio}
            onSelectBio={onSelectBio}
            onSelectReporte={(r) => onSelectReporte(r, seleccion.comunidad)}
            mineria={mineria}
            onSelectZona={onSelectZona}
          />
        )}
        {seleccion.tipo === 'bioindicador' && bio && (
          <BioView t={seleccion.bio} idx={bio} onSelectTaxon={onSelectBio} onSelectSitio={onSelectSitio} />
        )}
        {seleccion.tipo === 'sitio' && bio && <SitioView s={seleccion.sitio} idx={bio} onSelectTaxon={onSelectBio} />}
        {seleccion.tipo === 'zona' && mineria && (
          <ZonaView zona={seleccion.zona} mineria={mineria} comunidades={comunidades} onSelectComunidad={onSelectComunidad} />
        )}
        {seleccion.tipo === 'reporte' && (
          <ReporteView r={seleccion.reporte} onUpdateEstado={onUpdateEstado} onCenter={onCenter} />
        )}
      </div>
    </aside>
  );
};
