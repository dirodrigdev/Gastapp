import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Project,
  ProjectExpense,
  MonthlyExpense,
  Category,
} from '../types';

/* =========================
   CONSTANTES DE COLECCIONES
   ========================= */

const PROJECTS_COLLECTION = 'projects';
const PROJECT_EXPENSES_COLLECTION = 'project_expenses';

const MONTHLY_EXPENSES_COLLECTION = 'monthly_expenses';
const CATEGORIES_COLLECTION = 'categories';

const META_COLLECTION = 'meta';
const CLOSING_CONFIG_DOC_ID = 'closing_config';

const MONTHLY_REPORTS_COLLECTION = 'monthly_reports';

/* =========================
   PROYECTOS / VIAJES
   ========================= */

// Obtener todos los proyectos
export const getProjects = async (): Promise<Project[]> => {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Project, 'id'>),
  }));
};

// Crear proyecto/viaje
export const createProject = async (
  project: Omit<Project, 'id' | 'created_at'>
): Promise<string> => {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const now = new Date().toISOString();

  const payload: any = {
    ...project,
    created_at: now,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
};

// Actualizar proyecto/viaje
export const updateProject = async (
  id: string,
  data: Partial<Project>
): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, id);

  const clean: any = { ...data };
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) delete clean[k];
  });

  await updateDoc(docRef, clean);
};

// Borrar proyecto/viaje
export const deleteProject = async (id: string): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  await deleteDoc(docRef);
};

/* =========================
   GASTOS DE PROYECTO / VIAJE
   ========================= */

// Obtener gastos de un proyecto concreto
export const getProjectExpenses = async (
  projectId: string
): Promise<ProjectExpense[]> => {
  const colRef = collection(db, PROJECT_EXPENSES_COLLECTION);
  const q = query(colRef, where('proyecto_id', '==', projectId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ProjectExpense, 'id'>),
  }));
};

// Crear gasto de proyecto
export const addProjectExpense = async (
  expense: Omit<ProjectExpense, 'id'>
): Promise<void> => {
  const colRef = collection(db, PROJECT_EXPENSES_COLLECTION);

  const { descripcion, ...rest } = expense;

  const payload: any = {
    ...rest,
  };

  // solo guardamos descripción si trae texto
  if (descripcion && descripcion.trim() !== '') {
    payload.descripcion = descripcion.trim();
  }

  // limpiamos undefined (Firestore no los acepta)
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) {
      delete payload[k];
    }
  });

  await addDoc(colRef, payload);
};

// Actualizar gasto de proyecto (firma con UN solo parámetro)
export const updateProjectExpense = async (
  expense: ProjectExpense
): Promise<void> => {
  if (!expense.id) return;
  const { id, ...rest } = expense;
  const docRef = doc(db, PROJECT_EXPENSES_COLLECTION, id);

  const clean: any = { ...rest };
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) delete clean[k];
  });

  await updateDoc(docRef, clean);
};

// Borrar gasto de proyecto
export const deleteProjectExpense = async (id: string): Promise<void> => {
  const docRef = doc(db, PROJECT_EXPENSES_COLLECTION, id);
  await deleteDoc(docRef);
};

/* =========================
   GASTOS MENSUALES (HOME / HISTORIAL)
   ========================= */

// Suscripción en tiempo real a gastos mensuales
export const subscribeToExpenses = (
  callback: (expenses: MonthlyExpense[]) => void
): (() => void) => {
  const colRef = collection(db, MONTHLY_EXPENSES_COLLECTION);
  const q = query(colRef, orderBy('fecha', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data: MonthlyExpense[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MonthlyExpense, 'id'>),
    }));
    callback(data);
  });

  return unsubscribe;
};

// Crear gasto mensual
export const addMonthlyExpense = async (
  expense: Omit<MonthlyExpense, 'id'>
): Promise<void> => {
  const colRef = collection(db, MONTHLY_EXPENSES_COLLECTION);

  const payload: any = { ...expense };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  await addDoc(colRef, payload);
};

// Actualizar gasto mensual
export const updateMonthlyExpense = async (
  expense: MonthlyExpense
): Promise<void> => {
  if (!expense.id) return;
  const { id, ...rest } = expense;
  const docRef = doc(db, MONTHLY_EXPENSES_COLLECTION, id);

  const clean: any = { ...rest };
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) delete clean[k];
  });

  await updateDoc(docRef, clean);
};

// Borrar gasto mensual
export const deleteMonthlyExpense = async (id: string): Promise<void> => {
  const docRef = doc(db, MONTHLY_EXPENSES_COLLECTION, id);
  await deleteDoc(docRef);
};

/* =========================
   CATEGORÍAS
   ========================= */

// Suscripción en tiempo real a categorías
export const subscribeToCategories = (
  callback: (categories: Category[]) => void
): (() => void) => {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(colRef, orderBy('nombre', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data: Category[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Category, 'id'>),
    }));
    callback(data);
  });

  return unsubscribe;
};

// Obtener categorías una vez
export const getCategories = async (): Promise<Category[]> => {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Category, 'id'>),
  }));
};

// Crear / actualizar categoría
export const saveCategory = async (category: Category): Promise<string> => {
  const colRef = collection(db, CATEGORIES_COLLECTION);

  const { id, ...rest } = category as any;
  const payload: any = { ...rest };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  if (id) {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, payload);
    return id;
  } else {
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
};

// Borrar categoría
export const deleteCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(docRef);
};

/* =========================
   CONFIGURACIÓN DE CIERRE / REPORTES
   ========================= */

// Config de cierre (día fijo, etc.)
export const getClosingConfig = async (): Promise<any> => {
  const docRef = doc(db, META_COLLECTION, CLOSING_CONFIG_DOC_ID);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    // valor por defecto
    return { diaFijo: 11 };
  }

  return snap.data() as any;
};

export const saveClosingConfig = async (config: any): Promise<void> => {
  const docRef = doc(db, META_COLLECTION, CLOSING_CONFIG_DOC_ID);
  await setDoc(docRef, config, { merge: true });
};

// Reportes mensuales (cierres)
export const getMonthlyReports = async (): Promise<any[]> => {
  const colRef = collection(db, MONTHLY_REPORTS_COLLECTION);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
};

// Generar reporte de cierre
export const generateClosingReport = async (
  reportData: any
): Promise<string> => {
  const colRef = collection(db, MONTHLY_REPORTS_COLLECTION);

  const payload: any = { ...(reportData || {}) };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  if (!payload.fechaFin && !payload.fechaInicio) {
    payload.createdAt = new Date().toISOString();
  }

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
};
