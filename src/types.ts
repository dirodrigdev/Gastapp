export type User = 'Diego' | 'Gastón';

// Deprecated: Use dynamic categories instead, but kept for migration if needed
export enum ExpenseCategoryLegacy {
  FOOD = 'Comida',
  TRANSPORT = 'Transporte',
  HOME = 'Hogar',
  ENTERTAINMENT = 'Ocio',
  SHOPPING = 'Compras',
  SERVICES = 'Servicios',
  HEALTH = 'Salud',
  OTHER = 'Otros'
}

export enum ProjectType {
  TRIP = 'viaje',
  PROJECT = 'proyecto'
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  ARS = 'ARS',
  BRL = 'BRL'
}

export type CurrencyType = Currency | string;

// --- NEW DYNAMIC STRUCTURES ---

export interface Category {
  id: string;
  nombre: string;
  presupuestoMensual: number;
  activa: boolean;
  icono?: string; // Optional icon identifier
}

export interface ClosingConfig {
  tipo: 'ultimoDia' | 'diaFijo';
  diaFijo?: number; // 1-31
}

export interface CategoryReportDetail {
  categoryId: string;
  categoryName: string;
  presupuesto: number;
  gastoReal: number;
  diferencia: number; // Presupuesto - Gasto
}

export interface MonthlyReport {
  id: string;
  anio: number;
  mes: number; // 0-11
  
  // New fields for precise period tracking
  numeroPeriodo: number;
  fechaInicio: string; // ISO string
  fechaFin: string;    // ISO string (Fecha de Cierre efectivo)
  fechaCierre: string; // ISO string (Timestamp de creación)

  detalles: CategoryReportDetail[];
  totalGlobalPresupuesto: number;
  totalGlobalGasto: number;
  totalGlobalDiferencia: number;
}

// --- EXISTING ENTITIES UPDATED ---

export interface MonthlyExpense {
  id?: string;
  fecha: string; // ISO date string
  monto: number;
  moneda: CurrencyType;
  categoria: string; 
  categoryId?: string; 
  descripcion?: string;
  imagen_adjunta_url?: string;
  creado_por_usuario_id: User;
  estado: 'activo' | 'borrado';
  created_at?: string;
}

export interface Project {
  id?: string;
  tipo: ProjectType;
  nombre: string;
  moneda_principal: CurrencyType;
  presupuesto_total: number;
  cerrado: boolean;
  created_at?: string;
}

export interface ProjectExpense {
  id?: string;
  proyecto_id: string;
  fecha: string;
  monto_original: number;
  moneda_original: CurrencyType;
  tipo_cambio_usado: number;
  monto_en_moneda_proyecto: number;
  monto_en_moneda_principal: number;
  categoria: string;
  descripcion?: string;
  imagen_adjunta_url?: string;
  creado_por_usuario_id: User;
  estado: 'activo' | 'borrado';
}