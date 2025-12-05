
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectType, Currency } from '../types';
import { getProjects, createProject } from '../services/db';
import { Card, Button, Input, Select, formatLocaleNumber, parseLocaleNumber } from '../components/Components';
import { Plane, Briefcase, Plus, X } from 'lucide-react';

export const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // New Project State
  const [newType, setNewType] = useState<ProjectType>(ProjectType.TRIP);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newCurrency, setNewCurrency] = useState<Currency>(Currency.EUR);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  const handleCreate = async () => {
    const numericBudget = parseLocaleNumber(newBudget);
    if (!newName || !numericBudget) return;
    
    await createProject({
      tipo: newType,
      nombre: newName,
      presupuesto_total: numericBudget,
      moneda_principal: newCurrency,
      cerrado: false
    });
    
    setShowModal(false);
    setNewName('');
    setNewBudget('');
    loadProjects();
  };

  const handleBudgetBlur = () => {
    const val = parseLocaleNumber(newBudget);
    if (val > 0) setNewBudget(formatLocaleNumber(val));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
        <Button size="icon" onClick={() => setShowModal(true)} aria-label="Crear Nuevo Proyecto">
          <Plus size={24} aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map(p => (
          <Card 
            key={p.id} 
            className="p-0 hover:border-brand-300 transition-colors cursor-pointer"
          >
            <div className="p-4" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${p.tipo === ProjectType.TRIP ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {p.tipo === ProjectType.TRIP ? <Plane size={20} aria-hidden="true" /> : <Briefcase size={20} aria-hidden="true" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{p.nombre}</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{p.moneda_principal}</span>
                  </div>
                </div>
                {p.cerrado && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Cerrado</span>}
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Presupuesto</span>
                  <span className="font-semibold">{formatLocaleNumber(p.presupuesto_total)}</span>
                </div>
                {/* Visual progress bar placeholder */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-label="Progreso del presupuesto">
                  <div className="h-full bg-gray-300 w-0"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>No hay proyectos activos</p>
            <Button variant="ghost" className="mt-2 text-brand-600" onClick={() => setShowModal(true)}>Crear uno nuevo</Button>
          </div>
        )}
      </div>

      {/* Simple Modal for Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
          <Card className="w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 id="new-project-title" className="text-lg font-bold">Nuevo Proyecto</h2>
              <button onClick={() => setShowModal(false)} aria-label="Cerrar"><X size={20} className="text-gray-400" /></button>
            </div>
            
            <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Tipo de proyecto">
              <button 
                onClick={() => setNewType(ProjectType.TRIP)}
                role="radio"
                aria-checked={newType === ProjectType.TRIP}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${newType === ProjectType.TRIP ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}
              >
                Viaje
              </button>
              <button 
                onClick={() => setNewType(ProjectType.PROJECT)}
                role="radio"
                aria-checked={newType === ProjectType.PROJECT}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${newType === ProjectType.PROJECT ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
              >
                Proyecto
              </button>
            </div>

            <label htmlFor="new-project-name" className="sr-only">Nombre del proyecto</label>
            <Input 
              id="new-project-name"
              placeholder="Nombre (ej. Japón 2024)" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />
            
            <div className="flex gap-2">
              <label htmlFor="new-project-budget" className="sr-only">Presupuesto</label>
              <Input 
                id="new-project-budget"
                type="text" 
                inputMode="decimal"
                placeholder="Presupuesto" 
                className="flex-1"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
                onBlur={handleBudgetBlur}
              />
              <label htmlFor="new-project-currency" className="sr-only">Moneda</label>
              <Select 
                id="new-project-currency"
                className="w-24"
                options={Object.values(Currency).map(c => ({ label: c, value: c }))}
                value={newCurrency}
                onChange={e => setNewCurrency(e.target.value as Currency)}
              />
            </div>

            <Button className="w-full" onClick={handleCreate}>Crear</Button>
          </Card>
        </div>
      )}
    </div>
  );
};
