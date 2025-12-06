import React, { useEffect, useState } from 'react';
import { Plus, Plane } from 'lucide-react';
import { Card, Button, Input } from '../components/Components';
import { Project, ProjectType, Currency } from '../types';
import { getProjects, createProject } from '../services/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario “nuevo viaje”
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.EUR);
  const [budget, setBudget] = useState<string>('');

  const currentUser = localStorage.getItem('currentUser') || 'Usuario';

  // Cargar viajes existentes
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        // Por ahora: solo viajes
        setProjects(data.filter((p) => p.tipo === ProjectType.TRIP));
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setName('');
    setCurrency(Currency.EUR);
    setBudget('');
  };

  const handleNewTripClick = () => {
    setShowForm((prev) => !prev);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ponle un nombre al viaje (ej: México 2025)');
      return;
    }

    const numericBudget = Number(
      budget.replace(/\./g, '').replace(',', '.'),
    );
    const finalBudget = isNaN(numericBudget) ? 0 : numericBudget;

    try {
      setLoading(true);
      await createProject({
        tipo: ProjectType.TRIP,
        nombre: name.trim(),
        moneda_principal: currency,
        presupuesto_total: finalBudget,
        cerrado: false,
      });

      // Recargar lista
      const data = await getProjects();
      setProjects(data.filter((p) => p.tipo === ProjectType.TRIP));

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error creando viaje:', err);
      alert('Hubo un problema creando el viaje');
    } finally {
      setLoading(false);
    }
  };

  const formatMoneyNoDecimals = (value: number) => {
    const n = Number(value) || 0;
    const int = Math.round(n);
    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes</h1>
          <p className="text-xs text-slate-400">
            Módulo básico de viajes — {currentUser}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNewTripClick}
          className="flex items-center gap-1"
        >
          <Plus size={14} />
          <span className="text-xs font-semibold">
            {showForm ? 'Cancelar' : 'Nuevo viaje'}
          </span>
        </Button>
      </div>

      {/* Formulario simple de creación de viaje */}
      {showForm && (
        <Card className="p-4 space-y-3 border-blue-100 bg-blue-50/40">
          <h2 className="text-sm font-bold text-slate-700 mb-1">
            Crear nuevo viaje
          </h2>
          <form className="space-y-3" onSubmit={handleCreateTrip}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Nombre del viaje
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: México 2025 – Cancún"
                className="bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Moneda principal
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value={Currency.EUR}>EUR (€)</option>
                  <option value={Currency.USD}>USD ($)</option>
                  <option value={Currency.ARS}>ARS ($)</option>
                  <option value={Currency.BRL}>BRL (R$)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Presupuesto total (opcional)
                </label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  className="bg-white"
                  inputMode="decimal"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando viaje...' : 'Crear viaje'}
            </Button>
          </form>
        </Card>
      )}

      {/* Lista de viajes */}
      {projects.length === 0 && !showForm && (
        <Card className="p-4 flex flex-col items-center text-center gap-2 border-dashed border-slate-200">
          <Plane size={28} className="text-blue-500" />
          <p className="text-sm text-slate-600 font-medium">
            Aún no tienes viajes creados.
          </p>
          <p className="text-xs text-slate-400">
            Usa el botón <strong>“Nuevo viaje”</strong> para registrar tu próximo viaje.
          </p>
        </Card>
      )}

      {projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((p) => {
            const createdLabel = p.created_at
              ? format(new Date(p.created_at), 'dd MMM yyyy', { locale: es })
              : 'Sin fecha';

            return (
              <Card
                key={p.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                    <Plane size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {p.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Creado: {createdLabel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase">
                    Presupuesto
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatMoneyNoDecimals(p.presupuesto_total || 0)}{' '}
                    {p.moneda_principal}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
