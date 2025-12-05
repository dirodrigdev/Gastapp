
import React, { useState, useEffect } from 'react';
import { MonthlyExpense, ProjectExpense, Category } from '../types';
import { Card, Button, Input, Select, formatLocaleNumber, parseLocaleNumber } from './Components';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { getCategories } from '../services/db';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: MonthlyExpense | ProjectExpense | null;
  onSave: (updated: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProject?: boolean;
}

export const EditExpenseModal = ({ isOpen, onClose, expense, onSave, onDelete, isProject = false }: EditExpenseModalProps) => {
  const [formData, setFormData] = useState<any>(null);
  const [amountStr, setAmountStr] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load categories when opening
    if (isOpen) {
        getCategories().then(setCategories);
    }
  }, [isOpen]);

  useEffect(() => {
    if (expense) {
      setFormData({ ...expense });
      const initialVal = isProject ? (expense as ProjectExpense).monto_original : (expense as MonthlyExpense).monto;
      setAmountStr(formatLocaleNumber(initialVal));
    } else {
      setFormData(null);
      setAmountStr('');
    }
  }, [expense, isProject]);

  if (!isOpen || !expense || !formData) return null;

  const handleSave = async () => {
    setLoading(true);
    const numericVal = parseLocaleNumber(amountStr);
    
    const updatedData = { ...formData };
    if (isProject) {
        updatedData.monto_original = numericVal;
    } else {
        updatedData.monto = numericVal;
    }

    await onSave(updatedData);
    setLoading(false);
    onClose();
  };

  const handleAmountBlur = () => {
    const val = parseLocaleNumber(amountStr);
    if (val > 0) setAmountStr(formatLocaleNumber(val));
  };

  const safeDate = formData.fecha ? format(new Date(formData.fecha), 'yyyy-MM-dd') : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <Card className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 space-y-5 animate-in slide-in-from-bottom-10 duration-200">
        
        <div className="flex justify-between items-center">
          <h2 id="edit-modal-title" className="text-xl font-bold text-slate-800">Editar Gasto</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div className="flex gap-3">
             <div className="flex-1">
               <label htmlFor="edit-amount" className="text-xs font-semibold text-gray-500 ml-1">Monto</label>
               <Input 
                 id="edit-amount"
                 type="text"
                 inputMode="decimal" 
                 value={amountStr} 
                 onChange={e => setAmountStr(e.target.value)}
                 onBlur={handleAmountBlur}
                 className="text-xl font-bold"
               />
             </div>
             {isProject && (
                 <div className="w-24">
                   <label htmlFor="edit-currency" className="text-xs font-semibold text-gray-500 ml-1">Moneda</label>
                   <Input 
                     id="edit-currency"
                     value={formData.moneda_original || ''} 
                     readOnly
                     className="bg-gray-50 text-gray-500"
                   />
                 </div>
             )}
          </div>

          {/* Date */}
          <div>
             <label htmlFor="edit-date" className="text-xs font-semibold text-gray-500 ml-1">Fecha</label>
             <Input 
               id="edit-date"
               type="date"
               value={safeDate}
               onChange={e => setFormData({ ...formData, fecha: e.target.value })}
             />
          </div>

          {/* Category Selector (Dynamic) */}
          <div>
            <label htmlFor="edit-category" className="text-xs font-semibold text-gray-500 ml-1">Categoría</label>
            {isProject ? (
                 <Input 
                    id="edit-category"
                    value={formData.categoria} 
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })} 
                 />
            ) : (
                <Select 
                  id="edit-category"
                  options={categories.map(c => ({ label: c.nombre, value: c.nombre }))}
                  value={formData.categoria || ''}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                />
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-desc" className="text-xs font-semibold text-gray-500 ml-1">Descripción</label>
            <Input 
              id="edit-desc"
              value={formData.descripcion || ''}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción..."
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button 
            type="button"
            className="w-full" 
            onClick={handleSave}
            disabled={loading}
          >
            Guardar Cambios
          </Button>
        </div>
      </Card>
    </div>
  );
};
