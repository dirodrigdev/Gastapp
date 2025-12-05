import { supabase } from './supabaseClient';
import { MonthlyExpense, Project, ProjectExpense, Category, ClosingConfig, MonthlyReport, ExpenseCategoryLegacy } from '../types';
import { getDaysInMonth, isSameMonth, isAfter, isBefore, isEqual, addDays, addMonths } from 'date-fns';

// --- MOCK STORAGE CONFIG ---
const env = (import.meta as any)?.env || {};
const USE_MOCK = env.VITE_USE_MOCK !== 'false';

const KEY_EXPENSES = 'duofin_expenses';
const KEY_PROJECTS = 'duofin_projects';
const KEY_PROJECT_EXPENSES = 'duofin_project_expenses';
const KEY_CATEGORIES = 'duofin_categories';
const KEY_CLOSING_CONFIG = 'duofin_closing_config';
const KEY_REPORTS = 'duofin_reports';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- CATEGORIES MANAGEMENT ---

export const getCategories = async (): Promise<Category[]> => {
  if (USE_MOCK) {
    await delay(200);
    const raw = localStorage.getItem(KEY_CATEGORIES);
    if (!raw) {
      // Initialize specific user categories with assigned ICONS and BUDGETS
      const defaults = [
        { nombre: 'ALQUILER', icono: 'Home', presupuesto: 2800 },
        { nombre: 'AMAZON', icono: 'Shopping', presupuesto: 150 },
        { nombre: 'EXTRA', icono: 'Other', presupuesto: 100 },
        { nombre: 'GYM', icono: 'Health', presupuesto: 70 },
        { nombre: 'IKER', icono: 'Dog', presupuesto: 89 },
        { nombre: 'PELUQUERIA', icono: 'Beauty', presupuesto: 25 },
        { nombre: 'ROPA', icono: 'Clothes', presupuesto: 170 },
        { nombre: 'SUPERMERCADO', icono: 'Shopping', presupuesto: 650 },
        { nombre: 'SERVICIOS', icono: 'Services', presupuesto: 163 },
        { nombre: 'SEGURO DE SALUD', icono: 'Insurance', presupuesto: 123 },
        { nombre: 'PLATAFORMAS', icono: 'Tech', presupuesto: 35 },
        { nombre: 'OCIO', icono: 'Entertainment', presupuesto: 400 },
        { nombre: 'COMIDA FUERA', icono: 'Food', presupuesto: 700 },
        { nombre: 'TRANSPORTE', icono: 'Transport', presupuesto: 225 }
      ].map(c => ({
        id: crypto.randomUUID(),
        nombre: c.nombre,
        presupuestoMensual: c.presupuesto,
        activa: true,
        icono: c.icono
      }));
      
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  }
  return [];
};

export const saveCategory = async (cat: Category): Promise<void> => {
  if (USE_MOCK) {
    await delay(200);
    const cats = await getCategories();
    const index = cats.findIndex(c => c.id === cat.id);
    if (index >= 0) {
      cats[index] = cat;
    } else {
      cats.push(cat);
    }
    localStorage.setItem(KEY_CATEGORIES, JSON.stringify(cats));
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  if (USE_MOCK) {
    const cats = await getCategories();
    const newCats = cats.filter(c => c.id !== id);
    localStorage.setItem(KEY_CATEGORIES, JSON.stringify(newCats));
    return true;
  }
  return false;
};

// --- CLOSING CONFIG ---

export const getClosingConfig = async (): Promise<ClosingConfig> => {
  if (USE_MOCK) {
    const raw = localStorage.getItem(KEY_CLOSING_CONFIG);
    if (!raw) return { tipo: 'diaFijo', diaFijo: 11 }; 
    return JSON.parse(raw);
  }
  return { tipo: 'diaFijo', diaFijo: 11 };
};

export const saveClosingConfig = async (config: ClosingConfig): Promise<void> => {
  if (USE_MOCK) {
    localStorage.setItem(KEY_CLOSING_CONFIG, JSON.stringify(config));
  }
};

// --- MONTHLY REPORTS / CLOSING LOGIC ---

export const getMonthlyReports = async (): Promise<MonthlyReport[]> => {
  if (USE_MOCK) {
    const raw = localStorage.getItem(KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
};

export const generateClosingReport = async (forcedClosingDate: Date): Promise<MonthlyReport> => {
  // 1. Determine Start and End Dates for this Period
  const reports = await getMonthlyReports();
  // Sort reports by date desc to get the last one
  const sortedReports = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
  const lastReport = sortedReports.length > 0 ? sortedReports[0] : null;

  let startDate: Date;
  let periodNumber: number;

  const anchorDate = new Date(2023, 4, 12); // May 12, 2023

  if (lastReport) {
    // CONTINUITY: If there is a previous report, this period starts the day AFTER the last closing
    const lastEnd = new Date(lastReport.fechaFin);
    startDate = addDays(lastEnd, 1);
    // Period number increments based on sequence
    periodNumber = (lastReport.numeroPeriodo || 0) + 1;
  } else {
    // INITIALIZATION: Calculate theoretical start based on anchor
    // We need to find the period that contains the forcedClosingDate
    // Logic: Calculate months diff from anchor to now
    const diffMonths = (forcedClosingDate.getFullYear() - anchorDate.getFullYear()) * 12 + (forcedClosingDate.getMonth() - anchorDate.getMonth());
    
    // Adjust logic: if we are before the 12th, we are in the previous month's period cycle
    let adjustedMonths = diffMonths;
    if (forcedClosingDate.getDate() < 12) {
        adjustedMonths = diffMonths - 1;
    }
    
    // Calculate theoretical start date
    startDate = new Date(anchorDate);
    startDate.setMonth(startDate.getMonth() + adjustedMonths);
    
    periodNumber = adjustedMonths + 1;
  }

  // Ensure start date has time 00:00:00
  startDate.setHours(0, 0, 0, 0);

  // End Date is strictly the target date passed (FORCED CLOSE DATE) set to end of day
  const endDate = new Date(forcedClosingDate);
  endDate.setHours(23, 59, 59, 999);

  // 2. Fetch Expenses and Filter by Range
  const allExpenses = await getMonthlyExpenses();
  
  const periodExpenses = allExpenses.filter(e => {
    const d = new Date(e.fecha);
    return (isAfter(d, startDate) || isEqual(d, startDate)) && (isBefore(d, endDate) || isEqual(d, endDate));
  });

  const categories = await getCategories();

  let globalPres = 0;
  let globalGasto = 0;

  const details = categories.map(cat => {
    const catExpenses = periodExpenses.filter(e => e.categoria === cat.nombre || e.categoryId === cat.id);
    const totalCatSpent = catExpenses.reduce((sum, e) => sum + e.monto, 0);
    
    globalPres += cat.presupuestoMensual;
    globalGasto += totalCatSpent;

    return {
      categoryId: cat.id,
      categoryName: cat.nombre,
      presupuesto: cat.presupuestoMensual,
      gastoReal: totalCatSpent,
      diferencia: cat.presupuestoMensual - totalCatSpent
    };
  });

  const report: MonthlyReport = {
    id: crypto.randomUUID(),
    anio: forcedClosingDate.getFullYear(),
    mes: forcedClosingDate.getMonth(),
    
    numeroPeriodo: periodNumber,
    fechaInicio: startDate.toISOString(),
    fechaFin: endDate.toISOString(),
    fechaCierre: new Date().toISOString(),

    detalles: details,
    totalGlobalPresupuesto: globalPres,
    totalGlobalGasto: globalGasto,
    totalGlobalDiferencia: globalPres - globalGasto
  };

  if (USE_MOCK) {
    const existingReports = await getMonthlyReports();
    const newReports = [report, ...existingReports];
    localStorage.setItem(KEY_REPORTS, JSON.stringify(newReports));
  }

  return report;
};

// --- EXPENSES CRUD ---

export const addMonthlyExpense = async (expense: MonthlyExpense): Promise<MonthlyExpense | null> => {
  if (USE_MOCK) {
    await delay(300);
    const existing = JSON.parse(localStorage.getItem(KEY_EXPENSES) || '[]');
    const newExpense = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem(KEY_EXPENSES, JSON.stringify([newExpense, ...existing]));
    return newExpense;
  }
  return null;
};

export const updateMonthlyExpense = async (expense: MonthlyExpense): Promise<boolean> => {
  if (USE_MOCK) {
    await delay(200);
    const existing = JSON.parse(localStorage.getItem(KEY_EXPENSES) || '[]');
    const updated = existing.map((e: any) => e.id === expense.id ? expense : e);
    localStorage.setItem(KEY_EXPENSES, JSON.stringify(updated));
    return true;
  }
  return false;
};

export const getMonthlyExpenses = async (): Promise<MonthlyExpense[]> => {
  if (USE_MOCK) {
    await delay(200);
    const raw = JSON.parse(localStorage.getItem(KEY_EXPENSES) || '[]');
    return raw.filter((e: any) => e.estado === 'activo');
  }
  return [];
};

export const deleteMonthlyExpense = async (id: string) => {
  if (USE_MOCK) {
    const existing = JSON.parse(localStorage.getItem(KEY_EXPENSES) || '[]');
    const updated = existing.map((e: any) => e.id === id ? { ...e, estado: 'borrado' } : e);
    localStorage.setItem(KEY_EXPENSES, JSON.stringify(updated));
  }
};

// --- PROJECTS ---

export const getProjects = async (): Promise<Project[]> => {
  if (USE_MOCK) return JSON.parse(localStorage.getItem(KEY_PROJECTS) || '[]');
  return [];
};

export const createProject = async (project: Project): Promise<Project | null> => {
  if (USE_MOCK) {
    const existing = JSON.parse(localStorage.getItem(KEY_PROJECTS) || '[]');
    const newP = { ...project, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem(KEY_PROJECTS, JSON.stringify([newP, ...existing]));
    return newP;
  }
  return null;
};

export const getProjectExpenses = async (projectId: string): Promise<ProjectExpense[]> => {
  if (USE_MOCK) {
    const all = JSON.parse(localStorage.getItem(KEY_PROJECT_EXPENSES) || '[]');
    return all.filter((e: any) => e.proyecto_id === projectId && e.estado === 'activo');
  }
  return [];
};

export const addProjectExpense = async (expense: ProjectExpense): Promise<ProjectExpense | null> => {
  if (USE_MOCK) {
    const existing = JSON.parse(localStorage.getItem(KEY_PROJECT_EXPENSES) || '[]');
    const newE = { ...expense, id: crypto.randomUUID() };
    localStorage.setItem(KEY_PROJECT_EXPENSES, JSON.stringify([newE, ...existing]));
    return newE;
  }
  return null;
};

export const updateProjectExpense = async (expense: ProjectExpense): Promise<boolean> => {
  if (USE_MOCK) {
    const all = JSON.parse(localStorage.getItem(KEY_PROJECT_EXPENSES) || '[]');
    const updated = all.map((e: any) => e.id === expense.id ? expense : e);
    localStorage.setItem(KEY_PROJECT_EXPENSES, JSON.stringify(updated));
    return true;
  }
  return false;
};

export const deleteProjectExpense = async (id: string) => {
  if (USE_MOCK) {
    const all = JSON.parse(localStorage.getItem(KEY_PROJECT_EXPENSES) || '[]');
    const updated = all.map((e: any) => e.id === id ? { ...e, estado: 'borrado' } : e);
    localStorage.setItem(KEY_PROJECT_EXPENSES, JSON.stringify(updated));
  }
};