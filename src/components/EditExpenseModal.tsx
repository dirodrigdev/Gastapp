import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Calendar } from 'lucide-react';
import { MonthlyExpense, Category } from '../types';
import { Button, Input, formatLocaleNumber, parseLocaleNumber, getCategoryIcon, cn } from './Components';
import { getCategories } from '../services/db';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense: MonthlyExpense | null;
  onSave: (updatedExpense: MonthlyExpense) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditExpenseModal = ({ isOpen, onClose, expense, onSave, onDelete }: Props) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateVal, setDateVal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(setCategories);
      if (expense) {
        setAmount(formatLocaleNumber(expense.monto, 2)); // Mostrar con 2 decimales al editar
        setDescription(expense.descripcion || '');
        setCategoryName(expense.categoria);
        setDateVal(format(new Date(expense.fecha), 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const handleSave = async () => {
    setLoading(true);
    const numAmount = parseLocaleNumber(amount);
    
    // Reconstruir fecha manteniendo hora original si no se cambió, o mediodía si se cambió
    const originalDate = new Date(expense.fecha);
    const [y, m, d] = dateVal.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    
    // Si la fecha es la misma (solo cambió el año/mes/dia visual), mantenemos la hora exacta original
    if (originalDate.getFullYear() === y && originalDate.getMonth() === m - 1 && originalDate.getDate() === d) {
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
    } else {
        newDate.setHours(12, 0, 0);
    }

    await onSave({
      ...expense,
      monto: numAmount,
      descripcion: description,
      categoria: categoryName,
      fecha: newDate.toISOString()
    });
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      setLoading(true);
      await onDelete(expense.id!);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Editar Gasto</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Monto Gigante */}
          <div className="text-center py-2">
            <div className="relative inline-block">
               <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">€</span>
               <input 
                  type="text" 
                  inputMode="decimal"
                  className="text-4xl font-bold text-slate-800 text-center w-full bg-transparent border-none focus:ring-0 p-0 pl-6"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => {
                      const v = parseLocaleNumber(amount);
                      if (v > 0) setAmount(formatLocaleNumber(v, 2));
                  }}
               />
            </div>
          </div>

          {/* Categorías */}
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoría</label>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                 {categories.map(cat => {
                     const Icon = getCategoryIcon(cat.nombre);
                     const isSelected = categoryName === cat.nombre;
                     return (
                         <button 
                            key={cat.id}
                            onClick={() => setCategoryName(cat.nombre)}
                            className={cn(
                                "flex items-center gap-1 px-3 py-2 rounded-xl border transition-all whitespace-nowrap",
                                isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600"
                            )}
                         >
                             <Icon size={16} />
                             <span className="text-xs font-medium">{cat.nombre}</span>
                         </button>
                     )
                 })}
             </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Fecha</label>
                  <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <Input 
                        type="date" 
                        value={dateVal} 
                        onChange={e => setDateVal(e.target.value)}
                        className="pl-9"
                      />
                  </div>
              </div>
              <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nota</label>
                   <Input 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Opcional..."
                   />
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
           <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={loading}>
               <Trash2 size={18} className="mr-2" /> Borrar
           </Button>
           <Button className="flex-[2]" onClick={handleSave} disabled={loading}>
               <Save size={18} className="mr-2" /> Guardar Cambios
           </Button>
        </div>
      </div>
    </div>
  );
};
