import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Lock,
  Plus,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { getScreenAccessLevel } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { IncidenciaPartido, Partido, RolEnTemporada } from '../../types/srs';
import { formatDateAR, formatDateTimeAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

// -----------------------------------------------------------------------------
// VISTA BASE: Gestión de Temporada (Contenedor Estilo BD.UAR)
// -----------------------------------------------------------------------------
export const DeportivoTemporadaScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeTemporada,
    activeTemporadaId,
    setActiveTemporadaId,
    crearTemporada,
    cambiarEstadoTemporada,
    asignarMiembroTemporada,
    agregarReferee,
  } = useClub();

  const isReadOnly = getScreenAccessLevel(activeRole, 'dep_temporada') === 'LECTURA';
  const [selectedCatTab, setSelectedCatTab] = useState<number>(state.categorias[1]?.id ?? 2);

  // Forms
  const [newYear, setNewYear] = useState<number>(2027);
  const [assignUserId, setAssignUserId] = useState<number>(13);
  const [assignRol, setAssignRol] = useState<RolEnTemporada>('JUGADOR');

  const [refNombre, setRefNombre] = useState('');
  const [refDni, setRefDni] = useState('');
  const [refTel, setRefTel] = useState('');
  const [refUnion, setRefUnion] = useState('Unión Santafesina (USR)');

  const miembrosCat = state.miembrosTemporada.filter(
    (m) => m.temporada_id === activeTemporadaId && m.categoria_id === selectedCatTab && m.activo
  );
  const refereesTemp = state.referees.filter((r) => r.temporada_id === activeTemporadaId);

  const handleCrearTemporada = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.temporadas.some((t) => t.anio === newYear)) return;
    crearTemporada({
      anio: newYear,
      nombre: `Temporada Oficial ${newYear}`,
      fecha_inicio: `${newYear}-02-01`,
      fecha_fin: `${newYear}-11-30`,
      estado: 'PLANIFICACION',
    });
    setActiveTemporadaId(newYear);
  };

  const handleAddReferee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNombre.trim() || !refDni.trim()) return;
    agregarReferee({
      temporada_id: activeTemporadaId,
      nombre_completo: refNombre.trim(),
      dni: refDni.trim(),
      telefono: refTel.trim() || '+54 9 3493 400-000',
      union_origen: refUnion,
      activo: true,
    });
    setRefNombre('');
    setRefDni('');
    setRefTel('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Módulo Deportivo · Contenedor Anual Estilo BD.UAR
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Gestión de Temporada ({activeTemporada.nombre})
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Eje estructural BD.UAR: vincula Categorías, Planteles, Staff Técnico, Referees, Torneos y Fichajes bajo una temporada_id.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusLabel
            tone={
              activeTemporada.estado === 'EN_CURSO'
                ? 'emerald'
                : activeTemporada.estado === 'CERRADA'
                ? 'slate'
                : 'amber'
            }
            label={activeTemporada.estado}
            mono
          />
          {isReadOnly && <StatusLabel tone="amber" label="Solo Lectura" />}
        </div>
      </div>

      {/* Selector / Creador de Temporada */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {state.temporadas.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTemporadaId(t.id)}
              className={`px-3.5 py-2 rounded-md border text-xs font-semibold transition-colors ${
                t.id === activeTemporadaId
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.nombre} ({t.estado})
            </button>
          ))}
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {activeTemporada.estado !== 'CERRADA' && (
              <button
                onClick={() => cambiarEstadoTemporada(activeTemporadaId, 'CERRADA')}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 rounded-md text-xs font-medium hover:bg-rose-50"
              >
                Cerrar Temporada {activeTemporada.anio}
              </button>
            )}
            <form onSubmit={handleCrearTemporada} className="flex items-center gap-1.5">
              <input
                type="number"
                min={2024}
                max={2035}
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap"
              >
                + Abrir Temporada
              </button>
            </form>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planteles y Staff por Categoría en la Temporada */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Planteles y Staff Técnico por Categoría ({activeTemporada.anio})
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              {state.categorias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatTab(c.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedCatTab === c.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          {!isReadOnly && activeTemporada.estado !== 'CERRADA' && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-wrap items-center gap-2">
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(Number(e.target.value))}
                className="flex-1 min-w-[180px] px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                {state.usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} (DNI {u.dni})
                  </option>
                ))}
              </select>
              <select
                value={assignRol}
                onChange={(e) => setAssignRol(e.target.value as RolEnTemporada)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="JUGADOR">Jugador</option>
                <option value="MANAGER">Manager</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="PREPARADOR_FISICO">Preparador Físico</option>
              </select>
              <button
                onClick={() => asignarMiembroTemporada(selectedCatTab, assignUserId, assignRol)}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Vincular</span>
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {miembrosCat.length > 0 ? (
              miembrosCat.map((m) => {
                const u = state.usuarios.find((usr) => usr.id === m.usuario_id);
                return (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {u?.nombre} {u?.apellido}
                      </span>{' '}
                      <span className="text-slate-400">·</span>{' '}
                      <span className="font-mono text-slate-500">DNI {u?.dni}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500">Alta {formatDateAR(m.fecha_alta)}</span>
                      <StatusLabel
                        tone={
                          m.rol_en_temporada === 'MANAGER'
                            ? 'sky'
                            : m.rol_en_temporada === 'ENTRENADOR'
                            ? 'amber'
                            : 'emerald'
                        }
                        label={m.rol_en_temporada}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Sin miembros empadronados en esta categoría para {activeTemporada.nombre}.
              </div>
            )}
          </div>
        </section>

        {/* Padrón de Referees habilitados en la Temporada */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Cuerpo de Referees Habilitados ({activeTemporada.anio})
          </h2>

          {!isReadOnly && activeTemporada.estado !== 'CERRADA' && (
            <form onSubmit={handleAddReferee} className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido"
                  value={refNombre}
                  onChange={(e) => setRefNombre(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="DNI"
                  value={refDni}
                  onChange={(e) => setRefDni(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={refTel}
                  onChange={(e) => setRefTel(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
                <input
                  type="text"
                  value={refUnion}
                  onChange={(e) => setRefUnion(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
              >
                + Agregar Referee al Padrón {activeTemporada.anio}
              </button>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {refereesTemp.map((r) => (
              <div key={r.id} className="py-2.5 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{r.nombre_completo}</span>
                  <span className="font-mono text-slate-500">DNI {r.dni}</span>
                </div>
                <div className="text-slate-500">
                  {r.union_origen} · {r.telefono}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 1: Configurar Partido + Planilla de Incidencias Post-Partido
// -----------------------------------------------------------------------------
export const DeportivoConfigPartidoScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    activeTemporada,
    getUserCategoriesInTemporada,
    crearPartido,
    cargarPlanillaPostPartido,
  } = useClub();

  const managerCats = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);
  // Regla SRS: Si el Manager tiene 1 sola categoría asignada, aparece preseleccionada y bloqueada
  const isSingleCatManager = activeRole === 'MANAGER' && managerCats.length === 1;
  const availableCats =
    activeRole === 'MANAGER' && managerCats.length > 0 ? managerCats : state.categorias;

  const [categoriaId, setCategoriaId] = useState<number>(availableCats[0]?.id ?? 2);
  useEffect(() => {
    if (isSingleCatManager && managerCats[0]) {
      setCategoriaId(managerCats[0].id);
    } else if (!availableCats.some((c) => c.id === categoriaId) && availableCats[0]) {
      setCategoriaId(availableCats[0].id);
    }
  }, [isSingleCatManager, managerCats, availableCats, categoriaId]);

  const [condicion, setCondicion] = useState<'LOCAL' | 'VISITANTE'>('LOCAL');
  const [rival, setRival] = useState('');
  const [fechaHora, setFechaHora] = useState('2026-11-28T15:30');
  const [cancha, setCancha] = useState('Cancha Principal - Predio Guaycurues');
  const [torneoId, setTorneoId] = useState<number | ''>(1);
  const [refereeId, setRefereeId] = useState<number | ''>(1);

  // Planilla de Incidencias Post-Partido modal/panel
  const [editingPlanilla, setEditingPlanilla] = useState<Partido | null>(null);
  const [resLocal, setResLocal] = useState<number>(24);
  const [resVis, setResVis] = useState<number>(17);
  const [planillaRefId, setPlanillaRefId] = useState<number | ''>(1);
  const [planillaIncidencias, setPlanillaIncidencias] = useState<IncidenciaPartido[]>([]);
  const [newIncTipo, setNewIncTipo] = useState<IncidenciaPartido['tipo']>('TRY');
  const [newIncMin, setNewIncMin] = useState<number>(18);
  const [newIncJugador, setNewIncJugador] = useState<string>('Mateo Quiroga');
  const [newIncDetalle, setNewIncDetalle] = useState<string>('Try apoyado bajo los palos');

  const refereesTemp = state.referees.filter((r) => r.temporada_id === activeTemporadaId);
  const torneosTemp = state.torneos.filter((t) => t.temporada_id === activeTemporadaId);
  const partidosVisibles = state.partidos.filter(
    (p) =>
      p.temporada_id === activeTemporadaId &&
      (activeRole !== 'MANAGER' || availableCats.some((c) => c.id === p.categoria_id))
  );

  const handleCrearPartido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rival.trim()) return;
    const catMembers = state.miembrosTemporada.filter(
      (m) => m.temporada_id === activeTemporadaId && m.categoria_id === categoriaId
    );
    crearPartido({
      temporada_id: activeTemporadaId,
      torneo_id: torneoId ? Number(torneoId) : null,
      categoria_id: categoriaId,
      referee_id: refereeId ? Number(refereeId) : null,
      rival: rival.trim(),
      condicion,
      fecha_hora: fechaHora,
      cancha,
      citados_ids: catMembers.filter((m) => m.rol_en_temporada === 'JUGADOR').map((m) => m.usuario_id),
      cuerpo_tecnico_ids: catMembers
        .filter((m) => m.rol_en_temporada === 'MANAGER' || m.rol_en_temporada === 'ENTRENADOR')
        .map((m) => m.usuario_id),
    });
    setRival('');
  };

  const openPlanilla = (partido: Partido) => {
    setEditingPlanilla(partido);
    setResLocal(partido.resultado_local ?? 24);
    setResVis(partido.resultado_visitante ?? 17);
    setPlanillaRefId(partido.referee_id ?? refereesTemp[0]?.id ?? '');
    setPlanillaIncidencias(partido.incidencias ?? []);
  };

  const addIncidencia = () => {
    if (!newIncJugador.trim()) return;
    setPlanillaIncidencias((prev) => [
      ...prev,
      {
        id: 'inc-' + Date.now(),
        tipo: newIncTipo,
        minuto: newIncMin,
        jugador_nombre: newIncJugador.trim(),
        detalle: newIncDetalle.trim(),
      },
    ]);
  };

  const savePlanilla = () => {
    if (!editingPlanilla) return;
    cargarPlanillaPostPartido(editingPlanilla.id, {
      resultado_local: resLocal,
      resultado_visitante: resVis,
      referee_id: planillaRefId ? Number(planillaRefId) : null,
      citados_ids: editingPlanilla.citados_ids,
      cuerpo_tecnico_ids: editingPlanilla.cuerpo_tecnico_ids,
      incidencias: planillaIncidencias,
    });
    setEditingPlanilla(null);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Deportivo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Configurar Partido y Planilla de Incidencias
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Programación vinculada a Temporada Activa y carga oficial post-partido (resultado, referee, citados, tries, tarjetas y lesiones).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario programar partido */}
        <form
          onSubmit={handleCrearPartido}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900">
            Programar Nuevo Encuentro
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Categoría {isSingleCatManager && '(Única categoría asignada · Bloqueado)'}
              <div className="relative mt-1">
                <select
                  disabled={isSingleCatManager || activeTemporada.estado === 'CERRADA'}
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white disabled:bg-slate-100 disabled:text-slate-700"
                >
                  {availableCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {isSingleCatManager && (
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-8 top-2.5" />
                )}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-700">
              Condición
              <select
                value={condicion}
                onChange={(e) => setCondicion(e.target.value as 'LOCAL' | 'VISITANTE')}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="LOCAL">Local</option>
                <option value="VISITANTE">Visitante</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700">
              Club Rival
              <input
                type="text"
                required
                placeholder="Ej. Santa Fe RC"
                value={rival}
                onChange={(e) => setRival(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-700">
              Fecha y Hora
              <input
                type="datetime-local"
                required
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Referee Designado
              <select
                value={refereeId}
                onChange={(e) => setRefereeId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="">A designar</option>
                {refereesTemp.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre_completo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-700">
              Torneo (Opcional)
              <select
                value={torneoId}
                onChange={(e) => setTorneoId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="">Amistoso / Sin torneo</option>
                {torneosTemp.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700">
              Cancha / Sede
              <input
                type="text"
                required
                value={cancha}
                onChange={(e) => setCancha(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={activeTemporada.estado === 'CERRADA'}
            className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 disabled:opacity-40"
          >
            + Programar Partido en {activeTemporada.anio}
          </button>
        </form>

        {/* Listado de partidos y acceso a Planilla */}
        <div className="lg:col-span-7 space-y-3">
          {partidosVisibles.map((p) => {
            const cat = state.categorias.find((c) => c.id === p.categoria_id);
            const ref = state.referees.find((r) => r.id === p.referee_id);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      {cat?.nombre} · {p.condicion} ·{' '}
                      <span className="font-mono">{formatDateTimeAR(p.fecha_hora)}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      Guaycurues vs {p.rival}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.estado === 'FINALIZADO' ? (
                      <span className="font-mono tabular-nums text-sm font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded">
                        {p.resultado_local} - {p.resultado_visitante}
                      </span>
                    ) : null}
                    <StatusLabel
                      tone={p.estado === 'FINALIZADO' ? 'emerald' : 'sky'}
                      label={p.estado}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {p.cancha} · Referee: {ref?.nombre_completo ?? 'A designar'} ·{' '}
                    {p.incidencias.length} incidencia(s)
                  </span>
                  <button
                    onClick={() => openPlanilla(p)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 inline-flex items-center gap-1.5"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>
                      {p.estado === 'FINALIZADO'
                        ? 'Ver / Editar Planilla'
                        : 'Cargar Planilla Post-Partido'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Planilla de Incidencias Post-Partido */}
      {editingPlanilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Planilla Post-Partido: Guaycurues vs {editingPlanilla.rival}
                </h3>
                <p className="text-xs text-slate-500">
                  Resultado oficial, referee, plantel citado e incidencias detalladas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs font-medium text-slate-700">
                Puntos Local
                <input
                  type="number"
                  min={0}
                  value={resLocal}
                  onChange={(e) => setResLocal(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Puntos Visitante
                <input
                  type="number"
                  min={0}
                  value={resVis}
                  onChange={(e) => setResVis(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Referee del Encuentro
                <select
                  value={planillaRefId}
                  onChange={(e) => setPlanillaRefId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs bg-white"
                >
                  {refereesTemp.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre_completo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Agregar incidencia */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-slate-800">
                Registrar Incidencia (Try, Conversión, Tarjeta, Cambio, Lesión/Conmoción)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newIncTipo}
                  onChange={(e) => setNewIncTipo(e.target.value as IncidenciaPartido['tipo'])}
                  className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="TRY">Try (+5)</option>
                  <option value="CONVERSION">Conversión (+2)</option>
                  <option value="PENAL">Penal (+3)</option>
                  <option value="AMARILLA">Tarjeta Amarilla</option>
                  <option value="ROJA">Tarjeta Roja</option>
                  <option value="CAMBIO">Cambio</option>
                  <option value="LESION_CONMOCION">Lesión / Conmoción</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={newIncMin}
                  onChange={(e) => setNewIncMin(Number(e.target.value))}
                  placeholder="Min."
                  className="px-2 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                />
                <input
                  type="text"
                  value={newIncJugador}
                  onChange={(e) => setNewIncJugador(e.target.value)}
                  placeholder="Jugador"
                  className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={addIncidencia}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
                >
                  + Agregar
                </button>
              </div>
              <input
                type="text"
                value={newIncDetalle}
                onChange={(e) => setNewIncDetalle(e.target.value)}
                placeholder="Detalle / Observación de planilla"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
              />
            </div>

            {/* Lista de incidencias */}
            <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
              {planillaIncidencias.length > 0 ? (
                planillaIncidencias.map((inc) => (
                  <div
                    key={inc.id}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-semibold text-slate-900">
                        {inc.minuto}' [{inc.tipo}]
                      </span>{' '}
                      <span className="font-medium text-slate-800">{inc.jugador_nombre}</span>
                      {inc.detalle && <span className="text-slate-500"> — {inc.detalle}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanillaIncidencias((prev) => prev.filter((x) => x.id !== inc.id))
                      }
                      className="text-rose-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Sin incidencias cargadas aún.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingPlanilla(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePlanilla}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Cerrar Partido y Guardar Planilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 2: Configurar Torneo
// -----------------------------------------------------------------------------
export const DeportivoConfigTorneoScreen: React.FC = () => {
  const { state, activeTemporadaId, activeTemporada, crearTorneo } = useClub();

  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState(`${activeTemporada.anio}-04-01`);
  const [fechaFin, setFechaFin] = useState(`${activeTemporada.anio}-11-15`);
  const [clubesText, setClubesText] = useState('Guaycurues Sunchales, CRAR Rafaela, Alma Juniors');
  const [catsSelected, setCatsSelected] = useState<number[]>([2, 3]);
  const [esLocal, setEsLocal] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    crearTorneo({
      temporada_id: activeTemporadaId,
      nombre: nombre.trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      clubes_participantes: clubesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      categorias_ids: catsSelected,
      es_local: esLocal,
    });
    setNombre('');
  };

  const torneosTemp = state.torneos.filter((t) => t.temporada_id === activeTemporadaId);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Deportivo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Configurar Torneos de Temporada
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900">Nuevo Torneo</h2>
          <label className="block text-xs font-medium text-slate-700">
            Nombre del Torneo / Encuentro
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Copa Ciudad de Sunchales"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-700">
              Inicio
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Fin
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-700">
            Clubes Invitados (separados por coma)
            <input
              type="text"
              value={clubesText}
              onChange={(e) => setClubesText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
            />
          </label>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1.5">Categorías participantes</div>
            <div className="flex flex-wrap gap-2">
              {state.categorias.map((c) => {
                const active = catsSelected.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() =>
                      setCatsSelected((prev) =>
                        prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded text-xs font-medium border ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={esLocal}
              onChange={(e) => setEsLocal(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Organización / Sede Local en Predio Guaycurues</span>
          </label>
          <button
            type="submit"
            disabled={activeTemporada.estado === 'CERRADA'}
            className="w-full py-2 px-4 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 disabled:opacity-40"
          >
            Guardar Torneo
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {torneosTemp.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-slate-900">{t.nombre}</h3>
                <StatusLabel tone={t.es_local ? 'emerald' : 'slate'} label={t.es_local ? 'Sede Local' : 'Visitante'} />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {formatDateAR(t.fecha_inicio)} al {formatDateAR(t.fecha_fin)}
              </div>
              <div className="text-xs text-slate-700">
                Categorías:{' '}
                <strong>
                  {state.categorias
                    .filter((c) => t.categorias_ids.includes(c.id))
                    .map((c) => c.nombre)
                    .join(', ')}
                </strong>
              </div>
              <div className="text-xs text-slate-600">
                Clubes: {t.clubes_participantes.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 3: Mis Partidos (Vista Jugador / Lectura)
// -----------------------------------------------------------------------------
export const DeportivoMisPartidosScreen: React.FC = () => {
  const { state, activeUser, activeTemporadaId, activeTemporada, getDependantsOf, getUserCategoriesInTemporada } =
    useClub();

  const dependants = getDependantsOf(activeUser.dni);
  const relevantIds = [activeUser.id, ...dependants.map((d) => d.id)];
  const myCats = relevantIds.flatMap((id) => getUserCategoriesInTemporada(id, activeTemporadaId));
  const myCatIds = myCats.map((c) => c.id);

  const misPartidos = state.partidos.filter(
    (p) =>
      p.temporada_id === activeTemporadaId &&
      (myCatIds.length === 0 || myCatIds.includes(p.categoria_id))
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Deportivo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Mis Partidos e Incidencias
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Historial de encuentros disputados y próximos partidos filtrados por la Temporada seleccionada.
        </p>
      </div>

      <div className="space-y-4">
        {misPartidos.length > 0 ? (
          misPartidos.map((p) => {
            const cat = state.categorias.find((c) => c.id === p.categoria_id);
            const ref = state.referees.find((r) => r.id === p.referee_id);
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      {cat?.nombre} · {p.condicion} ·{' '}
                      <span className="font-mono">{formatDateTimeAR(p.fecha_hora)}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                      Guaycurues Sunchales vs {p.rival}
                    </h2>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {p.cancha} · Referee: {ref?.nombre_completo ?? 'A designar'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.estado === 'FINALIZADO' && (
                      <div className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-mono tabular-nums text-base font-bold">
                        {p.resultado_local} - {p.resultado_visitante}
                      </div>
                    )}
                    <StatusLabel
                      tone={p.estado === 'FINALIZADO' ? 'emerald' : 'sky'}
                      label={p.estado}
                    />
                  </div>
                </div>

                {p.incidencias.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700">
                      Incidencias oficiales en planilla:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {p.incidencias.map((inc) => (
                        <div key={inc.id} className="text-xs text-slate-700">
                          <span className="font-mono font-semibold text-slate-900">
                            {inc.minuto}' [{inc.tipo}]
                          </span>{' '}
                          {inc.jugador_nombre}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
            No hay partidos registrados para tus categorías en {activeTemporada.nombre}.
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 4: Fixture General (Filtrable por Temporada, Categoría y Condición)
// -----------------------------------------------------------------------------
export const DeportivoFixtureScreen: React.FC = () => {
  const { state, activeTemporadaId, activeTemporada } = useClub();
  const [catFilter, setCatFilter] = useState<number | 'ALL'>('ALL');
  const [condFilter, setCondFilter] = useState<'ALL' | 'LOCAL' | 'VISITANTE'>('ALL');

  const partidos = useMemo(() => {
    return state.partidos
      .filter((p) => p.temporada_id === activeTemporadaId)
      .filter((p) => (catFilter === 'ALL' ? true : p.categoria_id === catFilter))
      .filter((p) => (condFilter === 'ALL' ? true : p.condicion === condFilter))
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  }, [state.partidos, activeTemporadaId, catFilter, condFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Módulo Deportivo · Calendario Oficial {activeTemporada.nombre}
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Fixture General del Club
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={catFilter}
            onChange={(e) =>
              setCatFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
          >
            <option value="ALL">Todas las categorías</option>
            {state.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            {(['ALL', 'LOCAL', 'VISITANTE'] as const).map((cond) => (
              <button
                key={cond}
                onClick={() => setCondFilter(cond)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  condFilter === cond
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cond === 'ALL' ? 'Todos' : cond}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium">Fecha y Hora</th>
                <th className="text-left py-2.5 px-4 font-medium">Categoría</th>
                <th className="text-left py-2.5 px-4 font-medium">Encuentro</th>
                <th className="text-left py-2.5 px-4 font-medium">Condición / Sede</th>
                <th className="text-left py-2.5 px-4 font-medium">Referee</th>
                <th className="text-right py-2.5 px-4 font-medium">Resultado / Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partidos.map((p) => {
                const cat = state.categorias.find((c) => c.id === p.categoria_id);
                const ref = state.referees.find((r) => r.id === p.referee_id);
                const torneo = state.torneos.find((t) => t.id === p.torneo_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {formatDateTimeAR(p.fecha_hora)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{cat?.nombre}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        Guaycurues vs {p.rival}
                      </div>
                      {torneo && <div className="text-[11px] text-slate-500">{torneo.nombre}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{p.condicion}</div>
                      <div className="text-[11px] text-slate-400">{p.cancha}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {ref?.nombre_completo ?? 'A designar'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.estado === 'FINALIZADO' ? (
                        <span className="font-mono tabular-nums font-bold text-emerald-700">
                          {p.resultado_local} - {p.resultado_visitante} (Final)
                        </span>
                      ) : (
                        <StatusLabel tone="sky" label="PROGRAMADO" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
