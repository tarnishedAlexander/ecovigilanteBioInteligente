import React from 'react';
import { Check, Copy, ExternalLink, MapPin, Star } from 'lucide-react';
import type { Comunidad, Medicion, Sitio, Taxon } from '../types';
import { FOTOS_BIOINDICADOR } from '../data/expedientes';
import {
  ALCANCES,
  ESTADOS_TAXON,
  IndiceBio,
  RELACIONES,
  bioindicadoresEnDepartamento,
  describirMedicion,
  estadoTaxon,
  evidencia,
  formatValor,
  gbifUrl,
  grupoLabel,
  limiteConsumo,
  fotoPagina,
  fotoUrl,
  fundamentosDe,
  mejorBase,
  propuestaEstudio,
  similitudes,
  TIPOS_FUNDAMENTO,
  SIMILITUD,
  SOLIDEZ_COLOR,
  valorDestacado,
} from '../lib/bio';
import { Section } from './primitives';

/** "Pisconte et al. 2024" from the full citation. */
const citaCorta = (cita: string) => cita.match(/^(.*?\b(?:19|20)\d{2})\b/)?.[1] ?? cita.split('.')[0];

const linkClass = 'underline decoration-line-strong underline-offset-2 hover:decoration-ink';

export const EstadoChip: React.FC<{ t: Taxon; idx: IndiceBio }> = ({ t, idx }) => {
  const e = ESTADOS_TAXON[estadoTaxon(t, idx)];
  return (
    <span className="bio-chip">
      <i style={{ background: e.color }} />
      {e.label}
    </span>
  );
};

const AlcanceChip: React.FC<{ s: Sitio }> = ({ s }) => (
  <span className="bio-chip">
    <i style={{ background: ALCANCES[s.alcance].color }} />
    {ALCANCES[s.alcance].label}
  </span>
);

/** One published measurement: value, tissue, site and source. */
const MedicionItem: React.FC<{
  m: Medicion;
  idx: IndiceBio;
  mostrarTaxon?: boolean;
  onSelectSitio?: (s: Sitio) => void;
  onSelectTaxon?: (t: Taxon) => void;
}> = ({ m, idx, mostrarTaxon, onSelectSitio, onSelectTaxon }) => {
  const sitio = idx.sitio.get(m.sitio)!;
  const taxon = idx.taxon.get(m.taxon)!;
  const fuente = idx.fuente.get(m.fuente)!;
  const limite = limiteConsumo(m, taxon);
  return (
    <li>
      {mostrarTaxon && (
        <div className="mb-0.5 text-[13px] font-medium text-ink">
          {onSelectTaxon ? (
            <button className={linkClass} onClick={() => onSelectTaxon(taxon)}>
              {taxon.nombre_comun}
            </button>
          ) : (
            taxon.nombre_comun
          )}
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-ink">{formatValor(m)}</span>
        {!mostrarTaxon && <AlcanceChip s={sitio} />}
      </div>
      <div className="mt-0.5 text-[12px] text-ink-2">{describirMedicion(m)}</div>
      {limite && (
        <div className={`mt-0.5 text-[11px] font-semibold ${limite.supera ? 'text-clay' : 'text-moss'}`}>
          {limite.supera ? 'Supera' : 'Bajo'} el límite de consumo de {limite.limite} mg/kg (Codex Alimentarius)
        </div>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-3">
        {!mostrarTaxon && (onSelectSitio && sitio.lat !== null ? (
          <button className={`inline-flex items-center gap-1 ${linkClass}`} onClick={() => onSelectSitio(sitio)}>
            <MapPin className="h-3 w-3" /> {sitio.nombre}
          </button>
        ) : (
          <span>{sitio.nombre}</span>
        ))}
        {!mostrarTaxon && sitio.pais && <span>· {sitio.pais} ·</span>}
        <a href={fuente.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
          {citaCorta(fuente.cita)} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {m.nota && <p className="mt-1 text-[11px] leading-snug text-ink-3">{m.nota}</p>}
    </li>
  );
};

/* ---------- Photo ---------- */

/** Wikimedia Commons photo with author and license, falling back to the curated set. */
export const FotoTaxon: React.FC<{ t: Taxon; alto?: string }> = ({ t, alto = 'h-44' }) => {
  const [error, setError] = React.useState(false);
  const curada = FOTOS_BIOINDICADOR[t.id];
  const src = t.foto ? fotoUrl(t.foto.archivo) : curada?.src;
  const pagina = t.foto ? fotoPagina(t.foto.archivo) : curada?.fuente;
  if (!src || error) return null;
  const credito = t.foto ? [t.foto.autor, t.foto.licencia].filter(Boolean).join(' · ') : 'Foto referencial';
  return (
    <figure className="px-5 pt-4">
      <img src={src} alt={`${t.nombre_comun} (${t.nombre_cientifico})`} onError={() => setError(true)}
        className={`${alto} w-full rounded border border-line bg-paper object-cover`} />
      <figcaption className="mt-1.5 text-right text-[10px] text-ink-3">
        <a href={pagina} target="_blank" rel="noreferrer" className="hover:text-ink">
          {credito} · Wikimedia Commons
        </a>
      </figcaption>
    </figure>
  );
};

/** The measured species this candidate relies on, with point-by-point similarities. */
const ReferenciaCard: React.FC<{ t: Taxon; refId: string; alcance: Sitio['alcance']; idx: IndiceBio }> = ({ t, refId, alcance, idx }) => {
  const ref = idx.taxon.get(refId)!;
  const sims = similitudes(t, ref, alcance);
  const thumb = ref.foto ? fotoUrl(ref.foto.archivo, 160) : FOTOS_BIOINDICADOR[ref.id]?.src;
  return (
    <div className="mt-3 rounded border border-line p-3">
      <div className="eyebrow mb-2">Bioindicador de referencia</div>
      <div className="flex gap-3">
        {thumb && <img src={thumb} alt="" className="h-12 w-14 shrink-0 rounded object-cover" />}
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink">{ref.nombre_comun}</div>
          <div className={`text-[11px] text-ink-3 ${ref.nivel === 'especie' ? 'italic' : ''}`}>{ref.nombre_cientifico}</div>
          <div className="text-[11px] text-ink-3">{[grupoLabel(ref.grupo), ref.familia !== 'Varias' ? ref.familia : null].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <ul className="mt-2 space-y-0.5 text-[12px]">
        {sims.map((x) => (
          <li key={x.label} className="flex items-start gap-1.5">
            <span className={x.ok ? 'text-moss' : 'text-ink-3'}>{x.ok ? '✓' : '–'}</span>
            <span className={x.ok ? 'text-ink' : 'text-ink-3'}>{x.label}</span>
            <span className="ml-auto text-right text-[11px] text-ink-3">{x.detalle}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- Basis for a Bolivian study ---------- */

/** Strength of the evidence, environmental similarity and a copyable study proposal. */
const BaseEstudio: React.FC<{ t: Taxon; idx: IndiceBio }> = ({ t, idx }) => {
  const base = mejorBase(t, idx);
  const texto = React.useMemo(() => propuestaEstudio(t, idx), [t, idx]);
  const [copiado, setCopiado] = React.useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };
  if (!base) return null;
  return (
    <Section title="Disponible para proyecto de investigación">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="bio-chip">
          <i style={{ background: SOLIDEZ_COLOR[base.nivel] }} />
          Solidez {base.nivel.toLowerCase()}
        </span>
        <span className="bio-chip">{RELACIONES[base.relacion]}</span>
        <span className="bio-chip">
          <i style={{ background: ALCANCES[base.alcance].color }} />
          {ALCANCES[base.alcance].label}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2">{SIMILITUD[base.alcance]}</p>
      {base.m.taxon !== t.id && <ReferenciaCard t={t} refId={base.m.taxon} alcance={base.alcance} idx={idx} />}
      {base.otraDieta && (
        <p className="mt-1 text-[12px] leading-snug text-ochre">
          Dieta distinta a la de la referencia ({idx.taxon.get(base.m.taxon)!.dieta.toLowerCase()} frente a {t.dieta.toLowerCase()}): el mercurio se acumula según el nivel trófico, así que el valor esperado puede ser muy diferente.
        </p>
      )}
      <p className="mt-1 text-[12px] leading-snug text-ink-3">
        Todavía no es un bioindicador validado en Bolivia: los valores de referencia se midieron en otra región o en otra especie.
      </p>
      <details className="mt-3 rounded border border-line">
        <summary className="cursor-pointer px-3 py-2 text-[13px] font-medium text-ink">Propuesta de estudio</summary>
        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap border-t border-line px-3 py-2 font-sans text-[12px] leading-relaxed text-ink-2">{texto}</pre>
        <div className="border-t border-line px-3 py-2">
          <button onClick={copiar} className="btn-secondary px-2.5 py-1 text-[12px]">
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? 'Copiado' : 'Copiar propuesta'}
          </button>
        </div>
      </details>
    </Section>
  );
};

/* ---------- Taxon (species, genus or group) ---------- */

export const BioView: React.FC<{
  t: Taxon;
  idx: IndiceBio;
  onSelectTaxon: (t: Taxon) => void;
  onSelectSitio: (s: Sitio) => void;
}> = ({ t, idx, onSelectTaxon, onSelectSitio }) => {
  const { propias, prestadas } = evidencia(t, idx);
  const funds = fundamentosDe(t, idx);
  const parientes = (idx.parientes.get(t.id) ?? []).filter((p) => p.id !== t.id);
  const estado = estadoTaxon(t, idx);

  return (
    <>
      <FotoTaxon t={t} />
      <div className="px-5 pb-4 pt-3">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <EstadoChip t={t} idx={idx} />
          {t.introducida && <span className="bio-chip">Especie introducida</span>}
        </div>
        <h2 className="font-serif text-[24px] font-semibold leading-tight text-ink">{t.nombre_comun}</h2>
        <p className={`text-[13px] text-ink-3 ${t.nivel === 'especie' ? 'italic' : ''}`}>{t.nombre_cientifico}</p>
        <dl className="mt-2 grid grid-cols-[88px_1fr] gap-x-3 gap-y-0.5 text-[12px]">
          <dt className="text-ink-3">Grupo</dt>
          <dd className="text-ink">{grupoLabel(t.grupo)}</dd>
          {t.familia !== 'No aplica' && (<><dt className="text-ink-3">Familia</dt><dd className="text-ink">{t.familia}</dd></>)}
          {t.dieta !== 'No aplica' && (<><dt className="text-ink-3">Dieta</dt><dd className="text-ink">{t.dieta}{t.origen === 'pariente_gbif' ? ' (por confirmar)' : ''}</dd></>)}
        </dl>
        {t.nota && <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{t.nota}</p>}
      </div>

      {t.prioridad && (
        <Section title="Oportunidad de investigación" aside={<Star className="h-4 w-4 text-ochre" aria-hidden="true" />}>
          <p className="text-[13px] leading-relaxed text-ink-2">{t.prioridad.motivo}.</p>
          <p className="mt-1 text-[12px] text-ink-3">Muestra sugerida: {t.prioridad.muestra.toLowerCase()}.</p>
        </Section>
      )}

      {t.nivel !== 'grupo' && t.grupo !== 'abiotico' && (
        <Section title="Presencia en Bolivia" aside={<span className="text-[11px] text-ink-3">GBIF</span>}>
          {t.bolivia && t.bolivia.registros > 0 ? (
            <>
              <p className="text-[13px] text-ink-2">
                <span className="font-semibold text-ink">{t.bolivia.registros.toLocaleString('es-BO')}</span> registros
                {t.bolivia.departamentos.length > 0 && <> · sobre todo en {t.bolivia.departamentos.join(', ')}</>}
              </p>
              <a href={gbifUrl(t.bolivia.gbif_key)} target="_blank" rel="noreferrer" className={`mt-1 inline-flex items-center gap-1 text-[12px] text-forest-600 ${linkClass}`}>
                Ver registros en GBIF <ExternalLink className="h-3 w-3" />
              </a>
            </>
          ) : (
            <p className="text-[13px] text-ink-3">Sin registros en Bolivia. Sirve como referencia para sus parientes bolivianos.</p>
          )}
        </Section>
      )}

      {(estado === 'potencial' || estado === 'candidato' || estado === 'familia') && <BaseEstudio t={t} idx={idx} />}

      {funds.length > 0 && (
        <Section title="¿Por qué podría ser bioindicador?">
          <ul className="space-y-3">
            {funds.map((f) => (
              <li key={f.id}>
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="bio-chip">{TIPOS_FUNDAMENTO[f.tipo]}</span>
                  <strong className="text-[13px] font-medium text-ink">{f.titulo}</strong>
                </div>
                <p className="text-[12px] leading-relaxed text-ink-2">{f.texto}</p>
                <p className="mt-0.5 text-[11px] text-ink-3">
                  {f.fuentes.map((id, i) => {
                    const fu = idx.fuente.get(id)!;
                    return (
                      <React.Fragment key={id}>
                        {i > 0 && '; '}
                        <a href={fu.url} target="_blank" rel="noreferrer" className={linkClass}>{citaCorta(fu.cita)}</a>
                      </React.Fragment>
                    );
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={propias.length ? 'Mercurio medido' : 'Base científica'} aside={<span className="text-[11px] text-ink-3">THg</span>}>
        {propias.length > 0 && (
          <>
            {estado === 'potencial' && (
              <p className="mb-2 text-[12px] leading-snug text-ink-3">
                Medido fuera de Bolivia. La especie vive aquí, pero sin mediciones propias: es una oportunidad de investigación.
              </p>
            )}
            <ul className="bio-meds">
              {propias.map((m) => (
                <MedicionItem key={m.id} m={m} idx={idx} onSelectSitio={onSelectSitio} />
              ))}
            </ul>
          </>
        )}
        {prestadas.length > 0 && (
          <>
            <p className="mb-2 text-[12px] leading-snug text-ink-3">
              Sin mediciones propias. Estos parientes fueron medidos en otros sitios de la Amazonía y sirven de base para un proyecto en Bolivia.
            </p>
            {prestadas.map((p) => (
              <div key={p.taxon.id} className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                  <button className={`font-medium text-ink ${linkClass}`} onClick={() => onSelectTaxon(p.taxon)}>
                    {p.taxon.nombre_comun}
                  </button>
                  <span className="bio-chip">{RELACIONES[p.relacion]}</span>
                </div>
                <ul className="bio-meds">
                  {p.mediciones.map((m) => (
                    <MedicionItem key={m.id} m={m} idx={idx} onSelectSitio={onSelectSitio} />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        {!propias.length && !prestadas.length && (
          <p className="text-[13px] text-ink-3">No hay mediciones publicadas en el corpus para esta especie ni para sus parientes.</p>
        )}
      </Section>

      {parientes.length > 0 && (
        <Section title="Futuros bioindicadores en Bolivia">
          <p className="mb-2 text-[12px] leading-snug text-ink-3">Especies presentes en Bolivia que pueden estudiarse tomando esta como referencia.</p>
          <ul className="bio-meds">
            {parientes.map((p) => (
              <li key={p.id}>
                <button className="w-full text-left" onClick={() => onSelectTaxon(p)}>
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-[13px] font-medium text-ink">{p.nombre_comun}</strong>
                    <span className="bio-chip">{RELACIONES[p.referencias.find((r) => r.taxon === t.id)!.relacion]}</span>
                  </span>
                  <span className="text-[11px] italic text-ink-3">{p.nombre_cientifico}</span>
                  {p.bolivia && (
                    <span className="block text-[11px] text-ink-3">
                      {p.bolivia.registros.toLocaleString('es-BO')} registros en Bolivia
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
};

/* ---------- Sampling site ---------- */

const CONTEXTOS: Record<Sitio['contexto'], string> = {
  minero: 'Zona con minería',
  referencia: 'Sitio de referencia, sin minería directa',
  mixto: 'Sitios con y sin minería',
  mercado: 'Pescado comprado en mercados',
  desconocido: 'Contexto no indicado',
};

export const SitioView: React.FC<{
  s: Sitio;
  idx: IndiceBio;
  onSelectTaxon: (t: Taxon) => void;
}> = ({ s, idx, onSelectTaxon }) => {
  const meds = idx.porSitio.get(s.id) ?? [];
  return (
    <>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-1.5">
          <AlcanceChip s={s} />
        </div>
        <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink">{s.nombre}</h2>
        <p className="text-[13px] text-ink-3">{[s.region, s.pais].filter(Boolean).join(', ')}</p>
        <p className="mt-1 text-[12px] text-ink-3">
          {CONTEXTOS[s.contexto]}
          {s.precision === 'aproximada' && ' · ubicación aproximada'}
        </p>
      </div>
      <Section title="Mediciones en este sitio" aside={<span className="text-[11px] text-ink-3">{meds.length}</span>}>
        <ul className="bio-meds">
          {meds.map((m) => (
            <MedicionItem key={m.id} m={m} idx={idx} mostrarTaxon onSelectTaxon={onSelectTaxon} />
          ))}
        </ul>
      </Section>
    </>
  );
};

/* ---------- Community: future bioindicators in its department ---------- */

export const BioindicadoresPotenciales: React.FC<{
  c: Comunidad;
  idx: IndiceBio | null;
  onSelectTaxon: (t: Taxon) => void;
}> = ({ c, idx, onSelectTaxon }) => {
  const [todos, setTodos] = React.useState(false);
  const lista = React.useMemo(() => (idx ? bioindicadoresEnDepartamento(idx, c.departamento) : []), [idx, c.departamento]);
  const visibles = todos ? lista : lista.slice(0, 6);
  return (
    <Section title="Bioindicadores potenciales" aside={<span className="text-[11px] text-ink-3">{c.departamento}</span>}>
      {!idx ? (
        <p className="text-[13px] text-ink-3">Cargando catálogo…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13px] text-ink-3">No hay especies del catálogo registradas en {c.departamento}.</p>
      ) : (
        <>
          <p className="mb-2 text-[12px] leading-snug text-ink-3">
            Especies registradas en {c.departamento} con mercurio medido en ellas o en parientes cercanos. Ninguna tiene aún mediciones en esta comunidad.
          </p>
          <ul className="bio-meds">
            {visibles.map((t) => {
              const m = valorDestacado(t, idx);
              return (
                <li key={t.id}>
                  <button className="w-full text-left" onClick={() => onSelectTaxon(t)}>
                    <span className="flex items-center justify-between gap-2">
                      <strong className="text-[13px] font-medium text-ink">
                        {t.nombre_comun}
                        {t.prioridad && <Star className="ml-1 inline h-3 w-3 text-ochre" aria-label="Prioridad" />}
                      </strong>
                      <EstadoChip t={t} idx={idx} />
                    </span>
                    <span className="block text-[11px] italic text-ink-3">{t.nombre_cientifico}</span>
                    {m && (
                      <span className="block text-[11px] text-ink-2">
                        Referencia: {formatValor(m)} en {m.tejido}
                        {m.taxon !== t.id ? ` de ${idx.taxon.get(m.taxon)?.nombre_comun.toLowerCase()}` : ''}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {lista.length > 6 && (
            <button className="mt-2 text-[12px] text-forest-600 underline underline-offset-2" onClick={() => setTodos(!todos)}>
              {todos ? 'Ver menos' : `Ver las ${lista.length} especies`}
            </button>
          )}
        </>
      )}
    </Section>
  );
};
