
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects, getProjectExpenses, addProjectExpense, updateProjectExpense, deleteProjectExpense } from '../services/db';
import { Project, ProjectExpense, Currency } from '../types';
import { Button, Card, Input, formatLocaleNumber, parseLocaleNumber } from '../components/Components';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { EditExpenseModal } from '../components/EditExpenseModal';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(''); // Text input for flexibility
  const [desc, setDesc] = useState('');
  const [exRate, setExRate] = useState('1');

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ProjectExpense | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (projectId: string) => {
    const allP = await getProjects();
    const p = allP.find(x => x.id === projectId);
    if (p) {
        setProject(p);
        // Default currency to project currency if not set
        if(!currency) setCurrency(p.moneda_principal);
    }
    
    const exp = await getProjectExpenses(projectId);
    setExpenses(exp);
  };

  const handleBlur = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    const num = parseLocaleNumber(val);
    if (num > 0) setter(formatLocaleNumber(num));
  };

  const handleAdd = async () => {
    if (!project || !amount) return;
    
    const currentUser = localStorage.getItem('currentUser') as any;
    const val = parseLocaleNumber(amount);
    const rate = parseLocaleNumber(exRate) || 1;
    const finalCurrency = currency.toUpperCase() || project.moneda_principal;
    
    const newEx: ProjectExpense = {
      proyecto_id: project.id!,
      fecha: new Date().toISOString(),
      monto_original: val,
      moneda_original: finalCurrency,
      tipo_cambio_usado: rate,
      monto_en_moneda_proyecto: val, // Simplification
      monto_en_moneda_principal: val * rate, // Assuming rate converts TO main currency (EUR)
      categoria: 'General',
      descripcion: desc,
      creado_por_usuario_id: currentUser,
      estado: 'activo'
    };

    if (finalCurrency !== project.moneda_principal) {
        newEx.monto_en_moneda_proyecto = val * rate; 
    }

    await addProjectExpense(newEx);
    setShowAdd(false);
    setAmount('');
    setDesc('');
    setExRate('1');
    if (id) loadData(id);
  };

  const handleUpdate = async (updated: ProjectExpense) => {
    await updateProjectExpense(updated);
    if(id) loadData(id);
  };

  const handleDelete = async (expenseId: string) => {
    await deleteProjectExpense(expenseId);
    if(id) loadData(id);
  };

  const openEdit = (e: ProjectExpense) => {
    setSelectedExpense(e);
    setEditModalOpen(true);
  };

  if (!project) return <div className="p-10 text-center">Cargando...</div>;

  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.monto_en_moneda_principal || curr.monto_original), 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Custom Header */}
      <div className="bg-brand-600 text-white p-4 pb-12 rounded-b-3xl shadow-lg relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/projects')} aria-label="Volver a proyectos" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <h1 className="text-xl font-bold truncate">{project.nombre}</h1>
        </div>
        <div className="flex justify-between items-end px-2">
          <div>
            <p className="text-brand-100 text-sm mb-1">Total Gastado</p>
            <p className="text-3xl font-bold">{formatLocaleNumber(totalSpent)} <span className="text-lg font-normal">{project.moneda_principal}</span></p>
          </div>
          <div className="text-right">
             <p className="text-brand-200 text-xs">Presupuesto</p>
             <p className="font-semibold">{formatLocaleNumber(project.presupuesto_total)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 -mt-6 z-20 overflow-y-auto pb-24">
        {!showAdd ? (
          <div className="space-y-3">
             <Card className="p-3 bg-white shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 text-brand-600" onClick={() => setShowAdd(true)} role="button" tabIndex={0}>
               <Plus size={20} className="mr-2" aria-hidden="true" /> Agregar Gasto al Proyecto
             </Card>

             {expenses.map(e => (
               <div key={e.id} onClick={() => openEdit(e)} className="flex justify-between items-center p-3 border-b border-gray-100 cursor-pointer active:bg-gray-50" role="button" tabIndex={0}>
                 <div>
                   <p className="font-medium text-gray-800">{e.descripcion || 'Gasto'}</p>
                   <p className="text-xs text-gray-500">{format(new Date(e.fecha), 'dd/MM')} • {e.creado_por_usuario_id}</p>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-gray-900">{formatLocaleNumber(e.monto_original)} {e.moneda_original}</p>
                   {e.moneda_original !== project.moneda_principal && (
                     <p className="text-xs text-gray-400">Rate: {e.tipo_cambio_usado}</p>
                   )}
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <Card className="p-4 space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between">
               <h3 className="font-bold">Nuevo Gasto</h3>
               <button onClick={() => setShowAdd(false)} aria-label="Cancelar nuevo gasto"><X className="text-gray-400" size={20}/></button>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                 <label htmlFor="add-p-amount" className="text-xs text-gray-400 ml-1">Monto</label>
                 <Input 
                    id="add-p-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00" 
                    className="text-lg font-bold"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onBlur={() => handleBlur(setAmount, amount)}
                 />
              </div>
              <div className="w-24">
                 <label htmlFor="add-p-currency" className="text-xs text-gray-400 ml-1">Moneda</label>
                 <Input 
                    id="add-p-currency"
                    className="uppercase font-bold text-center"
                    placeholder="EUR"
                    maxLength={3}
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                 />
              </div>
            </div>
            
            {(currency && currency.toUpperCase() !== project.moneda_principal) && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                   <div className="flex justify-between items-center mb-1">
                      <label htmlFor="add-p-rate" className="text-xs font-bold text-orange-700">Tipo de Cambio</label>
                      <span className="text-[10px] text-orange-600">1 {currency.toUpperCase()} = ? {project.moneda_principal}</span>
                   </div>
                   <input 
                     id="add-p-rate"
                     type="text"
                     inputMode="decimal"
                     className="w-full bg-white border border-orange-200 rounded-lg p-2 font-bold text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                     value={exRate}
                     onChange={e => setExRate(e.target.value)}
                     onBlur={() => handleBlur(setExRate, exRate)}
                   />
                </div>
            )}

            <label htmlFor="add-p-desc" className="sr-only">Descripción</label>
            <Input 
              id="add-p-desc"
              placeholder="Descripción (Opcional)" 
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
            
            <Button className="w-full" onClick={handleAdd}>Guardar Gasto</Button>
          </Card>
        )}
      </div>

      <EditExpenseModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        expense={selectedExpense!}
        onSave={handleUpdate}
        onDelete={handleDelete}
        isProject={true}
      />
    </div>
  );
};
