import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plane,
  MapPin,
  Users,
  Moon,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Select,
  cn,
  RefreshButton,
  formatLocaleNumber,
  parseLocaleNumber,
} from '../components/Components';
import {
  getProjects,
  getProjectExpenses,
  addProjectExpense,
  deleteProjectExpense,
} from '../services/db';
import {
  Project,
  ProjectType,
  ProjectExpense,
  User,
} from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// === Categorías fijas de viaje ===
const TRIP_CATEGORIES: string[] = [
  'Vuelos',
  'Hoteles',
  'Comidas',
  'Excursiones',
  'Tasas y visas',
  'Seguros',
  'Traslados',
  'Rover',
  'Otros',
];

type CurrencyMode = 'EUR' | 'TRIP';

const todayYMD = () => new Date().toISOString().slice(0, 10);

export const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form gasto
  const [fecha, setFecha] = useState<string>(todayYMD());
  const [categoria, setCategoria] = useState<string>('Comidas');
  const [descripcion, setDescripcion] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('TRIP');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ocultar/mostrar resumen (ojito)
  const [isSummaryHidden, setIsSummaryHidden] = useState<boolean>(true);

  // ============ CARGA INICIAL ============

  const loadProject = async (projectId: string) => {
    setLoading(true);
    try {
      const all = await getProjects();
      const p = all.find(
        (proj) => proj.id === projectId && proj.tipo === ProjectType.TRIP,
      );
      if (!p) {
        setNotFound(true);
        setProject(null);
      } else {
        setProject(p);
      }
    } catch (err) {
      console.error('Error cargando viaje', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (projectId: string) => {
    setLoadingExpenses(true);
    try {
      const data = await getProjectExpenses(projectId);
      const activos = data.filter((e) => e.estado !== 'borrado');
      setExpenses(activos);
    } catch (err) {
      console.error('Error cargando gastos de viaje', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/trips');
      return;
    }
    (async () => {
      await loadProject(id);
      await loadExpenses(id);
    })();
  }, [id, navigate]);

  // ============ CÁLCULOS RESUMEN ============

  const totalEUR = expenses.reduce((acc, e) => {
    const base = e.monto_en_moneda_principal ?? e.monto_original ?? 0;
    return acc + base;
  }, 0);

  const tipoCambioRef = project?.tipo_cambio_referencia;
  const totalTripCurrency =
    project && tipoCambioRef && tipoCambioRef > 0
      ? totalEUR * tipoCambioRef
      : null;

  const presupuesto = project?.presupuesto_total ?? 0;
  const restante = presupuesto > 0 ? presupuesto - totalEUR : null;

  const currentUser = (localStorage.getItem('currentUser') as User) || 'Diego';

  // ============ HELPERS ============

  const handleAmountBlur = () => {
    const val = parseLocaleNumber(monto);
    if (val > 0) setMonto(formatLocaleNumber(val, 2));
  };

  // ============ HANDLERS GASTOS ============

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!project || !id) {
      setFormError('No se encontró el viaje.');
      return;
    }

    const amount = parseLocaleNumber(monto);
    if (!monto || amount <= 0) {
      setFormError('Ingresa un monto válido.');
      return;
    }

    const fechaISO = new Date(`${fecha}T00:00:00`).toISOString();
    let monto_en_moneda_principal = 0;
    let monto_en_moneda_proyecto = 0;
    let monto_original = amount;
    let moneda_original: string;
    let tipo_cambio_usado = 0;

    if (currencyMode === 'EUR') {
      // Ingresas en EUR
      moneda_original = project.moneda_principal || 'EUR';
      monto_en_moneda_principal = amount;

      if (project.tipo_cambio_referencia && project.tipo_cambio_referencia > 0) {
        tipo_cambio_usado = project.tipo_cambio_referencia;
        monto_en_moneda_proyecto = amount * project.tipo_cambio_referencia;
      } else {
        // Sin tipo de cambio, dejamos 0 en moneda viaje
        tipo_cambio_usado = 0;
        monto_en_moneda_proyecto = 0;
      }
    } else {
      // Ingresas en moneda del viaje
      if (!project.tipo_cambio_referencia || project.tipo_cambio_referencia <= 0) {
        setFormError(
          'Para ingresar gastos en moneda del viaje primero define un tipo de cambio de referencia en la ficha del viaje.',
        );
        return;
      }
      moneda_original = String(project.moneda_proyecto || 'TRIP');
      tipo_cambio_usado = project.tipo_cambio_referencia;
      monto_en_moneda_proyecto = amount;
      // 1 EUR = X moneda viaje → EUR = local / X
      monto_en_moneda_principal = amount / project.tipo_cambio_referencia;
    }

    const payload: Omit<ProjectExpense, 'id'> = {
      proyecto_id: id,
      fecha: fechaISO,
      monto_original,
      moneda_original,
      tipo_cambio_usado,
      monto_en_moneda_proyecto,
      monto_en_moneda_principal,
      categoria: categoria || 'Otros',
      descripcion: descripcion || undefined,
      imagen_adjunta_url: undefined,
      creado_por_usuario_id: currentUser,
      estado: 'activo',
    };

    setSaving(true);
    try {
      await addProjectExpense(payload);
      setMonto('');
      setDescripcion('');
      setCategoria('Comidas');
      setFecha(todayYMD());
      await loadExpenses(id);
    } catch (err) {
      console.error('Error agregando gasto de viaje', err);
      setFormError('No se pudo guardar el gasto. Intenta otra vez.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (exp: ProjectExpense) => {
    if (!exp.id) return;
    const ok = window.confirm('¿Eliminar este gasto del viaje?');
    if (!ok || !id) return;
    try {
      await deleteProjectExpense(exp.id);
      await loadExpenses(id);
    } catch (err) {
      console.error('Error borrando gasto', err);
    }
  };

  // ============ RENDER ============

  if (loading && !project && !notFound) {
    return (
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/trips')}
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-lg font-semibold text-slate-800">
              Cargando viaje…
            </h1>
          </div>
          <RefreshButton />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="p-4 pb-24">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/trips')}
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">
            Viaje no encontrado
          </h1>
        </div>
        <Card className="p-4 text-sm text-slate-500">
          No pudimos encontrar este viaje. Vuelve a la lista y selecciona otro.
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/trips')}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-1">
              <Plane size={16} className="text-sky-500" />
              <h1 className="text-lg font-bold text-slate-800">
                {project.nombre}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {project.destino_principal && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={10} />
                  {project.destino_principal}
                </span>
              )}
              {project.noches_totales && (
                <span className="inline-flex items-center gap-1">
                  <Moon size={10} /> {project.noches_totales} noches hotel
                </span>
              )}
              {project.personas && (
                <span className="inline-flex items-center gap-1">
                  <Users size={10} /> {project.personas} personas
                </span>
              )}
            </div>
          </div>
        </div>
        <RefreshButton />
      </div>

      {/* Resumen del viaje con ojito + blur */}
      <Card className="relative bg-slate-900 text-white p-5 border-none shadow-xl overflow-hidden">
        {/* Contenido real */}
        <div
          className={cn(
            'relative transition-all',
            isSummaryHidden && 'pointer-events-none select-none blur-sm brightness-50',
          )}
        >
          <div className="flex justify-between items-start">
            <div className="z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Resumen del viaje
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                € {formatLocaleNumber(totalEUR, 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gastado en este viaje (en EUR).
              </p>
            </div>

            <div className="text-right text-xs z-10">
              <p className="text-slate-400 text-[10px] uppercase mb-1">
                Presupuesto
              </p>
              <p className="font-semibold">
                {presupuesto > 0
                  ? `€ ${formatLocaleNumber(presupuesto, 0)}`
                  : 'Sin definir'}
              </p>
              {restante !== null && (
                <p
                  className={cn(
                    'mt-1 text-[11px] font-semibold',
                    restante >= 0 ? 'text-emerald-400' : 'text-rose-300',
                  )}
                >
                  {restante >= 0
                    ? `Te quedan € ${formatLocaleNumber(restante, 0)}`
                    : `Te pasaste € ${formatLocaleNumber(
                        Math.abs(restante),
                        0,
                      )}`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs z-10">
            <div>
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                Moneda del viaje
              </span>
              <p className="font-semibold">
                {project.moneda_proyecto || '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ref: 1 EUR ≈{' '}
                {project.tipo_cambio_referencia
                  ? `${formatLocaleNumber(project.tipo_cambio_referencia, 2)} ${
                      project.moneda_proyecto || ''
                    }`
                  : 'sin tipo de cambio'}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                Total en moneda viaje
              </span>
              <p className="font-semibold">
                {totalTripCurrency !== null && project.moneda_proyecto
                  ? `${formatLocaleNumber(totalTripCurrency, 0)} ${
                      project.moneda_proyecto
                    }`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Overlay de oculto */}
        {isSummaryHidden && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl flex flex-col items-center justify-center z-20 px-6">
            <p className="text-xs text-slate-300 text-center mb-2">
              Toca “Ver” para mostrar el estado del presupuesto de este viaje.
            </p>
          </div>
        )}

        {/* Botón ojito, abajo a la derecha */}
        <button
          type="button"
          onClick={() => setIsSummaryHidden((prev) => !prev)}
          className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-[10px] text-slate-100 hover:bg-slate-700/90"
        >
          {isSummaryHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{isSummaryHidden ? 'Ver' : 'Ocultar'}</span>
        </button>
      </Card>

      {/* Módulo de ingreso de gasto estilo Home */}
      <Card className="p-3 bg-white shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Añadir gasto al viaje
            </h2>
            <p className="text-[11px] text-slate-400">
              Registra lo que vas gastando en EUR o en la moneda del viaje.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="space-y-3">
          {/* Monto + fecha (igual que Home) */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                €
              </span>
              <Input
                id="trip-amount-input"
                type="text"
                inputMode="decimal"
                aria-label="Monto del gasto del viaje"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                onBlur={handleAmountBlur}
                placeholder="0,00"
                className="pl-8 py-2 text-2xl font-bold border-none bg-slate-50 focus:ring-0 rounded-lg text-slate-800 placeholder:text-slate-200"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="Cambiar fecha del gasto de viaje"
                className="h-12 w-12 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-sky-600 border border-slate-100 relative overflow-hidden"
              >
                <CalendarIcon size={18} aria-hidden="true" />
                <span className="text-[9px] font-bold">
                  {format(new Date(fecha), 'd MMM', { locale: es }).toUpperCase()}
                </span>
                <input
                  type="date"
                  aria-label="Selector de fecha del gasto de viaje"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </button>
            </div>
          </div>

          {/* Categorías en chips horizontales */}
          <div
            role="group"
            aria-label="Categoría del gasto de viaje"
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
          >
            {TRIP_CATEGORIES.map((cat) => {
              const isSelected = categoria === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCategoria(cat)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[72px] px-3 py-2 rounded-xl transition-all border text-[10px]',
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white shadow-md scale-105'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span className="font-medium truncate w-full text-center">
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selector de moneda */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              Moneda en la que estás ingresando
            </span>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-[11px]">
              <button
                type="button"
                onClick={() => setCurrencyMode('EUR')}
                className={cn(
                  'flex-1 py-1.5 px-3 text-center',
                  currencyMode === 'EUR'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600',
                )}
              >
                EUR
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('TRIP')}
                className={cn(
                  'flex-1 py-1.5 px-3 text-center',
                  currencyMode === 'TRIP'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600',
                )}
              >
                {project.moneda_proyecto || 'Viaje'}
              </button>
            </div>
          </div>

          {/* Descripción + botón guardar (como Home) */}
          <div className="flex gap-2">
            <Input
              id="trip-description-input"
              aria-label="Descripción del gasto del viaje (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (Opcional)"
              className="py-2 text-sm bg-slate-50 border-none"
            />
            <Button
              type="submit"
              disabled={saving}
              aria-label="Agregar gasto al viaje"
              className="aspect-square p-0 w-10 h-10 rounded-xl bg-sky-600 text-white shrink-0"
            >
              <Plus size={20} aria-hidden="true" />
            </Button>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-1 text-[11px] text-red-500">
              <span>{formError}</span>
            </div>
          )}
        </form>
      </Card>

      {/* Historial de gastos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Historial del viaje
          </h3>
          {loadingExpenses && (
            <span className="text-[10px] text-slate-400">
              Actualizando…
            </span>
          )}
        </div>

        {expenses.length === 0 && (
          <Card className="p-4 text-[12px] text-slate-400">
            Aún no registras gastos para este viaje. Empieza arriba con el
            formulario.
          </Card>
        )}

        {expenses.length > 0 && (
          <Card className="divide-y divide-slate-100">
            {expenses.map((exp) => {
              const fechaLabel = exp.fecha
                ? format(new Date(exp.fecha), 'dd MMM', { locale: es })
                : '';
              const baseEUR =
                exp.monto_en_moneda_principal ?? exp.monto_original ?? 0;
              const localAmount = exp.monto_en_moneda_proyecto ?? 0;
              const muestraLocal =
                localAmount > 0 && project.moneda_proyecto ? true : false;

              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 w-12">
                        {fechaLabel}
                      </span>
                      <span className="text-[12px] font-medium text-slate-800">
                        {exp.categoria}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-12">
                      {exp.descripcion && (
                        <span className="text-[11px] text-slate-500">
                          {exp.descripcion}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-12 text-[11px] text-slate-500">
                      <span>€ {formatLocaleNumber(baseEUR, 2)}</span>
                      {muestraLocal && project.moneda_proyecto && (
                        <span className="text-slate-400">
                          · {formatLocaleNumber(localAmount, 2)}{' '}
                          {project.moneda_proyecto}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => handleDeleteExpense(exp)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
};
