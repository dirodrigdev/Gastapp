import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import { format, isAfter, addDays, isSameDay, isBefore, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, Button, calculatePeriodInfo, getCategoryIcon, parseLocaleNumber, formatLocaleNumber, Input, cn } from '../components/Components';
import { getMonthlyExpenses, getCategories, addMonthlyExpense, updateMonthlyExpense, deleteMonthlyExpense, getClosingConfig, getMonthlyReports } from '../services/db';
import { MonthlyExpense, Category } from '../types';
import { EditExpenseModal } from '../components/EditExpenseModal';

export const Home = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // Estado para controlar la fecha del gasto (inicializado en HOY)
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Period Info State
  // Inicializar con el día 1 del mes actual para asegurar que se muestre algo mientras carga initData
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [activeEndDate, setActiveEndDate] = useState<Date>(new Date());
  const [periodLabel, setPeriodLabel] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortedCategories, setSortedCategories] = useState<Category[]>([]); // Nuevo estado para ordenamiento inteligente
  const [selectedCatName, setSelectedCatName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState('Diego');

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MonthlyExpense | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) setCurrentUser(user);
    
    // Cargar gastos INMEDIATAMENTE
    loadExpensesAndCats();
    initData();
  }, []);

  // Forzar fecha mínima si estamos en el "limbo"
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(activeStartDate);
    start.setHours(0, 0, 0, 0);

    if (isBefore(today, start)) {
        setExpenseDate(format(start, 'yyyy-MM-dd'));
    }
  }, [activeStartDate]);

  // Recalcular orden de categorías cuando cambian los gastos o las categorías base
  useEffect(() => {
      if (categories.length === 0) return;

      // Contar frecuencia de uso por nombre de categoría
      const usageCount: Record<string, number> = {};
      expenses.forEach(e => {
          usageCount[e.categoria] = (usageCount[e.categoria] || 0) + 1;
      });

      // Ordenar: Mayor frecuencia primero
      const sorted = [...categories].sort((a, b) => {
          const countA = usageCount[a.nombre] || 0;
          const countB = usageCount[b.nombre] || 0;
          return countB - countA; // Descendente
      });

      setSortedCategories(sorted);
  }, [expenses, categories]);

  // Helper ROBUSTO para formato de moneda (Miles con punto, Decimales con coma)
  const formatMoney = (amount: number, decimals: number = 0) => {
    // Asegurar que es un número válido
    let num = Number(amount);
    if (isNaN(num)) num = 0;

    // 1. Fijar decimales (string con punto decimal estándar)
    const fixed = num.toFixed(decimals);
    
    // 2. Separar parte entera y decimal
    const [intPart, decPart] = fixed.split('.');
    
    // 3. Agregar puntos de miles a la parte entera usando Regex
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // 4. Retornar formateado con coma si hay decimales
    return decimals > 0 ? `${intFormatted},${decPart}` : intFormatted;
  };

  const initData = async () => {
    try {
      const [config, reports] = await Promise.all([getClosingConfig(), getMonthlyReports()]);
      const diaCierre = config.diaFijo || 11;
      
      const theoreticalPeriod = calculatePeriodInfo(new Date(), diaCierre);
      
      const sortedReports = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
      const lastReport = sortedReports.length > 0 ? sortedReports[0] : null;

      let realStartDate = theoreticalPeriod.startDate;
      let periodNumber = theoreticalPeriod.periodNumber;
      
      if (lastReport) {
          // Truco del mediodía para zona horaria
          const lastEnd = new Date(lastReport.fechaFin);
          lastEnd.setHours(12, 0, 0, 0); 
          
          const nextStart = addDays(lastEnd, 1);
          nextStart.setHours(0, 0, 0, 0);
          
          realStartDate = nextStart;
          periodNumber = (lastReport.numeroPeriodo || 0) + 1;
      }

      let nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth(), diaCierre);
      
      if (nextClosingDate.getTime() < realStartDate.getTime()) {
          nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth() + 1, diaCierre);
      }
      
      nextClosingDate.setHours(23, 59, 59, 999);
      realStartDate.setHours(0, 0, 0, 0);

      setActiveStartDate(realStartDate);
      setActiveEndDate(nextClosingDate);
      
      const now = new Date();
      now.setHours(0,0,0,0);
      const msPerDay = 1000 * 60 * 60 * 24;
      const remaining = Math.ceil((nextClosingDate.getTime() - now.getTime()) / msPerDay);
      
      setDaysRemaining(Math.max(0, remaining));
      setPeriodLabel(`P${periodNumber} (${format(realStartDate, 'd MMM', { locale: es })} - ${format(nextClosingDate, 'd MMM', { locale: es })})`.toUpperCase());
    } catch (error) {
      console.error("Error initializing period data:", error);
    }
  };

  const loadExpensesAndCats = async () => {
    try {
      const [expData, catData] = await Promise.all([getMonthlyExpenses(), getCategories()]);
      setExpenses(expData || []);
      setCategories(catData || []);
      setSelectedCatName('');
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const handleAmountBlur = () => {
    const val = parseLocaleNumber(amount);
    // Mantenemos decimales en el input para precisión al editar
    if (val > 0) setAmount(formatLocaleNumber(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseLocaleNumber(amount);
    if (!amount || numericAmount <= 0) return; 
    if (!selectedCatName) return; 

    setLoading(true);
    
    const [y, m, d] = expenseDate.split('-').map(Number);
    const finalDate = new Date(y, m - 1, d);
    const now = new Date();

    if (isSameDay(finalDate, now)) {
        finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
        finalDate.setHours(12, 0, 0);
    }

    await addMonthlyExpense({
        fecha: finalDate.toISOString(),
        monto: numericAmount,
        moneda: 'EUR',
        categoria: selectedCatName,
        descripcion: description,
        creado_por_usuario_id: currentUser as any,
        estado: 'activo'
    });

    setAmount('');
    setDescription('');
    setSelectedCatName('');
    
    const start = new Date(activeStartDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (isBefore(today, start)) {
        setExpenseDate(format(start, 'yyyy-MM-dd'));
    } else {
        setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    }
    
    setLoading(false);
    loadExpensesAndCats();
  };

  const handleEditClick = (expense: MonthlyExpense) => {
    setSelectedExpense(expense);
    setEditModalOpen(true);
  };

  const handleUpdateExpense = async (updated: MonthlyExpense) => {
    await updateMonthlyExpense(updated);
    loadExpensesAndCats();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteMonthlyExpense(id);
    loadExpensesAndCats();
  };

  const getDateLabel = () => {
      const [y, m, d] = expenseDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (isSameDay(dateObj, new Date())) return 'HOY';
      return format(dateObj, 'd MMM', { locale: es }).toUpperCase();
  };

  // --- LOGIC: SMART STATUS & PROGRESS ---
  const currentExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      const startDate = new Date(activeStartDate);
      startDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() >= startDate.getTime();
  });

  const categoryStats = categories.map(cat => {
      const catExps = currentExpenses.filter(e => e.categoria === cat.nombre);
      const spent = catExps.reduce((acc, curr) => acc + curr.monto, 0);
      const percent = cat.presupuestoMensual > 0 ? (spent / cat.presupuestoMensual) * 100 : 0;
      return { ...cat, spent, percent };
  });

  const totalBudget = categoryStats.reduce((acc, c) => acc + c.presupuestoMensual, 0);
  const totalSpent = categoryStats.reduce((acc, c) => acc + c.spent, 0);
  
  // LOGICA COLOR DONUT (Excluir Costos Fijos)
  // Definimos qué es "fijo" para el cálculo del color
  const isFixedCategory = (name: string) => {
      const n = name.toUpperCase();
      return n.includes('ALQUILER') || n.includes('SEGURO') || n.includes('GYM') || n.includes('PLATAFORMAS') || n.includes('SERVICIOS');
  };

  const fixedStats = categoryStats.filter(c => isFixedCategory(c.nombre));
  const variableStats = categoryStats.filter(c => !isFixedCategory(c.nombre));

  const fixedBudget = fixedStats.reduce((acc, c) => acc + c.presupuestoMensual, 0);
  const fixedSpent = fixedStats.reduce((acc, c) => acc + c.spent, 0);

  // Totales ajustados (solo variables) para determinar el color de "salud financiera"
  const variableBudget = Math.max(1, totalBudget - fixedBudget);
  const variableSpent = Math.max(0, totalSpent - fixedSpent);
  
  const totalPercentReal = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  // Porcentaje ajustado solo para lógica de colores
  const adjustedPercent = (variableSpent / variableBudget) * 100;

  // Time progress
  const msInPeriod = activeEndDate.getTime() - activeStartDate.getTime();
  const msPassed = new Date().getTime() - activeStartDate.getTime();
  const timePercent = Math.min(100, Math.max(0, (msPassed / msInPeriod) * 100));

  let donutColor = "text-green-500";
  // Usamos el porcentaje ajustado (sin costos fijos) para el color
  if (adjustedPercent > 100) {
      donutColor = "text-red-500";
  } else if (adjustedPercent > (timePercent + 5)) { // Tolerancia reducida a 5% como solicitado
      donutColor = "text-yellow-500";
  }

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(totalPercentReal, 100) / 100) * circumference;

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Hola, {currentUser}</h1>
        </div>
        <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{periodLabel}</span>
        </div>
      </div>

      {/* Input Module (Compact) */}
      <Card className="p-3 bg-white shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">€</span>
                    <Input 
                        id="amount-input"
                        type="text" 
                        inputMode="decimal"
                        aria-label="Monto del gasto"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        onBlur={handleAmountBlur}
                        placeholder="0,00" 
                        className="pl-8 py-2 text-2xl font-bold border-none bg-slate-50 focus:ring-0 rounded-lg text-slate-800 placeholder:text-slate-200" 
                    />
                </div>
                <div className="relative">
                    <button type="button" aria-label="Cambiar fecha del gasto" className="h-12 w-12 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-blue-600 border border-slate-100 relative overflow-hidden">
                        <CalendarIcon size={18} aria-hidden="true" />
                        <span className="text-[9px] font-bold">{getDateLabel()}</span>
                        <input 
                            type="date" 
                            aria-label="Selector de fecha" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={expenseDate}
                            min={format(activeStartDate, 'yyyy-MM-dd')}
                            onChange={(e) => setExpenseDate(e.target.value)}
                        />
                    </button>
                </div>
            </div>

            {/* Categories Scroll - USA SORTED CATEGORIES */}
            <div role="group" aria-label="Categoría del gasto" className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                {sortedCategories.map(cat => {
                    const Icon = getCategoryIcon(cat.nombre);
                    const isSelected = selectedCatName === cat.nombre;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedCatName(cat.nombre)}
                            className={cn(
                                "flex flex-col items-center gap-1 min-w-[64px] p-2 rounded-xl transition-all border",
                                isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Icon size={20} className={isSelected ? "text-white" : "text-current"} aria-hidden="true" />
                            <span className="text-[9px] font-medium truncate w-full text-center">{cat.nombre}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex gap-2">
                <Input 
                    id="description-input"
                    aria-label="Descripción del gasto (opcional)"
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Descripción (Opcional)" 
                    className="py-2 text-sm bg-slate-50 border-none"
                />
                <Button type="submit" disabled={loading} aria-label="Agregar Gasto" className="aspect-square p-0 w-10 h-10 rounded-xl bg-blue-600 text-white shrink-0">
                    <Plus size={20} aria-hidden="true" />
                </Button>
            </div>
        </form>
      </Card>

      {/* Monthly Summary (Black Card) */}
      <Card className="bg-slate-900 text-white p-5 border-none shadow-xl relative overflow-hidden">
         <div className="flex justify-between items-start">
             <div className="z-10">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Este Mes</span>
                 </div>
                 {/* SIN DECIMALES */}
                 <p className="text-3xl font-bold tracking-tight">€ {formatMoney(totalSpent, 0)}</p>
                 <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 w-24 bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, totalPercentReal)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, totalPercentReal)}%` }}></div>
                    </div>
                    {/* SIN DECIMALES */}
                    <span className="text-xs text-slate-400">Límite: € {formatMoney(totalBudget, 0)}</span>
                 </div>
             </div>

             {/* DONUT CHART - SVG NATIVO para centrado perfecto */}
             <div className="relative h-16 w-16" aria-hidden="true">
                 <svg className="w-full h-full" viewBox="0 0 64 64">
                     {/* Background Circle */}
                     <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                     {/* Progress Circle - Rotated -90deg around center (32,32) */}
                     <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                        className={donutColor}
                        strokeLinecap="round"
                        transform="rotate(-90 32 32)"
                     />
                     {/* Text - Perfectly Centered via SVG metrics */}
                     <text x="32" y="32" className="fill-white text-[10px] font-bold" textAnchor="middle" dominantBaseline="central">
                        {totalPercentReal.toFixed(0)}%
                     </text>
                 </svg>
             </div>
         </div>

         {/* Footer Info */}
         <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center z-10 relative">
             <span className="text-xs text-slate-400">Cierre: {format(activeEndDate, 'dd MMM', { locale: es })}</span>
             <span className="text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded-lg">Restan {daysRemaining} días</span>
         </div>

         {/* Bottom Expandable Trigger */}
         <button onClick={() => setShowBudgetDetails(!showBudgetDetails)} aria-expanded={showBudgetDetails} aria-label="Ver detalles de presupuestos" className="w-full mt-3 flex items-center justify-center pt-2 text-slate-500 hover:text-white transition-colors">
             {showBudgetDetails ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
         </button>
      </Card>

      {/* Budget Details (Collapsible) */}
      {showBudgetDetails && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Estado de Presupuestos</h3>
              {categoryStats.map(cat => {
                  const Icon = getCategoryIcon(cat.nombre);
                  // Usamos la misma lógica de "fijo" para consistencia visual
                  const isFixed = isFixedCategory(cat.nombre);
                  
                  let colorClass = "bg-green-500";
                  if (cat.percent > 100) {
                      colorClass = "bg-red-500";
                  } else if (!isFixed && cat.percent > (timePercent + 5)) { // Tolerancia 5%
                      colorClass = "bg-yellow-500";
                  }

                  return (
                      <div key={cat.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                          <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Icon size={16} aria-hidden="true" /></div>
                          <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="font-bold text-slate-700">{cat.nombre}</span>
                                  <span className="text-slate-500">{Math.round(cat.percent)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, cat.percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso de ${cat.nombre}`}>
                                  <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.min(100, cat.percent)}%` }}></div>
                              </div>
                              {/* SIN DECIMALES */}
                              <p className="text-[10px] text-slate-400 mt-1 text-right">Quedan € {formatMoney(Math.max(0, cat.presupuestoMensual - cat.spent), 0)}</p>
                          </div>
                      </div>
                  )
              })}
          </div>
      )}

      {/* Recent Activity */}
      <div>
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Últimos Movimientos</h3>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50" role="list">
              {currentExpenses.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5).map(item => {
                  const Icon = getCategoryIcon(item.categoria);
                  return (
                      <div role="listitem" key={item.id} onClick={() => handleEditClick(item)} className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                              <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
                                  <Icon size={18} aria-hidden="true" />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800">{item.categoria}</p>
                                  <p className="text-xs text-slate-400">{item.descripcion || format(new Date(item.fecha), 'dd MMM')}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              {/* CON DECIMALES */}
                              <p className="text-sm font-bold text-slate-900">-€{formatMoney(item.monto, 2)}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{item.creado_por_usuario_id.substring(0,3)}</p>
                          </div>
                      </div>
                  )
              })}
              {currentExpenses.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-sm">Sin movimientos este periodo</div>
              )}
          </div>
      </div>

      <EditExpenseModal 
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        expense={selectedExpense}
        onSave={handleUpdateExpense}
        onDelete={handleDeleteExpense}
      />
    </div>
  );
};