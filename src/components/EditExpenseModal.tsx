import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Calendar } from 'lucide-react';
import { MonthlyExpense, Category, ProjectExpense } from '../types';
import { Button, Input, formatLocaleNumber, parseLocaleNumber, getCategoryIcon, cn } from './Components';
import { getCategories } from '../services/db';
import { format } from 'date-fns';

type EditableExpense = MonthlyExpense | ProjectExpense;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense: EditableExpense | null;
  onSave: (updatedExpense: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProject?: boolean;
}

export const EditExpenseModal = ({ isOpen, onClose, expense, onSave, onDelete, isProject }: Props) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateVal, setDateVal] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar categorías al abrir
  useEffect(() => {
    if (isOpen) {
      getCategories().then(setCategories);
    }
  }, [isOpen]);

  // Sincronizar datos del gasto (mensual o de proyecto)
  useEffect(() => {
    if (isOpen && expense) {
      const projectMode = isProject || ('monto_original' in expense);
      const rawAmount = projectMode
        ? (expense as ProjectExpense).monto_original
        : (expense as MonthlyExpense).monto;

      setAmount(formatLocaleNumber(rawAmount, 2));
      setDescription(expense.descripcion || '');
      setCategoryName(expense.categoria);
      setDateVal(format(new Date(expense.fecha), 'yyyy-MM-dd'));
    }
  }, [isOpen, expense, isProject]);

  if (!isOpen || !expense) return null;

  const handleSave = async () => {
    setLoading(true);
    const numAmount = parseLocaleNumber(amount);

    // Reconstruir fecha manteniendo la hora original si coincide el día
    const originalDate = new Date(expense.fecha);
    const [y, m, d] = dateVal.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);

    if (
      originalDate.getFullYear() === y &&
      originalDate.getMonth() === m - 1 &&
      originalDate.getDate() === d
    ) {
      newDate.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds()
      );
    } else {
      newDate.setHours(12, 0, 0);
    }

    const projectMode = isProject || ('monto_original' in expense);

    const updated: any = {
      ...expense,
      descripcion: description,
      categoria: categoryName,
      fecha: newDate.toISOString(),
    };

    if (projectMode) {
      (updated as ProjectExpense).monto_original = numAmount;
    } else {
      (updated as MonthlyExpense).monto = numAmount;
    }

    await onSave(updated);
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!expense) return;
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
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Monto
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icono || 'General');
                const isActive = cat.nombre === categoryName;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryName(cat.nombre)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs',
                      isActive
                        ? 'bg-brand-50 border-brand-400 text-brand-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    )}
                  >
                    <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                    <span>{cat.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descripción
            </label>
            <Input
              type="text"
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="flex-1"
              />
              <div className="p-2 rounded-full bg-slate-100 text-slate-500">
                <Calendar size={16} />
              </div>
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
