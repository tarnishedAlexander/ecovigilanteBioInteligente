import React, { useMemo, useState } from 'react';
import { ExternalLink, MapPin, PanelRightClose, X } from 'lucide-react';
import type { MedicionHg } from '../types';
import {
  ESTADISTICO, GREMIOS, IndiceInv, LECTURAS, MATRICES, MatrizTab, SERIES_COLORS, VERIFICACION,
  estudiosDe, formatMedicion, formatNum, formatPeriodoEstudio, medicionesDe, piso, referenciasDe, techo,
} from '../lib/investigacion';
import { RangeChart, RangeRow, Referencia, Serie, SeriesChart, Timeline, dominioLog } from './charts';

interface Props {
  inv: IndiceInv | null;
  loading: boolean;
  matriz: MatrizTab;
  onMatriz: (m: MatrizTab) => void;
  estudioId: string | null;
  onEstudio: (id: string | null) => void;
  sitioId: string | null;
  onSitio: (id: string | null) => void;
  onCollapse: () => void;
}

export function ResearchPanel({ inv, loading, matriz, onMatriz, estudioId, onEstudio, sitioId, onSitio, onCollapse }: Props) {
  return (
    <aside className="explorer explorer-wide" aria-label="Investigación">
      <button className="explorer-close" onClick={onCollapse} title="Ampliar mapa" aria-label="Ampliar mapa"><PanelRightClose size={17} /></button>
      <div className="explorer-body research">
        <h2>Investigación</h2>
        <p>Estudios publicados sobre mercurio en Bolivia y la cuenca del Madeira, organizados por matriz. Los sitios de cada estudio aparecen en el mapa.</p>
        <div className="research-tabs" role="tablist" aria-label="Matriz">
          {MATRICES.map((m) => {
            const n = inv ? estudiosDe(inv, m.id).length : 0;
            return (
              <button key={m.id} role="tab" aria-selected={matriz === m.id} className={matriz === m.id ? 'active' : ''}
                onClick={() => onMatriz(m.id)}>{m.label} <small>{n}</small></button>
            );
          })}
        </div>
        {!inv
          ? <p className="explorer-empty" role="status">{loading ? 'Cargando estudios…' : 'Datos de investigación no disponibles.'}</p>
          : <Contenido key={matriz} inv={inv} matriz={matriz} estudioId={estudioId} onEstudio={onEstudio} sitioId={sitioId} onSitio={onSitio} />}
      </div>
    </aside>
  );
}

interface ContenidoProps {
  inv: IndiceInv;
  matriz: MatrizTab;
  estudioId: string | null;
  onEstudio: (id: string | null) => void;
  sitioId: string | null;
  onSitio: (id: string | null) => void;
}

function Contenido({ inv, matriz, estudioId, onEstudio, sitioId, onSitio }: ContenidoProps) {
  const meta = MATRICES.find((m) => m.id === matriz)!;
  const mediciones = useMemo(() => medicionesDe(inv, matriz), [inv, matriz]);
  const estudios = useMemo(() => estudiosDe(inv, matriz), [inv, matriz]);
  const refs: Referencia[] = referenciasDe(inv, matriz).map((r) => ({ valor: r.valor, etiqueta: r.etiqueta }));
  const sitios = new Set(mediciones.map((m) => m.sitio));
  const maximo = mediciones
    .filter((m) => m.valor !== null && m.unidad === meta.unidad && (matriz !== 'peces' || m.base !== 'seco'))
    .reduce<MedicionHg | null>((best, m) => (!best || alto(m) > alto(best) ? m : best), null);
  const atenuar = (m: MedicionHg) => (!!estudioId && m.estudio !== estudioId) || (!!sitioId && m.sitio !== sitioId);
  const sel = estudioId ? inv.estudio.get(estudioId) : null;
  const sitioSel = sitioId ? inv.sitio.get(sitioId) : null;

  return (
    <>
      <div className="research-stats">
        <div><small>Estudios</small><strong>{estudios.length}</strong></div>
        <div><small>Sitios</small><strong>{sitios.size}</strong></div>
        <div><small>Mediciones</small><strong>{mediciones.length}</strong></div>
        {maximo && (
          <div><small>Valor más alto (media o valor puntual)</small><strong>{formatNum(alto(maximo))} <em>{maximo.unidad}</em></strong>
            <span>{maximo.especie ? `${maximo.especie.comun}, ` : ''}{inv.sitio.get(maximo.sitio)?.nombre}{maximo.nota && maximo.nota.length < 40 ? ` · ${maximo.nota}` : ''}</span></div>
        )}
      </div>

      <section className="research-reading">
        <h3>Qué muestran los estudios en conjunto</h3>
        <ul>{LECTURAS[matriz].map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      {(sel || sitioSel) && (
        <div className="filter-status">
          <span aria-live="polite">{sel ? `Resaltado: ${sel.cita}` : `Sitio: ${sitioSel!.nombre}`}</span>
          <button onClick={() => { onEstudio(null); onSitio(null); }}><X size={13} className="inline" /> Quitar</button>
        </div>
      )}

      <Graficos inv={inv} matriz={matriz} mediciones={mediciones} refs={refs} atenuar={atenuar} onEstudio={onEstudio} />

      <section className="research-block">
        <h3>Línea de tiempo</h3>
        <p className="research-note">Barra: periodo de muestreo. Círculo: año de publicación. Clic para resaltar un estudio.</p>
        <Timeline seleccionado={estudioId} onSelect={(id) => onEstudio(id === estudioId ? null : id)}
          hitos={estudios.map((e) => ({ id: e.id, label: e.cita, inicio: e.muestreo[0], fin: e.muestreo[1], publicacion: e.anio }))} />
      </section>

      <section className="research-block">
        <h3>Estudios</h3>
        <ul className="study-list">
          {estudios.map((e) => {
            const activo = e.id === estudioId;
            const n = mediciones.filter((m) => m.estudio === e.id).length;
            return (
              <li key={e.id} className={activo ? 'active' : ''}>
                <button className="study-main" aria-pressed={activo} onClick={() => onEstudio(activo ? null : e.id)}>
                  <span className="study-top"><strong>{e.cita}</strong><small>{formatPeriodoEstudio(e)} · {n} {n === 1 ? 'medición' : 'mediciones'}</small></span>
                  <span className="study-title">{e.titulo}</span>
                  <span className="study-finding">{e.hallazgo}</span>
                </button>
                <div className="study-meta">
                  <span>{e.revista}</span>
                  <span className={`study-check is-${e.verificacion}`} title={VERIFICACION[e.verificacion].detalle}>{VERIFICACION[e.verificacion].label}</span>
                  {e.url && <a href={e.url} target="_blank" rel="noreferrer">{e.url.includes('doi.org') ? 'DOI' : 'Fuente'} <ExternalLink size={11} /></a>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <TablaMediciones inv={inv} mediciones={mediciones.filter((m) => !atenuar(m))} onSitio={onSitio} filtrada={!!(estudioId || sitioId)} />
      {matriz === 'peces' && <TablaMediciones inv={inv} titulo="Mediciones en cabello"
        mediciones={medicionesDe(inv, 'cabello').filter((m) => !atenuar(m))} onSitio={onSitio} filtrada={!!(estudioId || sitioId)} />}
      <p className="demo-note">{inv.datos.nota}</p>
    </>
  );
}

/** Highest central value: a mean or a single measurement, never the top of a range or a peak. */
const alto = (m: MedicionHg) => m.valor ?? 0;

/* ---------------------------------------------------------------- charts per matrix */

interface GraficosProps {
  inv: IndiceInv;
  matriz: MatrizTab;
  mediciones: MedicionHg[];
  refs: Referencia[];
  atenuar: (m: MedicionHg) => boolean;
  onEstudio: (id: string | null) => void;
}

function tooltipMedicion(inv: IndiceInv, m: MedicionHg) {
  const e = inv.estudio.get(m.estudio)!;
  return (
    <>
      <strong>{m.especie ? m.especie.comun : inv.sitio.get(m.sitio)?.nombre}</strong>
      {m.especie && <span className="italic">{m.especie.cientifico}</span>}
      <span>{ESTADISTICO[m.estadistico]}: {formatMedicion(m)}</span>
      <span>{[m.forma !== 'Hg total' ? m.forma : null, m.periodo, m.n ? `n = ${m.n}` : null].filter(Boolean).join(' · ')}</span>
      {m.nota && <span>{m.nota}</span>}
      <span className="chart-tooltip-source">{e.cita}{m.especie ? ` · ${inv.sitio.get(m.sitio)?.nombre}` : ''}</span>
    </>
  );
}

/** Rows by site, ordered by their highest value. Each study measurement is one mark. */
function filasPorSitio(inv: IndiceInv, meds: MedicionHg[], atenuar: (m: MedicionHg) => boolean, color: (m: MedicionHg) => string): RangeRow[] {
  const grupos = new Map<string, MedicionHg[]>();
  meds.forEach((m) => grupos.set(m.sitio, [...(grupos.get(m.sitio) ?? []), m]));
  return [...grupos.entries()]
    .sort((a, b) => Math.max(...b[1].map(techo)) - Math.max(...a[1].map(techo)))
    .map(([sitio, ms]) => {
      const s = inv.sitio.get(sitio)!;
      return {
        key: sitio, label: s.nombre, sublabel: [s.region, s.pais !== 'Bolivia' ? s.pais : null].filter(Boolean).join(', '),
        items: ms.map((m) => ({
          id: m.id, valor: m.valor, min: m.min, max: m.max, menorQue: m.estadistico === 'bajo_ld', color: color(m),
          atenuado: atenuar(m), tooltip: tooltipMedicion(inv, m),
        })),
      };
    });
}

function serie(id: string, label: string, color: string, meds: MedicionHg[], valor: (m: MedicionHg) => number = (m) => m.valor!): Serie {
  return {
    id, label, color,
    puntos: meds.filter((m) => m.anio !== null).map((m) => ({ x: m.anio!, y: valor(m), etiqueta: m.periodo ?? String(m.anio) })),
  };
}

function Leyenda({ items }: { items: { color: string; label: string; abierto?: boolean }[] }) {
  return (
    <ul className="chart-legend">
      {items.map((i) => <li key={i.label}><i className={i.abierto ? 'is-open' : ''} style={i.abierto ? { borderColor: i.color } : { background: i.color }} />{i.label}</li>)}
    </ul>
  );
}

function Graficos({ inv, matriz, mediciones, refs, atenuar, onEstudio }: GraficosProps) {
  const seleccionar = (id: string) => onEstudio(inv.datos.mediciones.find((m) => m.id === id)?.estudio ?? null);
  const neutro = '#a7be78';

  if (matriz === 'aire') {
    const filas = filasPorSitio(inv, mediciones, atenuar, () => neutro);
    return (
      <section className="research-block">
        <h3>Mercurio gaseoso por sitio</h3>
        <p className="research-note">Media del estudio; la barra llega al pico registrado. Ninguna medición promedio supera la guía de la OMS.</p>
        <RangeChart titulo="Mercurio gaseoso en aire por sitio" filas={filas} tipo="log" unidad="ng/m³"
          dominio={dominioLog([...mediciones.map(piso), ...mediciones.map(techo), 1000])} referencias={refs} onSelect={seleccionar} />
      </section>
    );
  }

  if (matriz === 'agua') {
    const val = mediciones.filter((m) => m.estudio === 'valdivieso2025');
    const resto = mediciones.filter((m) => m.estudio !== 'valdivieso2025' && m.forma === 'Hg total');
    const series = [
      serie('cuenca_part', 'Cuenca del Beni, particulado', SERIES_COLORS[0], val.filter((m) => m.sitio === 'cuenca_beni' && m.forma === 'Hg particulado')),
      serie('rurre', 'Rurrenabaque, particulado', SERIES_COLORS[1], val.filter((m) => m.sitio === 'rurrenabaque')),
      serie('riberalta', 'Riberalta, particulado', SERIES_COLORS[2], val.filter((m) => m.sitio === 'riberalta')),
    ];
    const meth = mediciones.filter((m) => m.forma === 'MeHg');
    return (
      <>
        <section className="research-block">
          <h3>Evolución en el río Beni, 1995-2006</h3>
          <p className="research-note">Promedios anuales de Hg particulado compilados por Valdivieso et al. (2025). La línea punteada es el límite boliviano para Hg total.</p>
          <SeriesChart titulo="Mercurio particulado en agua del río Beni por año" series={series} unidad="ng/L" referencias={refs} />
        </section>
        <section className="research-block">
          <h3>Hg total por sitio</h3>
          <Leyenda items={[{ color: neutro, label: 'Valor o media (punto) y rango (barra)' }, { color: '#d5ac69', label: 'Bajo el límite de detección del laboratorio', abierto: true }]} />
          <RangeChart titulo="Mercurio total en agua por sitio" filas={filasPorSitio(inv, resto, atenuar, (m) => (m.estadistico === 'bajo_ld' ? '#d5ac69' : neutro))}
            tipo="log" unidad="ng/L" dominio={dominioLog([...resto.map(piso), ...resto.map(techo)])} referencias={refs} onSelect={seleccionar} />
          {meth.length > 0 && <p className="research-note">Metilmercurio en el lago Uru Uru (Oruro): {meth.map((m) => `${formatMedicion(m)} (${inv.estudio.get(m.estudio)?.cita})`).join('; ')}.</p>}
        </section>
      </>
    );
  }

  if (matriz === 'sedimentos') {
    const ug = mediciones.filter((m) => m.unidad === 'µg/g');
    const series = [
      serie('beni', 'Cuenca del Beni, promedio anual', SERIES_COLORS[0], ug.filter((m) => m.estudio === 'valdivieso2025' && m.sitio === 'cuenca_beni')),
      serie('mdd', 'Madre de Dios (Perú), máximo por crecida', SERIES_COLORS[1], ug.filter((m) => m.estudio === 'silvera2026'), techo),
    ];
    const porSitio = ug.filter((m) => !(m.estudio === 'valdivieso2025' && m.sitio === 'cuenca_beni'));
    return (
      <>
        <section className="research-block">
          <h3>Evolución en el tiempo</h3>
          <p className="research-note">Promedios del Beni (Valdivieso et al. 2025) y valor más alto de cada crecida en el Madre de Dios peruano, aguas arriba de Bolivia (Silvera et al. 2026). TEL y PEL: guías canadienses de calidad de sedimentos.</p>
          <SeriesChart titulo="Mercurio en sedimentos por año" series={series} unidad="µg/g peso seco" referencias={refs} />
        </section>
        <section className="research-block">
          <h3>Hg total por sitio</h3>
          <p className="research-note">Cada punto es una campaña de muestreo. Clic para resaltar el estudio.</p>
          <RangeChart titulo="Mercurio en sedimentos por sitio" filas={filasPorSitio(inv, porSitio, atenuar, () => neutro)} tipo="log" unidad="µg/g"
            dominio={dominioLog([...porSitio.map(piso), ...porSitio.map(techo)])} referencias={refs} onSelect={seleccionar} />
        </section>
      </>
    );
  }

  // peces
  const humedo = mediciones.filter((m) => m.base !== 'seco' && m.especie);
  const grupos = new Map<string, MedicionHg[]>();
  humedo.forEach((m) => grupos.set(m.especie!.cientifico, [...(grupos.get(m.especie!.cientifico) ?? []), m]));
  const filas: RangeRow[] = [...grupos.entries()]
    .map(([cient, ms]) => ({ cient, ms, max: Math.max(...ms.map((m) => m.valor ?? ((m.min ?? 0) + (m.max ?? 0)) / 2)) }))
    .sort((a, b) => b.max - a.max)
    .map(({ cient, ms }) => ({
      key: cient, label: ms[0].especie!.comun, sublabel: cient,
      items: ms.map((m) => ({
        id: m.id, valor: m.valor, min: m.min, max: m.max, color: GREMIOS[m.especie!.gremio].color,
        atenuado: atenuar(m), tooltip: tooltipMedicion(inv, m),
      })),
    }));
  const gremios = [...new Set(humedo.map((m) => m.especie!.gremio))];
  const cabello = medicionesDe(inv, 'cabello');
  const refCabello = referenciasDe(inv, 'cabello').map((r) => ({ valor: r.valor, etiqueta: r.etiqueta }));
  return (
    <>
      <section className="research-block">
        <h3>Hg en músculo por especie</h3>
        <p className="research-note">Un punto por estudio y sitio (media) con su rango. Ordenado de mayor a menor. Peso húmedo; las mediciones en peso seco solo aparecen en la tabla.</p>
        <Leyenda items={gremios.map((g) => ({ color: GREMIOS[g].color, label: GREMIOS[g].label }))} />
        <RangeChart titulo="Mercurio en músculo de peces por especie" filas={filas} tipo="linear" unidad="µg/g"
          dominio={[0, Math.ceil(Math.max(...humedo.map(techo)) * 2) / 2]} referencias={refs} onSelect={seleccionar} />
      </section>
      <section className="research-block">
        <h3>Del pescado al cabello</h3>
        <p className="research-note">Promedios anuales de Hg en cabello de la población ribereña del Beni (Valdivieso et al. 2025). La OMS asocia más de 10 µg/g con riesgo para el desarrollo neurológico.</p>
        <SeriesChart titulo="Mercurio en cabello por año en la cuenca del Beni" alto={170}
          series={[serie('cabello', 'Cabello, promedio anual', SERIES_COLORS[0], cabello.filter((m) => m.estudio === 'valdivieso2025'))]}
          unidad="µg/g" referencias={refCabello} />
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- table */

function TablaMediciones({ inv, mediciones, onSitio, filtrada, titulo = 'Tabla de mediciones' }: {
  inv: IndiceInv; mediciones: MedicionHg[]; onSitio: (id: string) => void; filtrada: boolean; titulo?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const filas = abierta ? mediciones : mediciones.slice(0, 12);
  if (!mediciones.length) return null;
  return (
    <section className="research-block">
      <h3>{titulo} <small>{mediciones.length}{filtrada ? ' filtradas' : ''}</small></h3>
      <div className="research-table-wrap">
        <table className="research-table">
          <thead><tr><th>Sitio</th><th>Muestra</th><th>Periodo</th><th className="num">Valor</th><th>Estudio</th></tr></thead>
          <tbody>
            {filas.map((m) => {
              const s = inv.sitio.get(m.sitio)!;
              return (
                <tr key={m.id}>
                  <td><button className="table-site" onClick={() => onSitio(m.sitio)} title="Ver en el mapa"><MapPin size={11} />{s.nombre}</button></td>
                  <td>{m.especie ? <>{m.especie.comun} <i>{m.especie.cientifico}</i></> : m.nota && m.nota.length < 40 ? m.nota : m.forma}
                    {m.forma !== 'Hg total' && m.especie && <> · {m.forma}</>}{m.base === 'seco' && <small> · peso seco</small>}</td>
                  <td>{m.periodo ?? '—'}</td>
                  <td className="num" title={ESTADISTICO[m.estadistico]}>{formatMedicion(m)}{m.n ? <small> · n {m.n}</small> : null}</td>
                  <td>{inv.estudio.get(m.estudio)?.cita}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {mediciones.length > 12 && <button className="research-more" onClick={() => setAbierta(!abierta)}>{abierta ? 'Mostrar menos' : `Mostrar las ${mediciones.length}`}</button>}
    </section>
  );
}
