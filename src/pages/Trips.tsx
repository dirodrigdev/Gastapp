import React, { useEffect, useState } from 'react';
import {
  Plane,
  MapPin,
  Users,
  Moon,
  Wallet,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  Card,
  Button,
  Input,
  Select,
  cn,
  RefreshButton,
  parseLocaleNumber,
  formatLocaleNumber,
} from '../components/Components';

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../services/db';
import {
  Project,
  ProjectType,
  Currency,
  CurrencyType,
} from '../types';

// =================== HELPERS ===================

const currencyOptions = [
  { label: 'EUR (€)', value: Currency.EUR },
  { label: 'USD ($)', value: Currency.USD },
  { label: 'ARS ($ argentino)', value: Currency.ARS },
  { label: 'BRL (R$ brasileño)', value: Currency.BRL },
  { label: 'CLP ($ chileno)', value: Currency.CLP },
  { label: 'MXN ($ mexicano)', value: Currency.MXN },
  { label: 'COP ($ colombiano)', value: Currency.COP },
  { label: 'JPY (¥ japonés)', value: Currency.JPY },
  { label: 'KRW (₩ coreano)', value: Currency.KRW },
  { label: 'THB (฿ tailandés)', value: Currency.THB },
  { label: 'IDR (Rp rupia indonesia)', value: Currency.IDR },
  { label: 'LKR (Rs rupia sri lanka)', value: Currency.LKR },
  { label: 'Otra…', value: 'OTRA' },
];

const projectColors = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
];

// Color determinístico por id para que no cambie al recargar
const getColorForProject = (id: string | undefined): string => {
  if (!id) return 'bg-slate-500';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * 17) % 997;
  }
  const idx = hash % projectColors.length;
  return projectColors[idx];
};

const getEstadoLabel = (p: Project): string => {
  if (p.estado_temporal === 'en_curso') return 'En curso';
  if (p.estado_temporal === 'pasado') return 'Pasado';
  if (p.estado_temporal === 'futuro') return 'Próximo viaje';
  // Default por ahora (hasta que tengamos fechas)
  return 'En preparación';
};

// =================== COMPONENTE PRINCIPAL ===================

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  // Edición
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Formulario nuevo / edición viaje
  const [nombreViaje, setNombreViaje] = useState('');
  const [destinoPrincipal, setDestinoPrincipal] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(Currency.MXN); // pensando en Cancún
  const [monedaCustom, setMonedaCustom] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [personas, setPersonas] = useState('2');
  const [noches, setNoches] = useState('');
  const [tipoCambio, setTipoCambio] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // =================== CARGA INICIAL ===================

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      const trips = data.filter((p) => p.tipo === ProjectType.TRIP);
      setProjects(trips);
    } catch (err) {
      console.error('Error cargando proyectos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // =================== HANDLERS ===================

  const resetForm = () => {
    setNombreViaje('');
    setDestinoPrincipal('');
    setPresupuesto('');
    setPersonas('2');
    setNoches('');
    setTipoCambio('');
    setSelectedCurrency(Currency.MXN);
    setMonedaCustom('');
    setFormError(null);
    setEditingProjectId(null);
  };

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = nombreViaje.trim();
    const trimmedDestino = destinoPrincipal.trim();

    if (!trimmedName) {
      setFormError('El nombre del viaje es obligatorio.');
      return;
    }

    // Resolver moneda del viaje
    let finalCurrency: CurrencyType;
    if (selectedCurrency === 'OTRA') {
      if (!monedaCustom.trim()) {
        setFormError('Indica el código o nombre de la moneda.');
        return;
      }
      finalCurrency = monedaCustom.trim().toUpperCase();
    } else {
      finalCurrency = selectedCurrency as CurrencyType;
    }

    // Presupuesto en EUR (opcional)
    const presupuestoValue = presupuesto
      ? parseLocaleNumber(presupuesto)
      : 0;

    if (presupuesto && presupuestoValue <= 0) {
      setFormError('El presupuesto debe ser mayor a 0 o dejarse vacío.');
      return;
    }

    const personasValue = personas ? parseInt(personas, 10) : undefined;
    const nochesValue = noches ? parseInt(noches, 10) : undefined;
    const tipoCambioValue = tipoCambio
      ? parseLocaleNumber(tipoCambio)
      : undefined;

    setCreating(true);
    try {
      if (editingProjectId) {
        // ======= EDICIÓN =======
        const existing = projects.find((p) => p.id === editingProjectId);
        if (!existing) {
          setFormError('El viaje que intentas editar ya no existe.');
          setCreating(false);
          setEditingProjectId(null);
          return;
        }

        const updated: Project = {
          ...existing,
          nombre: trimmedName,
          destino_principal: trimmedDestino || undefined,
          moneda_principal: Currency.EUR,
          moneda_proyecto: finalCurrency,
          presupuesto_total: presupuestoValue > 0 ? presupuestoValue : undefined,
          personas: personasValue,
          noches_totales: nochesValue,
          tipo_cambio_referencia: tipoCambioValue,
          // cerrado y estado_temporal quedan como estén
        };

        await updateProject(updated);
      } else {
        // ======= CREACIÓN =======
        const payload: Omit<Project, 'id' | 'created_at'> = {
          tipo: ProjectType.TRIP,
          nombre: trimmedName,
          destino_principal: trimmedDestino || undefined,
          moneda_principal: Currency.EUR, // base para ti
          moneda_proyecto: finalCurrency,
          presupuesto_total: presupuestoValue > 0 ? presupuestoValue : undefined,
          personas: personasValue,
          noches_totales: nochesValue,
          tipo_cambio_referencia: tipoCambioValue,
          cerrado: false,
          estado_temporal: 'futuro', // de momento, hasta que tengamos fechas
        };

        await createProject(payload);
      }

      resetForm();
      await loadProjects();
    } catch (err) {
      console.error('Error guardando viaje', err);
      setFormError('Ocurrió un error guardando el viaje. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (p: Project) => {
    if (!p) return;
    setEditingProjectId(p.id || null);
    setNombreViaje(p.nombre || '');
    setDestinoPrincipal(p.destino_principal || '');
    setPersonas(p.personas ? String(p.personas) : '2');
    setNoches(p.noches_totales ? String(p.noches_totales) : '');
    setPresupuesto(
      p.presupuesto_total && p.presupuesto_total > 0
        ? formatLocaleNumber(p.presupuesto_total, 0)
        : '',
    );
    setTipoCambio(
      p.tipo_cambio_referencia
        ? formatLocaleNumber(p.tipo_cambio_referencia, 2)
        : '',
    );

    // Moneda del viaje → o lista o "OTRA"
    const inList = currencyOptions.some(
      (opt) => opt.value === p.moneda_proyecto,
    );
    if (inList) {
      setSelectedCurrency(p.moneda_proyecto as string);
      setMonedaCustom('');
    } else if (p.moneda_proyecto) {
      setSelectedCurrency('OTRA');
      setMonedaCustom(String(p.moneda_proyecto));
    } else {
      setSelectedCurrency(Currency.MXN);
      setMonedaCustom('');
    }

    // Subir un poco la página para que vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (p: Project) => {
    if (!p.id) return;
    const ok = window.confirm(
      `¿Seguro que quieres borrar el viaje "${p.nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    try {
      await deleteProject(p.id);
      if (editingProjectId === p.id) {
        resetForm();
      }
      await loadProjects();
    } catch (err) {
      console.error('Error borrando viaje', err);
      setFormError('No se pudo borrar el viaje. Intenta de nuevo.');
    }
  };

  // =================== RENDER ===================

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header con botón de refresco */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes</h1>
          <p className="text-xs text-slate-400">
            Crea viajes y controla todo lo que gastas fuera de casa.
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Card de creación / edición */}
      <Card className="p-4 bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Plane size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {editingProjectId ? 'Editar viaje' : 'Crear nuevo viaje'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {editingProjectId
                ? 'Modifica los datos básicos del viaje.'
                : 'Define lo básico y después iremos sumando gastos.'}
            </p>
          </div>
        </div>

        {editingProjectId && (
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Editando viaje existente
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-blue-600 font-medium"
            >
              Cancelar edición
            </button>
          </div>
        )}

        <form onSubmit={handleCreateOrUpdateProject} className="space-y-3">
          {/* Nombre + destino */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500">
                Nombre del viaje *
              </label>
              <Input
                value={nombreViaje}
                onChange={(e) => setNombreViaje(e.target.value)}
                placeholder="Ej: México 2025"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Destino principal
                <MapPin size={10} className="text-slate-400" />
              </label>
              <Input
                value={destinoPrincipal}
                onChange={(e) => setDestinoPrincipal(e.target.value)}
                placeholder="Ej: Cancún"
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Moneda viaje + tipo cambio */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500">
                Moneda del viaje *
              </label>
              <Select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="mt-1 text-sm"
                options={currencyOptions}
              />
              {selectedCurrency === 'OTRA' && (
                <Input
                  className="mt-2 text-sm"
                  placeholder="Ej: MEX$, SGD, etc."
                  value={monedaCustom}
                  onChange={(e) => setMonedaCustom(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Tipo de cambio de referencia
                <span className="text-[10px] text-slate-400">
                  (1 EUR = ¿cuánta moneda del viaje?)
                </span>
              </label>
              <Input
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
                inputMode="decimal"
                placeholder="Ej: 20,00"
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Presupuesto + personas + noches */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-slate-500">
                Presupuesto total (EUR)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  €
                </span>
                <Input
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  inputMode="decimal"
                  placeholder="Opcional"
                  className="pl-6 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Personas
                <Users size={10} className="text-slate-400" />
              </label>
              <Input
                value={personas}
                onChange={(e) => setPersonas(e.target.value)}
                inputMode="numeric"
                className="mt-1 text-sm text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Noches de hotel
                <Moon size={10} className="text-slate-400" />
              </label>
              <Input
                value={noches}
                onChange={(e) => setNoches(e.target.value)}
                inputMode="numeric"
                className="mt-1 text-sm text-center"
              />
            </div>
          </div>

          {/* Error form */}
          {formError && (
            <div className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle size={12} />
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={creating}
            className="w-full mt-2"
          >
            {creating
              ? editingProjectId
                ? 'Guardando cambios…'
                : 'Guardando viaje…'
              : editingProjectId
              ? 'Guardar cambios'
              : 'Crear viaje'}
          </Button>
        </form>
      </Card>

      {/* Lista de viajes / wallet básica */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} className="text-slate-400" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tus viajes
          </h3>
        </div>

        {loading && (
          <Card className="p-4 text-sm text-slate-500">
            Cargando viajes…
          </Card>
        )}

        {!loading && projects.length === 0 && (
          <Card className="p-4 text-sm text-slate-400">
            Todavía no tienes viajes creados. Empieza arriba con tu próximo viaje.
          </Card>
        )}

        {!loading &&
          projects.length > 0 &&
          projects.map((p) => {
            const color = getColorForProject(p.id);
            const estadoLabel = getEstadoLabel(p);

            return (
              <Card
                key={p.id}
                className={cn(
                  'p-4 border border-slate-100 shadow-sm flex flex-col gap-2',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center text-white',
                        color,
                      )}
                    >
                      <Plane size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {p.nombre}
                        </h4>
                      </div>
                      {p.destino_principal && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin size={10} />
                          <span>{p.destino_principal}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      {estadoLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-500">
                  <div>
                    <span className="block text-slate-400">Moneda viaje</span>
                    <span className="font-medium">
                      {p.moneda_proyecto || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Presupuesto (EUR)</span>
                    <span className="font-medium">
                      {p.presupuesto_total && p.presupuesto_total > 0
                        ? `€ ${formatLocaleNumber(p.presupuesto_total, 0)}`
                        : 'Sin definir'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Personas</span>
                    <span className="font-medium">{p.personas ?? '-'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Noches hotel</span>
                    <span className="font-medium">
                      {p.noches_totales ?? '-'}
                    </span>
                  </div>
                </div>

                {p.tipo_cambio_referencia && (
                  <div className="mt-1 text-[11px] text-slate-400">
                    Ref: 1 {p.moneda_principal || 'EUR'} ≈{' '}
                    {formatLocaleNumber(p.tipo_cambio_referencia, 2)}{' '}
                    {p.moneda_proyecto}
                  </div>
                )}

                {/* Acciones: editar / borrar */}
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(p)}
                    className="flex items-center gap-1"
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => handleDeleteClick(p)}
                    aria-label="Borrar viaje"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
};
