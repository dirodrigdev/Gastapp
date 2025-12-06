import React, { useEffect, useState } from 'react';
import { Plane, MapPin, Plus } from 'lucide-react';
import { Card, Button, Input, Select } from '../components/Components';
import { Project, ProjectType, CurrencyType } from '../types';
import { getProjects, createProject } from '../services/db';

// Opciones fijas de moneda para el desplegable
const CURRENCY_OPTIONS = [
  { value: '',    label: 'Selecciona moneda…' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'USD', label: 'USD (Dólar USA)' },
  { value: 'ARS', label: 'ARS (Peso argentino)' },
  { value: 'CLP', label: 'CLP (Peso chileno)' },
  { value: 'JPY', label: 'JPY (Yen japonés)' },
  { value: 'LKR', label: 'LKR (Rupia de Sri Lanka)' },
  { value: 'KRW', label: 'KRW (Won de Corea)' },
  { value: 'THB', label: 'THB (Baht de Tailandia)' },
  { value: 'IDR', label: 'IDR (Rupia indonesia)' },
  { value: 'BRL', label: 'BRL (Real brasileño)' },
];

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario básico de creación de viaje
  const [nombre, setNombre] = useState('');
  const [monedaPrincipal, setMonedaPrincipal] = useState<CurrencyType>('');
  const [presupuesto, setPresupuesto] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (!monedaPrincipal) return;

    const numericBudget = Number(
      presupuesto.replace(/\./g, '').replace(',', '.'),
    );
    const safeBudget = isNaN(numericBudget) ? 0 : numericBudget;

    setLoading(true);
    try {
      const payload: Omit<Project, 'id' | 'created_at'> = {
        tipo: ProjectType.TRIP,
        nombre: nombre.trim(),
        moneda_principal: (monedaPrincipal as string).toUpperCase(),
        presupuesto_total: safeBudget,
        cerrado: false,
      };
      await createProject(payload);
      setNombre('');
      setMonedaPrincipal('');
      setPresupuesto('');
      await loadProjects();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plane size={22} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Viajes</h1>
            <p className="text-xs text-slate-400">
              Crea viajes para seguir tus gastos por separado.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de nuevo viaje */}
      <Card className="p-4 space-y-3 border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          Nuevo viaje
        </h2>
        <form className="space-y-3" onSubmit={handleCreateTrip}>
          <div className="space-y-1">
            <label
              htmlFor="trip-name"
              className="text-xs font-medium text-slate-500"
            >
              Nombre del viaje
            </label>
            <Input
              id="trip-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: México 2025 – Cancún"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="trip-currency"
                className="text-xs font-medium text-slate-500"
              >
                Moneda principal
              </label>
              {/* AQUÍ VA AHORA EL DESPLEGABLE REAL */}
              <Select
                id="trip-currency"
                value={monedaPrincipal}
                onChange={(e) => setMonedaPrincipal(e.target.value)}
                options={CURRENCY_OPTIONS}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="trip-budget"
                className="text-xs font-medium text-slate-500"
              >
                Presupuesto (opcional)
              </label>
              <Input
                id="trip-budget"
                inputMode="decimal"
                placeholder="0,00"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !nombre.trim() || !monedaPrincipal}
            className="w-full flex items-center justify-center gap-2 mt-1"
          >
            <Plus size={16} />
            {loading ? 'Creando viaje…' : 'Crear viaje'}
          </Button>
        </form>
      </Card>

      {/* Lista de viajes (modo simple aún) */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
          Tus viajes
        </h2>

        {projects.length === 0 && (
          <Card className="p-4 text-sm text-slate-400 text-center">
            Aún no tienes viajes creados.
          </Card>
        )}

        {projects.map((p) => (
          <Card
            key={p.id}
            className="p-3 flex items-center justify-between border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                  {p.nombre}
                </p>
                <p className="text-[11px] text-slate-400">
                  Moneda: {p.moneda_principal ?? '—'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {p.presupuesto_total > 0 && (
                <p className="text-xs text-slate-500">
                  Presupuesto:{' '}
                  <span className="font-semibold">
                    {p.moneda_principal} {p.presupuesto_total.toLocaleString('es-ES')}
                  </span>
                </p>
              )}
              <p className="text-[10px] uppercase text-slate-400 mt-1">
                {p.cerrado ? 'Finalizado' : 'En curso / Borrador'}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
