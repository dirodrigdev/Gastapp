import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  BedDouble,
  Wallet,
} from 'lucide-react';
import { Card, Button, Input, Select, cn, formatLocaleNumber } from '../components/Components';
import { Project, ProjectType, CurrencyType, User } from '../types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../services/db';

const BASE_CURRENCIES: { label: string; value: string }[] = [
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'Dólar (USD)', value: 'USD' },
  { label: 'Peso Argentino (ARS)', value: 'ARS' },
  { label: 'Peso Chileno (CLP)', value: 'CLP' },
  { label: 'Real Brasileño (BRL)', value: 'BRL' },
  { label: 'Peso Mexicano (MXN)', value: 'MXN' },
  { label: 'Yen Japonés (JPY)', value: 'JPY' },
  { label: 'Rupia Sri Lanka (LKR)', value: 'LKR' },
  { label: 'Won Coreano (KRW)', value: 'KRW' },
  { label: 'Baht Tailandés (THB)', value: 'THB' },
  { label: 'Rupia Indonesia (IDR)', value: 'IDR' },
  { label: 'Otra moneda…', value: 'OTRO' },
];

const currentUser: User = (localStorage.getItem('currentUser') as User) || 'Diego';

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // UI / formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [destino, setDestino] = useState('');
  const [monedaProyecto, setMonedaProyecto] = useState<string>('EUR');
  const [monedaProyectoCustom, setMonedaProyectoCustom] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [personas, setPersonas] = useState('');
  const [nochesHotel, setNochesHotel] = useState('');
  const [tipoCambioRef, setTipoCambioRef] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ------------ CARGA INICIAL ------------
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      const trips = data.filter((p) => p.tipo === ProjectType.TRIP);
      setProjects(trips);
    } catch (e) {
      console.error('Error cargando proyectos', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ------------ HELPERS ------------
  const getMonedaProyectoValue = () => {
    if (monedaProyecto === 'OTRO') {
      return (monedaProyectoCustom || '').trim() || '???';
    }
    return monedaProyecto;
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setDestino('');
    setMonedaProyecto('EUR');
    setMonedaProyectoCustom('');
    setPresupuesto('');
    setPersonas('');
    setNochesHotel('');
    setTipoCambioRef('');
    setErrorMessage(null);
  };

  const openForCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openForEdit = (project: Project) => {
    setEditingId(project.id || null);
    setNombre(project.nombre || '');
    setDestino((project.destino_principal as string) || '');

    const monedaProj = (project.moneda_proyecto as string) || project.moneda_principal || 'EUR';
    const found = BASE_CURRENCIES.find((m) => m.value === monedaProj);
    if (found) {
      setMonedaProyecto(monedaProj);
      setMonedaProyectoCustom('');
    } else {
      setMonedaProyecto('OTRO');
      setMonedaProyectoCustom(monedaProj);
    }

    setPresupuesto(
      project.presupuesto_total ? formatLocaleNumber(project.presupuesto_total, 0) : '',
    );
    setPersonas(
      project.numero_personas != null ? String(project.numero_personas) : '',
    );
    setNochesHotel(
      project.noches_hotel != null ? String(project.noches_hotel) : '',
    );
    setTipoCambioRef(
      project.tipo_cambio_referencia != null
        ? String(project.tipo_cambio_referencia)
        : '',
    );

    setErrorMessage(null);
    setShowForm(true);
  };

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  // ------------ GUARDAR (CREAR / EDITAR) ------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const nombreClean = nombre.trim();
    const destinoClean = destino.trim();
    const monedaClean = getMonedaProyectoValue().trim();

    if (!nombreClean || !monedaClean) {
      setErrorMessage('Faltan datos obligatorios por ingresar.');
      return;
    }

    const presupuestoNumber = parseNumber(presupuesto);
    const personasNumber = parseInt(personas || '0', 10) || 0;
    const nochesHotelNumber = parseInt(nochesHotel || '0', 10) || 0;
    const tipoCambioNumber = parseFloat(tipoCambioRef || '0') || 0;

    const basePayload: Omit<Project, 'id'> = {
      tipo: ProjectType.TRIP,
      nombre: nombreClean,
      destino_principal: destinoClean || undefined,
      moneda_principal: 'EUR' as CurrencyType,
      moneda_proyecto: monedaClean as CurrencyType,
      tipo_cambio_referencia: tipoCambioNumber || undefined,
      presupuesto_total: presupuestoNumber,
      numero_personas: personasNumber || undefined,
      noches_hotel: nochesHotelNumber || undefined,
      cerrado: false,
      estado_temporal: undefined,
      created_at: undefined,
    };

    try {
      if (editingId) {
        await updateProject({
          id: editingId,
          ...basePayload,
        });
      } else {
        await createProject(basePayload);
      }
      await loadProjects();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error guardando viaje', err);
      setErrorMessage('Error al guardar el viaje. Intenta de nuevo.');
    }
  };

  const handleDelete = async (project: Project) => {
    if (!project.id) return;
    const ok = confirm(`¿Seguro que quieres borrar el viaje "${project.nombre}"?`);
    if (!ok) return;

    try {
      await deleteProject(project.id);
      await loadProjects();
    } catch (err) {
      console.error('Error borrando viaje', err);
      alert('No se pudo borrar el viaje.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ----------------- RENDER -----------------

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes</h1>
          <p className="text-xs text-slate-400">
            Proyectos de viaje separados de los gastos del mes
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={openForCreate}
          aria-label="Crear nuevo viaje"
        >
          <Plus size={16} className="mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Formulario crear/editar */}
      {showForm && (
        <Card className="p-4 space-y-3 border-blue-100 bg-blue-50/60">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-slate-700">
              {editingId ? 'Editar viaje' : 'Nuevo viaje'}
            </h2>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-600"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cerrar
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
              {errorMessage}
            </p>
          )}

          <form className="space-y-3" onSubmit={handleSave}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Nombre del viaje *
              </label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: México 2025 – Cancún"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Destino principal (opcional)
              </label>
              <Input
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej: Cancún"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Moneda principal del viaje *
                </label>
                <Select
                  value={monedaProyecto}
                  onChange={(e) => setMonedaProyecto(e.target.value)}
                  options={BASE_CURRENCIES}
                />
              </div>

              {monedaProyecto === 'OTRO' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Código / símbolo
                  </label>
                  <Input
                    value={monedaProyectoCustom}
                    onChange={(e) => setMonedaProyectoCustom(e.target.value)}
                    placeholder="Ej: MEX, COP, etc."
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Wallet size={12} />
                  Presupuesto total (opcional)
                </label>
                <Input
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Tipo de cambio ref. (opcional)
                </label>
                <Input
                  value={tipoCambioRef}
                  onChange={(e) => setTipoCambioRef(e.target.value)}
                  placeholder="Ej: 20 (EUR → moneda viaje)"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Users size={12} />
                  Personas (opcional)
                </label>
                <Input
                  value={personas}
                  onChange={(e) => setPersonas(e.target.value.replace(/\D/g, ''))}
                  placeholder="2"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <BedDouble size={12} />
                  Noches de hotel (opcional)
                </label>
                <Input
                  value={nochesHotel}
                  onChange={(e) => setNochesHotel(e.target.value.replace(/\D/g, ''))}
                  placeholder="5"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                {editingId ? 'Guardar cambios' : 'Crear viaje'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de viajes */}
      <div className="space-y-3">
        {loading && (
          <p className="text-sm text-slate-400">Cargando viajes…</p>
        )}

        {!loading && projects.length === 0 && (
          <Card className="p-4 text-sm text-slate-500">
            <p className="font-medium mb-1">Sin viajes aún</p>
            <p className="text-xs text-slate-400">
              Crea tu primer viaje para separar sus gastos del presupuesto mensual.
            </p>
          </Card>
        )}

        {!loading &&
          projects.map((p) => {
            const moneda = (p.moneda_proyecto as string) || p.moneda_principal || 'EUR';
            const presu = p.presupuesto_total || 0;
            const personasNum = p.numero_personas || 0;
            const nochesNum = p.noches_hotel || 0;

            const presuLabel =
              presu > 0 ? `${formatLocaleNumber(presu, 0)} ${moneda}` : 'Sin presupuesto';
            const costoPorPersona =
              presu > 0 && personasNum > 0
                ? `${formatLocaleNumber(presu / personasNum, 0)} ${moneda}/persona`
                : '';
            const costoPorNoche =
              presu > 0 && nochesNum > 0
                ? `${formatLocaleNumber(presu / nochesNum, 0)} ${moneda}/noche`
                : '';

            const isExpanded = expandedId === p.id;

            return (
              <Card
                key={p.id}
                className={cn(
                  'p-3 relative overflow-hidden border-slate-200 transition-all',
                  isExpanded ? 'bg-sky-50' : 'bg-white',
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {p.nombre}
                    </p>
                    {p.destino_principal && (
                      <p className="text-xs text-slate-500 truncate">
                        Destino: {p.destino_principal}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Presupuesto: <span className="font-medium">{presuLabel}</span>
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {costoPorPersona && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Users size={10} />
                          {costoPorPersona}
                        </span>
                      )}
                      {costoPorNoche && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <BedDouble size={10} />
                          {costoPorNoche}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Editar viaje"
                        onClick={() => openForEdit(p)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Borrar viaje"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => p.id && toggleExpand(p.id)}
                      className="mt-1 text-[10px] text-slate-400 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={10} /> Ocultar detalle
                        </>
                      ) : (
                        <>
                          <ChevronDown size={10} /> Ver detalle
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="text-[11px] text-slate-500">
                      Moneda del viaje: <span className="font-semibold">{moneda}</span>
                    </p>
                    {p.tipo_cambio_referencia && (
                      <p className="text-[11px] text-slate-500">
                        Tipo de cambio ref.:{' '}
                        <span className="font-semibold">
                          {p.tipo_cambio_referencia}
                        </span>
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                      {personasNum > 0 && (
                        <span>
                          Personas:{' '}
                          <span className="font-semibold">{personasNum}</span>
                        </span>
                      )}
                      {nochesNum > 0 && (
                        <span>
                          Noches hotel:{' '}
                          <span className="font-semibold">{nochesNum}</span>
                        </span>
                      )}
                    </div>
                    {/* Aquí luego colgaremos el historial de gastos del viaje */}
                  </div>
                )}
              </Card>
            );
          })}
      </div>
    </div>
  );
};
