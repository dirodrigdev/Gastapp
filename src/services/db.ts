// ... otros imports que ya tengas arriba
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Project,
  ProjectType,
  ProjectExpense,
} from '../types';

/* =========================
   PROYECTOS / VIAJES
   ========================= */

const PROJECTS_COLLECTION = 'projects';
const PROJECT_EXPENSES_COLLECTION = 'project_expenses';

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

// Borrar gasto de proyecto
export const deleteProjectExpense = async (id: string): Promise<void> => {
  const docRef = doc(db, PROJECT_EXPENSES_COLLECTION, id);
  await deleteDoc(docRef);
};
