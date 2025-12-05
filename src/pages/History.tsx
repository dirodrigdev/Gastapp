import React, { useEffect, useState } from 'react';
import { subscribeToExpenses, deleteMonthlyExpense, updateMonthlyExpense, getClosingConfig, getMonthlyReports } from '../services/db';
import { MonthlyExpense } from '../types';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculatePeriodInfo, Button, getCategoryIcon } from '../components/Components';
import { Copy, Check, Trash2 } from 'lucide-react';
import { EditExpenseModal } from '../components/EditExpenseModal';

export const History = () => {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MonthlyExpense | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(null);

  // Helper con decimales para lista detallada
  const formatWithDecimals = (val: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  useEffect(() => {
    initData();
    
    // Suscripción al historial
    const unsubscribe = subscribeToExpenses((data) => {
      // Aplicamos el filtro cada vez que llegan datos nuevos
      if (activeStartDate) {
          filterAndSetData(data, activeStartDate);
      } else {
          // Si aún no sabemos la fecha de inicio, guardamos todo temporalmente
          setExpenses(data.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      }
    });

    return () => unsubscribe();
  }, [activeStartDate]);

  const initData = async () => {
      const [config, reports] = await Promise.all([getClosingConfig(), getMonthlyReports()]);
      const diaCierre = config.diaFijo || 11;
      const theoreticalPeriod = calculatePeriodInfo(new Date(), diaCierre);
      const sortedReports = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
      const lastReport = sortedReports.length > 0 ? sortedReports[0] : null;

      let realStartDate = theoreticalPeriod.startDate;
      if (lastReport) {
          const lastEnd = new Date(lastReport.fechaFin);
          lastEnd.setHours(12, 0, 0, 0); 
          const nextStart = addDays(lastEnd, 1);
          nextStart.setHours(0, 0, 0, 0);
          realStartDate = nextStart;
      } else {
          realStartDate.setHours(0,0,0,0);
      }
      setActiveStartDate(realStartDate);
  };

  const filterAndSetData = (data: MonthlyExpense[], startDate: Date) => {
      const filtered = data.filter(e => {
          const expenseDate = new Date(e.fecha);
          expenseDate.setHours(0,0,0,0);
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          return expenseDate.getTime() >= start.getTime();
      });
      setExpenses(filtered.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('¿Borrar este gasto?')) {
        await deleteMonthlyExpense(id);
      }
  };
  
  const handleUpdate = async (updated: MonthlyExpense) => {
      await updateMonthlyExpense(updated);
  };

  const handleCopyAll = async () => {
    if (expenses.length === 0) return;
    const textData = expenses.map(e => `${format(new Date(e.fecha), 'dd/MM')};${e.descripcion};${e.categoria};-${formatWithDecimals(e.monto)}`).join('\n');
    await navigator.clipboard.writeText(textData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleEditClick = (e: MonthlyExpense) => {
      setSelectedExpense(e);
      setEditModalOpen(true);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center mb-2">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
            <p className="text-xs text-slate-400">Toca para editar</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopyAll} aria-label="Copiar todo al portapapeles">
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </Button>
      </div>

      <div className="space-y-2" role="list">
        {expenses.map(item => {
           const Icon = getCategoryIcon(item.categoria);
           return (
               <div key={item.id} role="listitem" className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between active:bg-slate-50 transition-colors shadow-sm" onClick={() => handleEditClick(item)}>
                     <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="flex flex-col items-center justify-center bg-slate-50 w-10 h-10 rounded-lg shrink-0">
                            <span className="text-xs font-bold text-slate-700">{format(new Date(item.fecha), 'dd')}</span>
                            <span className="text-[9px] text-slate-400 uppercase">{format(new Date(item.fecha), 'MMM', { locale: es })}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate pr-2">{item.descripcion || item.categoria}</p>
                            <div className="flex items-center gap-1 text-slate-400">
                                <Icon size={10} aria-hidden="true" />
                                <p className="text-xs">{item.categoria}</p>
                            </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <span className="font-bold text-slate-900 whitespace-nowrap">- {formatWithDecimals(item.monto)} €</span>
                         <button onClick={(e) => handleDelete(e, item.id!)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                     </div>
               </div>
           )
        })}
        {expenses.length === 0 && <p className="text-center text-gray-400 mt-10">Sin movimientos activos</p>}
      </div>
      <EditExpenseModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} expense={selectedExpense} onSave={handleUpdate} onDelete={() => Promise.resolve()} />
    </div>
  );
};
