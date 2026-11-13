import React, { useState } from 'react';
import { Building2, Calendar, FileText, HeartHandshake, Newspaper, Plus, Trash2 } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatDateAR, formatDateTimeAR } from '../../utils/format';

export const ClubInstitucionalScreen: React.FC<{ forceABM?: boolean }> = ({ forceABM }) => {
  const {
    state,
    activeRole,
    activeUser,
    toggleInscripcionAyuda,
    crearEventoAyuda,
    eliminarEventoAyuda,
    crearAsamblea,
    eliminarAsamblea,
    crearNoticia,
    eliminarNoticia,
  } = useClub();

  const canABM = activeRole === 'ADMIN' || activeRole === 'COMISION';
  const [tab, setTab] = useState<'ayuda' | 'asambleas' | 'noticias'>('ayuda');

  // Forms ABM
  const [evTitulo, setEvTitulo] = useState('');
  const [evFecha, setEvFecha] = useState('2026-12-06T09:00');
  const [evLugar, setEvLugar] = useState('Predio Guaycurues Sunchales');
  const [evCupo, setEvCupo] = useState(15);
  const [evDesc, setEvDesc] = useState('');

  const [asTitulo, setAsTitulo] = useState('');
  const [asTemas, setAsTemas] = useState('');
  const [asMinuta, setAsMinuta] = useState('');

  const [notTitulo, setNotTitulo] = useState('');
  const [notCat, setNotCat] = useState('Institucional');
  const [notResumen, setNotResumen] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Módulo Club · Guaycurues Rugby Sunchales
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            {forceABM
              ? 'Configuración y ABM Institucional del Club'
              : 'Ayuda al Club, Asambleas y Noticias'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {canABM
              ? 'Publicación y gestión ABM habilitada para Administración y Comisión Directiva.'
              : 'Cartelera solidaria con inscripción de voluntarios, minutas semanales y novedades.'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md shrink-0">
          <button
            onClick={() => setTab('ayuda')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 ${
              tab === 'ayuda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Ayuda al Club</span>
          </button>
          <button
            onClick={() => setTab('asambleas')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 ${
              tab === 'asambleas' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Asambleas</span>
          </button>
          <button
            onClick={() => setTab('noticias')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 ${
              tab === 'noticias' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Noticias</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AYUDA AL CLUB */}
      {tab === 'ayuda' && (
        <div className="space-y-6">
          {canABM && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!evTitulo.trim()) return;
                crearEventoAyuda({
                  titulo: evTitulo.trim(),
                  fecha: evFecha,
                  lugar: evLugar,
                  descripcion: evDesc || 'Jornada solidaria de colaboración institucional.',
                  cupo: evCupo,
                });
                setEvTitulo('');
                setEvDesc('');
              }}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                ABM · Nueva Convocatoria Ayuda al Club
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título de jornada"
                  value={evTitulo}
                  onChange={(e) => setEvTitulo(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <input
                  type="datetime-local"
                  value={evFecha}
                  onChange={(e) => setEvFecha(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
                />
                <input
                  type="number"
                  min={1}
                  value={evCupo}
                  onChange={(e) => setEvCupo(Number(e.target.value))}
                  placeholder="Cupo"
                  className="px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={evLugar}
                  onChange={(e) => setEvLugar(e.target.value)}
                  placeholder="Lugar"
                  className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <input
                  type="text"
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="Descripción breve"
                  className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.eventosAyuda.map((ev) => {
              const inscripto = ev.inscriptos_ids.includes(activeUser.id);
              const lleno = ev.inscriptos_ids.length >= ev.cupo;
              return (
                <div
                  key={ev.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-slate-500">
                        {formatDateTimeAR(ev.fecha)} · {ev.lugar}
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                        {ev.titulo}
                      </h3>
                    </div>
                    {canABM && (
                      <button
                        onClick={() => eliminarEventoAyuda(ev.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{ev.descripcion}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-mono tabular-nums text-xs text-slate-700">
                      Voluntarios: <strong>{ev.inscriptos_ids.length}</strong> / {ev.cupo}
                    </span>
                    <button
                      onClick={() => toggleInscripcionAyuda(ev.id, activeUser.id)}
                      disabled={!inscripto && lleno}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        inscripto
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : lleno
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {inscripto ? 'Inscripto (Cancelar)' : lleno ? 'Cupo Completo' : 'Inscribirme'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ASAMBLEAS */}
      {tab === 'asambleas' && (
        <div className="space-y-6">
          {canABM && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!asTitulo.trim()) return;
                crearAsamblea({
                  titulo: asTitulo.trim(),
                  fecha: new Date().toISOString(),
                  autor: `${activeUser.nombre} ${activeUser.apellido}`,
                  temas: asTemas
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  minuta: asMinuta.trim() || 'Minuta aprobada por Comisión Directiva.',
                });
                setAsTitulo('');
                setAsTemas('');
                setAsMinuta('');
              }}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                ABM · Registrar Minuta de Asamblea Semanal
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título (ej. Reunión Semanal #43)"
                  value={asTitulo}
                  onChange={(e) => setAsTitulo(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <input
                  type="text"
                  placeholder="Temas tratados (separados por coma)"
                  value={asTemas}
                  onChange={(e) => setAsTemas(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  placeholder="Resumen y resoluciones de la minuta..."
                  value={asMinuta}
                  onChange={(e) => setAsMinuta(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 self-end"
                >
                  Guardar Minuta
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {state.asambleas.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">{formatDateAR(a.fecha)}</span> · Redactó: {a.autor}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {a.titulo}
                    </h3>
                  </div>
                  {canABM && (
                    <button
                      onClick={() => eliminarAsamblea(a.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {a.temas.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {a.temas.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3 leading-relaxed">
                  {a.minuta}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NOTICIAS */}
      {tab === 'noticias' && (
        <div className="space-y-6">
          {canABM && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!notTitulo.trim()) return;
                crearNoticia({
                  titulo: notTitulo.trim(),
                  fecha: new Date().toISOString(),
                  categoria: notCat,
                  resumen: notResumen.trim() || 'Comunicado oficial de Guaycurues Rugby Sunchales.',
                  contenido: notResumen.trim(),
                });
                setNotTitulo('');
                setNotResumen('');
              }}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                ABM · Publicar Noticia Institucional
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título de la noticia"
                  value={notTitulo}
                  onChange={(e) => setNotTitulo(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <select
                  value={notCat}
                  onChange={(e) => setNotCat(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-xs bg-white"
                >
                  <option value="Institucional">Institucional</option>
                  <option value="Deportivo">Deportivo</option>
                  <option value="Tesorería">Tesorería</option>
                </select>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Resumen y contenido"
                  value={notResumen}
                  onChange={(e) => setNotResumen(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800"
                >
                  Publicar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.noticias.map((n) => (
              <article
                key={n.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {n.categoria} · <span className="font-mono">{formatDateAR(n.fecha)}</span>
                  </div>
                  {canABM && (
                    <button
                      onClick={() => eliminarNoticia(n.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">{n.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{n.contenido || n.resumen}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
