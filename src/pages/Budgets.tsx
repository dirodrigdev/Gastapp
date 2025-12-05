import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Card, Button, Input, formatLocaleNumber, parseLocaleNumber, calculatePeriodInfo, ICON_KEYS, ICON_MAP, cn } from '../components/Components';
import { Category } from '../types';
import { getCategories, saveCategory, deleteCategory, getClosingConfig, getMonthlyReports } from '../services/db';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const Budgets = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para la etiqueta correcta del periodo
  const [periodLabel, setPeriodLabel] = useState('');

  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [budgetStr, setBudgetStr] = useState('');
  const [selectedIconKey, setSelectedIconKey] = useState('General');

  // Delete safety
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Cargamos todo en paralelo para que sea rápido y consistente
    const [cats, config, reports] = await Promise.all([
        getCategories(), 
        getClosingConfig(), 
        getMonthlyReports()
    ]);
    
    setCategories(cats);

    // --- CÁLCULO DE PERIODO ACTIVO (Misma lógica blindada del Home/Settings) ---
    const diaCierre = config.diaFijo || 11;
    const theoreticalPeriod = calculatePeriodInfo(new Date(), diaCierre);
    
    const sortedReports = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
    const lastReport = sortedReports.length > 0 ? sortedReports[0] : null;

    let realStartDate = theoreticalPeriod.startDate;
    let periodNumber = theoreticalPeriod.periodNumber;
    
    if (lastReport) {
        // Corrección de zona horaria (Mediodía) para evitar desfases
        const lastEnd = new Date(lastReport.fechaFin);
        lastEnd.setHours(12, 0, 0, 0); 
        
        const nextStart = addDays(lastEnd, 1);
        nextStart.setHours(0, 0, 0, 0);
        realStartDate = nextStart;
        periodNumber = (lastReport.numeroPeriodo || 0) + 1;
    }

    let nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth(), diaCierre);
    
    // Ajuste de fecha de cierre si cae antes del inicio
    if (nextClosingDate.getTime() < realStartDate.getTime()) {
        nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth() + 1, diaCierre);
    }
    
    setPeriodLabel(`P${periodNumber} (${format(realStartDate, 'd MMM', { locale: es })} - ${format(nextClosingDate, 'd MMM', { locale: es })})`.toUpperCase());
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.nombre);
      setBudgetStr(formatLocaleNumber(cat.presupuestoMensual));
      setSelectedIconKey(cat.icono || 'General'); 
    } else {
      setEditingCat(null);
      setName('');
      setBudgetStr('');
      setSelectedIconKey('General');
    }
    setModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const budgetVal = parseLocaleNumber(budgetStr);
    
    const newCat: Category = {
      id: editingCat ? editingCat.id : crypto.randomUUID(),
      nombre: name,
      presupuestoMensual: budgetVal,
      activa: true,
      icono: selectedIconKey
    };

    await saveCategory(newCat);
    setLoading(false);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
        await deleteCategory(id);
        setDeleteConfirmId(null);
        loadData();
    } else {
        setDeleteConfirmId(id);
        setTimeout(() => setDeleteConfirmId(null), 3000); // Reset after 3s
    }
  };

  const totalBudget = categories.reduce((acc, c) => acc + c.presupuestoMensual, 0);

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600" aria-label="Volver"><ArrowLeft size={24} aria-hidden="true" /></button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
            {/* Usamos la etiqueta calculada correctamente */}
            <p className="text-xs text-slate-500 font-medium">{periodLabel}</p>
        </div>
      </div>

      <Card className="bg-blue-600 text-white p-5 border-none shadow-blue-500/20">
        <h3 className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Presupuesto Mensual</h3>
        <p className="text-3xl font-bold">€ {formatLocaleNumber(totalBudget)}</p>
      </Card>

      <div className="flex justify-between items-center mt-6 mb-2">
        <h3 className="text-lg font-bold text-slate-800">Listado</h3>
        <Button size="sm" onClick={() => handleOpenModal()} className="h-9"><Plus size={16} className="mr-1" aria-hidden="true" /> Nueva</Button>
      </div>

      <div className="space-y-3" role="list">
        {categories.map(cat => (
          <div key={cat.id} role="listitem" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{cat.nombre}</p>
              <p className="text-sm text-gray-500">€ {formatLocaleNumber(cat.presupuestoMensual)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal(cat)} aria-label={`Editar categoría ${cat.nombre}`} className="p-2 bg-gray-50 text-gray-600 rounded-lg"><Edit2 size={16} aria-hidden="true" /></button>
              <button 
                onClick={() => handleDelete(cat.id)} 
                aria-label={`Borrar categoría ${cat.nombre}`}
                className={cn(
                    "p-2 rounded-lg transition-colors", 
                    deleteConfirmId === cat.id ? "bg-red-500 text-white" : "bg-red-50 text-red-500"
                )}
              >
                 <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
          <Card className="w-full max-w-sm p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center">
                <h3 id="cat-modal-title" className="text-lg font-bold">{editingCat ? 'Editar' : 'Nueva'}</h3>
                <button onClick={() => setModalOpen(false)} aria-label="Cerrar"><X size={20} className="text-gray-400"/></button>
             </div>

             <div>
               <label htmlFor="cat-name" className="text-xs font-semibold text-gray-500 ml-1">Nombre</label>
               <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} autoFocus />
             </div>

             <div>
               <label htmlFor="cat-budget" className="text-xs font-semibold text-gray-500 ml-1">Presupuesto</label>
               <Input id="cat-budget" type="text" inputMode="decimal" value={budgetStr} onChange={e => setBudgetStr(e.target.value)} onBlur={() => setBudgetStr(formatLocaleNumber(parseLocaleNumber(budgetStr)))} />
             </div>

             {/* ICON SELECTOR GRID */}
             <div>
                <span id="icon-label" className="text-xs font-semibold text-gray-500 ml-1 mb-2 block">Icono</span>
                <div role="radiogroup" aria-labelledby="icon-label" className="grid grid-cols-6 gap-2">
                    {ICON_KEYS.map(key => {
                        const Icon = ICON_MAP[key];
                        const isSelected = selectedIconKey === key;
                        return (
                            <button 
                                key={key}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={`Icono ${key}`}
                                onClick={() => setSelectedIconKey(key)}
                                className={cn(
                                    "aspect-square rounded-lg flex items-center justify-center transition-all",
                                    isSelected ? "bg-blue-600 text-white shadow-md scale-110" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                <Icon size={18} aria-hidden="true" />
                            </button>
                        )
                    })}
                </div>
             </div>

             <Button className="w-full mt-4" onClick={handleSaveCategory} disabled={loading}>{loading ? '...' : 'Guardar'}</Button>
          </Card>
        </div>
      )}
    </div>
  );
};