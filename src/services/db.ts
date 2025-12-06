// src/services/db.ts

import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  MonthlyExpense,
  Category,
  ClosingConfig,
  MonthlyReport,
  Project,
  ProjectExpense,
} from '../types';

// ===================== REFERENCIAS FIRESTORE =====================

const expensesCol        = collection(db, 'monthly_expenses');
const categoriesCol      = collection(db, 'categories');
const projectsCol        = collection(db, 'projects');
const projectExpensesCol = collection(db, 'project_expenses');
const monthlyReportsCol  = collection(db, 'monthly_reports');

// Un único documento de configuración de cierre
const closingConfigDoc   = doc(db, 'config', 'closing');

// ===================== GASTOS MENSUALES =====================

export const subscribeToExpenses = (
  callback: (expenses: MonthlyExpense[]) => void,
): () => void => {
  const q = query(expensesCol, orderBy('fecha', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data: MonthlyExpense[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MonthlyExpense, 'id'>),
    }));
    callback(data);
  });

  return unsubscribe;
};

export const addMonthlyExpense = async (
  expense: Omit<MonthlyExpense, 'id' | 'created_at'>,
): Promise<void> => {
  const payload: Omit<MonthlyExpense, 'id'> = {
    ...expense,
    created_at: new Date().toISOString(),
  };
  await addDoc(expensesCol, payload);
};

export const updateMonthlyExpense = async (
  expense: MonthlyExpense,
): Promise<void> => {
  if (!expense.id) throw new Error('updateMonthlyExpense: falta id');
  const { id, ...rest } = expense;
  await updateDoc(doc(db, 'monthly_expenses', id), rest as any);
};

export const deleteMonthlyExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'monthly_expenses', id));
};

// ======================== CATEGORÍAS ========================

export const subscribeToCategories = (
  callback: (categories: Category[]) => void,
): () => void => {
  const q = query(categoriesCol, orderBy('nombre'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data: Category[] = snapshot.docs.map((d) => {
      const raw = d.data() as any;
      return {
        id: d.id,
        nombre: raw.nombre ?? '',
        presupuestoMensual: raw.presupuestoMensual ?? 0,
        activa: raw.activa ?? true,
        icono: raw.icono ?? 'General',
      } as Category;
    });
    callback(data);
  });

  return unsubscribe;
};

export const getCategories = async (): Promise<Category[]> => {
  const snap = await getDocs(query(categoriesCol, orderBy('nombre')));
  return snap.docs.map((d) => {
    const raw = d.data() as any;
    return {
      id: d.id,
      nombre: raw.nombre ?? '',
      presupuestoMensual: raw.presupuestoMensual ?? 0,
      activa: raw.activa ?? true,
      icono: raw.icono ?? 'General',
    } as Category;
  });
};

export const saveCategory = async (cat: Category): Promise<void> => {
  const { id, ...rest } = cat;
  await setDoc(doc(db, 'categories', id), rest, { merge: true });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', id));
};

// ========================= PROYECTOS / VIAJES =========================

export const getProjects = async (): Promise<Project[]> => {
  const snap = await getDocs(query(projectsCol, orderBy('created_at', 'desc')));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Project, 'id'>),
  }));
};

export const createProject = async (
  project: Omit<Project, 'id' | 'created_at'>,
): Promise<void> => {
  const payload: Omit<Project, 'id'> = {
    ...project,
    created_at: new Date().toISOString(),
  };
  await addDoc(projectsCol, payload);
};

export const getProjectExpenses = async (
  projectId: string,
): Promise<ProjectExpense[]> => {
  const q = query(
    projectExpensesCol,
    where('proyecto_id', '==', projectId),
    orderBy('fecha', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ProjectExpense, 'id'>),
  }));
};

export const addProjectExpense = async (
  expense: Omit<ProjectExpense, 'id'>,
): Promise<void> => {
  await addDoc(projectExpensesCol, expense);
};

export const updateProjectExpense = async (
  expense: ProjectExpense,
): Promise<void> => {
  if (!expense.id) throw new Error('updateProjectExpense: falta id');
  const { id, ...rest } = expense;
  await updateDoc(doc(db, 'project_expenses', id), rest as any);
};

export const deleteProjectExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'project_expenses', id));
};

// =============== CONFIGURACIÓN DE CIERRE ===============

export const getClosingConfig = async (): Promise<ClosingConfig> => {
  const snap = await getDoc(closingConfigDoc);
  if (!snap.exists()) {
    const defaultConfig: ClosingConfig = { tipo: 'diaFijo', diaFijo: 11 };
    await setDoc(closingConfigDoc, defaultConfig);
    return defaultConfig;
  }
  return snap.data() as ClosingConfig;
};

export const saveClosingConfig = async (
  config: ClosingConfig,
): Promise<void> => {
  await setDoc(closingConfigDoc, config, { merge: true });
};

// =================== REPORTES MENSUALES ===================

export const getMonthlyReports = async (): Promise<MonthlyReport[]> => {
  const snap = await getDocs(
    query(monthlyReportsCol, orderBy('fechaFin', 'desc')),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MonthlyReport, 'id'>),
  }));
};

// Genera un reporte de cierre simple, agregando gastos del periodo
export const generateClosingReport = async (
  fechaCierre: Date,
): Promise<void> => {
  const config = await getClosingConfig();

  const diaFijo = config.diaFijo ?? 11;
  const end = new Date(fechaCierre);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  if (config.tipo === 'diaFijo') {
    // Periodo: desde el mismo día del mes anterior
    start.setMonth(start.getMonth() - 1);
    start.setDate(diaFijo);
  } else {
    // Periodo: mes calendario anterior
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
  }

  // Cargar gastos del periodo
  const q = query(
    expensesCol,
    where('fecha', '>=', start.toISOString()),
    where('fecha', '<=', end.toISOString()),
  );
  const snap = await getDocs(q);
  const expenses: MonthlyExpense[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MonthlyExpense, 'id'>),
  }));

  // Cargar categorías para obtener presupuestos
  const categories = await getCategories();

  const map = new Map<
    string,
    { name: string; budget: number; spent: number }
  >();

  for (const cat of categories) {
    map.set(cat.id, {
      name: cat.nombre.toUpperCase(),
      budget: cat.presupuestoMensual,
      spent: 0,
    });
  }

  for (const e of expenses) {
    const cat = categories.find((c) => c.nombre === e.categoria);
    const key = cat ? cat.id : `__no_cat__:${e.categoria}`;
    if (!map.has(key)) {
      map.set(key, {
        name: e.categoria.toUpperCase(),
        budget: 0,
        spent: 0,
      });
    }
    map.get(key)!.spent += e.monto;
  }

  const detalles: MonthlyReport['detalles'] = [];
  let totalPresupuesto = 0;
  let totalGasto = 0;

  for (const { name, budget, spent } of map.values()) {
    detalles.push({
      categoryName: name,
      presupuesto: budget,
      gastoReal: spent,
      diferencia: budget - spent,
    });
    totalPresupuesto += budget;
    totalGasto += spent;
  }

  const numeroPeriodo =
    (fechaCierre.getFullYear() - 2000) * 12 + (fechaCierre.getMonth() + 1);

  const report: Omit<MonthlyReport, 'id'> = {
    numeroPeriodo,
    fechaInicio: start.toISOString(),
    fechaFin: end.toISOString(),
    fechaCierre: fechaCierre.toISOString(),
    detalles,
    totalGlobalPresupuesto: totalPresupuesto,
    totalGlobalGasto: totalGasto,
    totalGlobalDiferencia: totalPresupuesto - totalGasto,
  };

  await addDoc(monthlyReportsCol, report);
};
