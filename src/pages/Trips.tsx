import React, { useEffect, useState } from 'react';
import { Plus, Plane } from 'lucide-react';
import { Card, Button } from '../components/Components';
import { Project, ProjectType } from '../types';
import { getProjects } from '../services/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Trips: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const currentUser = localStorage.getItem('currentUser') || 'Usuario';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        // Por ahora mostramos solo los de tipo viaje
        setProjects(data.filter((p) => p.tipo === ProjectType.TRIP));
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      }
    };
    load();
  }, []);

  const handleNewTrip = () => {
    // Próximo paso: abriremos un modal / pantalla para crear viaje
    alert('Creación de viaje todavía en construcción 🚧');
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes</h1>
          <p className="text-xs text-slate-400">
            Módulo en construcción — visible solo para {currentUser}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNewTrip}
          className="flex items-center gap-1"
        >
          <Plus size={14} />
          <span className="text-xs font-semibold">Nuevo viaje</span>
        </Button>
      </div>

      {projects.length === 0 && (
        <Card className="p-4 flex flex-col items-center text-center gap-2 border-dashed border-slate-200">
          <Plane size={28} className="text-blue-500" />
          <p className="text-sm text-slate-600 font-medium">
            Aún no tienes viajes creados.
          </p>
          <p className="text-xs text-slate-400">
            Usa el botón <strong>“Nuevo viaje”</strong> para registrar tu próximo viaje
            (México 2025, por ejemplo).
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
                    <Plane size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {p.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Moneda: {p.moneda_principal} · Creado: {createdLabel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase">
                    Presupuesto
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {p.presupuesto_total || 0} {p.moneda_principal}
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
