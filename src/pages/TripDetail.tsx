import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plane,
  MapPin,
  Users,
  Moon,
  Calendar as CalendarIcon,
  PlusCircle,
  Trash2,
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
const TRIP_CATEGORIES = [
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

    const cleanedDescripcion = descripcion.trim();

    const payload: Omit<ProjectExpense, 'id'> = {
      proyecto_id: id,
      fecha: fechaISO,
      monto_original,
      moneda_original,
      tipo_cambio_usado,
      monto_en_moneda_proyecto,
      monto_en_moneda_principal,
      categoria: categoria || 'Otros',
      // 🔧 nunca mandamos undefined, Firestore se queja
      descripcion: cleanedDescripcion || '',
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

      {/* Resumen */}
      <Card className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-sky-600 font-semibold">
              Resumen del viaje
            </p>
            <p className="text-xs text-slate-500">
              Totales basados en lo registrado hasta ahora.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
          <div>
            <p className="text-[11px] text-slate-500">Total gastado (EUR)</p>
            <p className="text-base font-bold text-slate-900">
              € {formatLocaleNumber(totalEUR, 0)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">
              Total en {project.moneda_proyecto}
            </p>
            <p className="text-base font-bold text-slate-900">
              {totalTripCurrency !== null && project.moneda_proyecto
                ? `${formatLocaleNumber(totalTripCurrency, 0)} ${
                    project.moneda_proyecto
                  }`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Presupuesto (EUR)</p>
            <p className="text-sm font-semibold text-slate-900">
              {presupuesto > 0
                ? `€ ${formatLocaleNumber(presupuesto, 0)}`
                : 'Sin definir'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">
              {restante !== null ? 'Margen sobre presupuesto' : '—'}
            </p>
            <p
              className={cn(
                'text-sm font-semibold',
                restante !== null
                  ? restante >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                  : 'text-slate-400',
              )}
            >
              {restante !== null
                ? `${restante >= 0 ? '+' : '-'}€ ${formatLocaleNumber(
                    Math.abs(restante),
                    0,
                  )}`
                : 'Define un presupuesto en la ficha del viaje.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Form de nuevo gasto */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
            <PlusCircle size={18} />
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
          {/* Fecha + categoría */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Fecha
                <CalendarIcon size={10} className="text-slate-400" />
              </label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500">
                Categoría
              </label>
              <Select
                className="mt-1 text-sm"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                options={TRIP_CATEGORIES.map((c) => ({
                  label: c,
                  value: c,
                }))}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[11px] font-medium text-slate-500">
              Descripción (opcional)
            </label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cena en el hotel, taxi aeropuerto..."
              className="mt-1 text-sm"
            />
          </div>

          {/* Monto + modo de moneda */}
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-2 items-end">
            <div>
              <label className="text-[11px] font-medium text-slate-500">
                Monto
              </label>
              <Input
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                inputMode="decimal"
                placeholder={
                  currencyMode === 'TRIP'
                    ? `En ${project.moneda_proyecto || 'moneda viaje'}`
                    : 'En EUR'
                }
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500">
                Moneda
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                <button
                  type="button"
                  onClick={() => setCurrencyMode('EUR')}
                  className={cn(
                    'flex-1 py-1.5 text-center',
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
                    'flex-1 py-1.5 text-center',
                    currencyMode === 'TRIP'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600',
                  )}
                >
                  {project.moneda_proyecto || 'Viaje'}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-1 text-[11px] text-red-500">
              <span>{formError}</span>
            </div>
          )}

          <Button type="submit" disabled={saving} className="w-full mt-1">
            {saving ? 'Guardando gasto…' : 'Añadir gasto al viaje'}
          </Button>
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
                      <span>
                        € {formatLocaleNumber(baseEUR, 2)}
                      </span>
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
