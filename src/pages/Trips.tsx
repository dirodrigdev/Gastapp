import React, { useEffect, useState } from 'react';
import { Plane, MapPin, Plus } from 'lucide-react';
import { Card, Button, Input, Select } from '../components/Components';
import { Project, ProjectType, CurrencyType } from '../types';
import { getProjects, createProject } from '../services/db';

// Opciones fijas de moneda para el desplegable
const CURRENCY_OPTIONS = [
  { value: '',      label: 'Selecciona moneda…' },
  { value: 'EUR',   label: 'EUR (Euro)' },
  { value: 'USD',   label: 'USD (Dólar USA)' },
  { value: 'ARS',   label: 'ARS (Peso argentino)' },
  { value: 'CLP',   label: 'CLP (Peso chileno)' },
  { value: 'JPY',   label: 'JPY (Yen japonés)' },
  { value: 'LKR',   label: 'LKR (Rupia de Sri Lanka)' },
  { value: 'KRW',   label: 'KRW (Won de Corea)' },
  { value: 'THB',   label: 'THB (Baht de Tailandia)' },
  { value: 'IDR',   label: 'IDR (Rupia indonesia)' },
  { value: 'BRL',   label: 'BRL (Real brasileño)' },
  { value: 'OTHER', label: 'OTRO (escribir moneda)' },
];

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario creación de viaje
  const [nombre, setNombre] = useState('');
  const [monedaPrincipal, setMonedaPrincipal] = useState<CurrencyType>('');
  const [monedaCustom, setMonedaCustom] = useState(''); // para "OTRO"
  const [presupuesto, setPresupuesto] = useState('');

  const [tipoCambio, setTipoCambio] = useState(''); // 1 EUR = X moneda viaje
  const [numeroPersonas, setNumeroPersonas] = useState('');
  const [nochesHotel, setNochesHotel] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const clean = value.replace(/\./g, '').replace(',', '.');
    const n = Number(clean);
    return isNaN(n) ? 0 : n;
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (!monedaPrincipal) return;

    // Si es OTRO, usamos la custom como moneda real
    const effectiveCurrency =
      monedaPrincipal === 'OTHER'
        ? (monedaCustom.trim().toUpperCase() as CurrencyType)
        : (monedaPrincipal as string as CurrencyType);

    if (!effectiveCurrency) return;

    const numericBudget = parseNumber(presupuesto);
    const safeBudget = isNaN(numericBudget) ? 0 : numericBudget;

    const tc = parseNumber(tipoCambio);
    const personas = parseInt(numeroPersonas || '0', 10);
    const noches = parseInt(nochesHotel || '0', 10);

    setLoading(true);
    try {
      const payload: Omit<Project, 'id' | 'created_at'> = {
        tipo: ProjectType.TRIP,
        nombre: nombre.trim(),
        moneda_principal: effectiveCurrency,
        presupuesto_total: safeBudget,
        cerrado: false,
        // nuevos campos
        tipo_cambio_referencia: tc > 0 ? tc : undefined,
        numero_personas: personas > 0 ? personas : undefined,
        noches_hotel: noches > 0 ? noches : undefined,
      };
      await createProject(payload);

      // limpiar formulario
      setNombre('');
      setMonedaPrincipal('');
      setMonedaCustom('');
      setPresupuesto('');
      setTipoCambio('');
      setNumeroPersonas('');
      setNochesHotel('');

      await loadProjects();
    } finally {
      setLoading(false);
    }
  };

  const isOtherCurrency = monedaPrincipal === 'OTHER';

  const isSubmitDisabled =
    loading ||
    !nombre.trim() ||
    !monedaPrincipal ||
    (isOtherCurrency && !monedaCustom.trim());

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
          {/* Nombre */}
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

          {/* Moneda + presupuesto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="trip-currency"
                className="text-xs font-medium text-slate-500"
              >
                Moneda principal
              </label>
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

          {/* Moneda custom cuando eliges OTRO */}
          {isOtherCurrency && (
            <div className="space-y-1">
              <label
                htmlFor="custom-currency"
                className="text-xs font-medium text-slate-500"
              >
                Especifica la moneda (código o símbolo)
              </label>
              <Input
                id="custom-currency"
                placeholder="Ej: MXN, COP, ₱…"
                value={monedaCustom}
                onChange={(e) => setMonedaCustom(e.target.value)}
              />
            </div>
          )}

          {/* Tipo de cambio / personas / noches */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="trip-rate"
                className="text-xs font-medium text-slate-500"
              >
                Tipo de cambio ref.
              </label>
              <Input
                id="trip-rate"
                inputMode="decimal"
                placeholder="Ej: 20,00"
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                1 EUR = X moneda del viaje
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="trip-people"
                className="text-xs font-medium text-slate-500"
              >
                Nº personas
              </label>
              <Input
                id="trip-people"
                inputMode="numeric"
                placeholder="2"
                value={numeroPersonas}
                onChange={(e) => setNumeroPersonas(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="trip-nights"
                className="text-xs font-medium text-slate-500"
              >
                Nº noches hotel
              </label>
              <Input
                id="trip-nights"
                inputMode="numeric"
                placeholder="5"
                value={nochesHotel}
                onChange={(e) => setNochesHotel(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full flex items-center justify-center gap-2 mt-1"
          >
            <Plus size={16} />
            {loading ? 'Creando viaje…' : 'Crear viaje'}
          </Button>
        </form>
      </Card>

      {/* Lista de viajes (visión simple por ahora) */}
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
                {(p.numero_personas || p.noches_hotel) && (
                  <p className="text-[10px] text-slate-400">
                    {p.numero_personas
                      ? `${p.numero_personas} persona${p.numero_personas > 1 ? 's' : ''}`
                      : ''}
                    {p.numero_personas && p.noches_hotel ? ' · ' : ''}
                    {p.noches_hotel
                      ? `${p.noches_hotel} noche${p.noches_hotel > 1 ? 's' : ''}`
                      : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {p.presupuesto_total > 0 && (
                <p className="text-xs text-slate-500">
                  Presupuesto:{' '}
                  <span className="font-semibold">
                    {p.moneda_principal}{' '}
                    {p.presupuesto_total.toLocaleString('es-ES')}
                  </span>
                </p>
              )}
              {p.tipo_cambio_referencia && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  1 EUR ≈ {p.tipo_cambio_referencia.toLocaleString('es-ES')}{' '}
                  {p.moneda_principal}
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
