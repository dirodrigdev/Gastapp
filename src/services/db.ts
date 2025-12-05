import { db } from './firebase';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, query, getDoc, setDoc, onSnapshot 
} from 'firebase/firestore';
import { MonthlyExpense, Category, ClosingConfig, MonthlyReport } from '../types';

const EXPENSES_COL = 'monthly_expenses';
const CATEGORIES_COL = 'categories';
const CONFIG_COL = 'config';
const REPORTS_COL = 'monthly_reports';

// --- GASTOS (REAL TIME) ---
export const subscribeToExpenses = (callback: (data: MonthlyExpense[]) => void) => {
  const q = query(collection(db, EXPENSES_COL));
  // Agregamos manejo de errores al listener
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyExpense));
    callback(data);
  }, (error: any) => {
    console.error("Error recibiendo gastos:", error);
  });
};

export const getMonthlyExpenses = async (): Promise<MonthlyExpense[]> => {
  try {
    const q = query(collection(db, EXPENSES_COL));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyExpense));
  } catch (error: any) {
    console.error("Error leyendo gastos:", error);
    return [];
  }
};

export const addMonthlyExpense = async (expense: Omit<MonthlyExpense, 'id'>): Promise<void> => {
  try { 
      await addDoc(collection(db, EXPENSES_COL), expense); 
  } catch (e: any) { 
      console.error("Error al guardar gasto:", e); 
  }
};

export const updateMonthlyExpense = async (expense: MonthlyExpense): Promise<void> => {
  if (!expense.id) return;
  try {
    // Extraemos el id para no guardarlo dentro del documento
    const { id, ...data } = expense;
    await updateDoc(doc(db, EXPENSES_COL, id), data);
  } catch (e: any) { console.error(e); }
};

export const deleteMonthlyExpense = async (id: string): Promise<void> => {
  try { await deleteDoc(doc(db, EXPENSES_COL, id)); } catch (e: any) { console.error(e); }
};

// --- CATEGORÍAS (REAL TIME) ---
export const subscribeToCategories = (callback: (data: Category[]) => void) => {
  const q = query(collection(db, CATEGORIES_COL));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    callback(data);
  }, (error: any) => {
    console.error("Error recibiendo categorías:", error);
  });
};

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', nombre: 'ALQUILER', presupuestoMensual: 2800, activa: true, icono: 'Home' },
    { id: '2', nombre: 'COMIDA FUERA', presupuestoMensual: 700, activa: true, icono: 'Utensils' },
    { id: '3', nombre: 'SUPERMERCADO', presupuestoMensual: 650, activa: true, icono: 'ShoppingCart' },
    { id: '4', nombre: 'OCIO', presupuestoMensual: 400, activa: true, icono: 'Beer' },
    { id: '5', nombre: 'TRANSPORTE', presupuestoMensual: 225, activa: true, icono: 'Car' },
    { id: '6', nombre: 'ROPA', presupuestoMensual: 170, activa: true, icono: 'Shirt' },
    { id: '7', nombre: 'SERVICIOS', presupuestoMensual: 163, activa: true, icono: 'Zap' },
    { id: '8', nombre: 'AMAZON', presupuestoMensual: 150, activa: true, icono: 'ShoppingBag' },
    { id: '9', nombre: 'SEGURO DE SALUD', presupuestoMensual: 123, activa: true, icono: 'Heart' },
    { id: '10', nombre: 'EXTRA', presupuestoMensual: 100, activa: true, icono: 'AlertCircle' },
    { id: '11', nombre: 'IKER', presupuestoMensual: 89, activa: true, icono: 'Smile' },
    { id: '12', nombre: 'GYM', presupuestoMensual: 70, activa: true, icono: 'Dumbbell' },
    { id: '13', nombre: 'PLATAFORMAS', presupuestoMensual: 35, activa: true, icono: 'Tv' },
    { id: '14', nombre: 'PELUQUERIA', presupuestoMensual: 25, activa: true, icono: 'Scissors' }
];

export const getCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COL));
    const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    if (cats.length === 0) {
        // Intentamos crear las categorías por defecto solo si está vacío
        console.log("Inicializando categorías...");
        for (const c of DEFAULT_CATEGORIES) {
             const { id, ...rest } = c;
             await addDoc(collection(db, CATEGORIES_COL), rest);
        }
        return DEFAULT_CATEGORIES;
    }
    return cats;
  } catch (error: any) { 
    console.error("Error cargando categorías:", error);
    return DEFAULT_CATEGORIES; 
  }
};

export const saveCategory = async (category: Category): Promise<void> => {
  try {
    if (category.id && category.id.length > 10) {
       const { id, ...data } = category;
       await updateDoc(doc(db, CATEGORIES_COL, id), data);
    } else {
       const { id, ...data } = category;
       await addDoc(collection(db, CATEGORIES_COL), data);
    }
  } catch (error: any) { console.error(error); }
};

export const deleteCategory = async (id: string) => {
    try { await deleteDoc(doc(db, CATEGORIES_COL, id)); } catch(e: any) { console.error(e); }
};

// --- CONFIG & REPORTES ---
export const getClosingConfig = async (): Promise<ClosingConfig> => {
    try {
        const ref = doc(db, CONFIG_COL, 'main_config');
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data() as ClosingConfig;
        const def: ClosingConfig = { tipo: 'diaFijo', diaFijo: 11 };
        await setDoc(ref, def);
        return def;
    } catch (e: any) { 
        console.warn("No se pudo cargar config, usando default local");
        return { tipo: 'diaFijo', diaFijo: 11 }; 
    }
};

export const saveClosingConfig = async (config: ClosingConfig) => {
    try { await setDoc(doc(db, CONFIG_COL, 'main_config'), config); } catch(e: any) { console.error(e); }
};

export const getMonthlyReports = async (): Promise<MonthlyReport[]> => {
    try {
        const snap = await getDocs(collection(db, REPORTS_COL));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyReport));
    } catch(e: any) { return []; }
};

export const generateClosingReport = async (date: Date): Promise<void> => {
    const newReport: MonthlyReport = {
        id: crypto.randomUUID(),
        numeroPeriodo: 0, 
        fechaInicio: new Date().toISOString(),
        fechaFin: date.toISOString(),
        fechaCierre: date.toISOString(),
        totalGlobalPresupuesto: 5700,
        totalGlobalGasto: 0, 
        totalGlobalDiferencia: 0,
        estado: 'cerrado',
        detalles: [] 
    };
    try { await addDoc(collection(db, REPORTS_COL), newReport); } catch(e: any) { console.error(e); }
};
