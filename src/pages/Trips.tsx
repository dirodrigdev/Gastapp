// src/pages/Trips.tsx

import React, { useEffect, useState } from 'react';
import { Plane, MapPin, Users, Moon, Hash } from 'lucide-react';
import { Card, Button, Input, Select, cn } from '../components/Components';
import { Project, ProjectType, CurrencyType } from '../types';
import { getProjects, createProject } from '../services/db';

// Opciones de moneda base del viaje
const currencyOptions = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'ARS', label: 'ARS (Peso argentino)' },
  { value: 'BRL', label: 'BRL (Real brasileño)' },
  { value: 'MXN', label: 'MXN (Peso mexicano)' },
  { value: 'CLP', label: 'CLP (Peso chileno)' },
  { value: 'THB', label: 'THB (Baht tailandés)' },
  { value: 'IDR', label: 'IDR (Rupia indonesia)' },
  { value: 'KRW', label: 'KRW (Won coreano)' },
  { value: 'LKR', label: 'LKR (Rupia de Sri Lanka)' },
  { value: 'JPY', label: 'JPY (Yen japonés)' },
  { value: 'OTRO', label: 'Otro…' },
];

const estadoLabel = (p: Project) => {
  const estado = p.estado_temporal || 'en_curso';
  if (estado === 'planeado') return 'PRÓXIMO';
  if (estado === 'pasado') return 'PASADO';
  return 'EN CURSO';
};

const estadoColor = (p: Project) => {
  const estado = p.estado_temporal || 'en_curso';
  if (estado === 'planeado') return 'bg-blue-100 text-blue-700';
  if (estado === 'pasado') return 'bg-slate-100 text-slate-600';
  return 'bg-green-100 text-green-700';
};

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario de creación
  const [nombre, setNombre] = useState('');
  const [destino, setDestino] = useState('');
  const [monedaPrincipal, setMonedaPrincipal] = useState<string>('EUR');
  const [monedaOtro, setMonedaOtro] = useState<string>('');
  const [tipoCambioRef, setTipoCambioRef] = useState<string>('');
  const [personas, setPersonas] = useState<string>('2');
  const [nochesHotel, setNochesHotel] = useState<string>('');
  const [nochesFuera, setNochesFuera] = useState<string>('');
  const [presupuesto, setPresupuesto] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      }
    };
    load();
  }, []);

  const resolveCurrency = (): CurrencyType => {
    if (monedaPrincipal === 'OTRO') {
      const code = monedaOtro.trim().toUpperCase();
      return code || 'OTRO';
    }
    return monedaPrincipal;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreOk = nombre.trim().length > 0;
    const currency = resolveCurrency();
    const monedaOk = currency.toString().trim().length > 0;

    const personasNum = parseInt(personas, 10);
    const nochesHotelNum = parseInt(nochesHotel, 10);
    const nochesFueraNum = nochesFuera ? parseInt(nochesFuera, 10) : 0;
    const tipoCambioNum = parseFloat(tipoCambioRef.replace(',', '.'));

    // Presupuesto opcional
    const presupuestoNum = presupuesto
      ? parseFloat(presupuesto.replace(/\./g, '').replace(',', '.'))
      : 0;

    // Validamos SOLO obligatorios: nombre, moneda, tipo de cambio, personas, noches hotel
    if (
      !nombreOk ||
      !monedaOk ||
      !personasNum ||
      !nochesHotelNum ||
      !tipoCambioNum
    ) {
      setFormError('Faltan datos obligatorios por ingresar.');
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      await createProject({
        tipo: ProjectType.TRIP,
        nombre: nombre.trim(),
        destino: destino.trim() || undefined,
        moneda_principal: currency,
        tipo_cambio_referencia: tipoCambioNum,
        presupuesto_total: isNaN(presupuestoNum) ? 0 : presupuestoNum,
        numero_personas: personasNum,
        noches_hotel: nochesHotelNum,
        noches_fuera: nochesFueraNum || 0,
        cerrado: false,
        estado_temporal: 'en_curso',
      });

      // Recargar viajes
      const data = await getProjects();
      setProjects(data);

      // Limpiar form
      setNombre('');
      setDestino('');
      setMonedaPrincipal('EUR');
      setMonedaOtro('');
      setTipoCambioRef('');
      setPersonas('2');
      setNochesHotel('');
      setNochesFuera('');
      setPresupuesto('');
    } catch (err) {
      console.error(err);
      setFormError('Ocurrió un error al guardar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrencyField = () => {
    const options = currencyOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
    }));

    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          Moneda del viaje *
        </label>
        <Select
          value={monedaPrincipal}
          onChange={(e) => setMonedaPrincipal(e.target.value)}
          options={options}
        />
        {monedaPrincipal === 'OTRO' && (
          <Input
            className="mt-2"
            placeholder="Código o símbolo (ej: MEX, COP, ฿)"
            value={monedaOtro}
            onChange={(e) => setMonedaOtro(e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Plane size={22} className="text-blue-600" />
            Viajes
          </h1>
          <p className="text-xs text-slate-400">
            Crea un viaje para seguir gastos separados de la vida diaria.
          </p>
        </div>
      </div>

      {/* Card de creación de viaje */}
      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          Nuevo viaje
        </h2>

        <form onSubmit={handleCreateProject} className="space-y-3">
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash size={12} />
                Nombre del viaje *
              </label>
              <Input
                placeholder="Ej: México 2025"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <MapPin size={12} />
                Destino principal (opcional)
              </label>
              <Input
                placeholder="Ej: Cancún"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
            </div>
          </div>

          {renderCurrencyField()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Tipo de cambio ref. *
              </label>
              <Input
                placeholder="Ej: 20 (1 EUR ≈ 20 MXN)"
                inputMode="decimal"
                value={tipoCambioRef}
                onChange={(e) => setTipoCambioRef(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Users size={12} />
                Personas *
              </label>
              <Input
                placeholder="2"
                inputMode="numeric"
                value={personas}
                onChange={(e) => setPersonas(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Moon size={12} />
                Noches de hotel *
              </label>
              <Input
                placeholder="Ej: 5"
                inputMode="numeric"
                value={nochesHotel}
                onChange={(e) => setNochesHotel(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Moon size={12} />
                Noches fuera de Madrid
              </label>
              <Input
                placeholder="Ej: 7"
                inputMode="numeric"
                value={nochesFuera}
                onChange={(e) => setNochesFuera(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Presupuesto estimado (opcional)
            </label>
            <Input
              placeholder="Ej: 2.500,00"
              inputMode="decimal"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-1"
          >
            {loading ? 'Guardando…' : 'Crear viaje'}
          </Button>

          {formError && (
            <p className="text-xs text-red-500 mt-1">
              {formError}
            </p>
          )}
        </form>
      </Card>

      {/* Lista de viajes (modo “wallet” simple por ahora) */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
          Tus viajes
        </h2>

        {projects.length === 0 && (
          <p className="text-xs text-slate-400 ml-1">
            Aún no tienes viajes creados.
          </p>
        )}

        <div className="space-y-3">
          {projects.map((p, idx) => {
            const isTop = idx === 0;
            return (
              <Card
                key={p.id || `${p.nombre}-${idx}`}
                className={cn(
                  'p-3 relative transition-all',
                  !isTop && 'scale-[0.97] translate-y-[-4px] opacity-90',
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase text-slate-500">
                        {p.destino || 'DESTINO'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {p.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} />
                        {p.numero_personas || 1} pers.
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Moon size={11} />
                        {p.noches_hotel || 0} noches hotel
                      </span>
                    </p>
                    {typeof p.presupuesto_total === 'number' && p.presupuesto_total > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Presupuesto: {p.presupuesto_total.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{' '}
                        {p.moneda_principal}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        estadoColor(p),
                      )}
                    >
                      {estadoLabel(p)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Moneda: {p.moneda_principal}
                    </span>
                    {p.tipo_cambio_referencia && (
                      <span className="text-[10px] text-slate-400">
                        TC ref: {p.tipo_cambio_referencia}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
