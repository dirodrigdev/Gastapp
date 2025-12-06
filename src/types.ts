export type User = 'Diego' | 'Gastón';

// Categorías heredadas (por si acaso)
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

// --- ESTRUCTURAS DINÁMICAS ---

export interface Category {
  id: string;
  nombre: string;
  presupuestoMensual: number;
  activa: boolean;
  icono?: string;
}

export interface ClosingConfig {
  tipo: 'ultimoDia' | 'diaFijo';
  diaFijo?: number;
}

export interface CategoryReportDetail {
  categoryId?: string; // Opcional para datos históricos antiguos
  categoryName: string;
  presupuesto: number;
  gastoReal: number;
  diferencia?: number; // Opcional
}

export interface MonthlyReport {
  id: string;
  anio?: number;
  mes?: number;

  numeroPeriodo: number;
  fechaInicio?: string;
  fechaFin: string;
  fechaCierre: string;

  estado?: string; // Campo opcional para compatibilidad con datos históricos

  detalles: CategoryReportDetail[];
  totalGlobalPresupuesto: number;
  totalGlobalGasto: number;
  totalGlobalDiferencia: number;
}

// --- ENTIDADES PRINCIPALES ---

export interface MonthlyExpense {
  id?: string;
  fecha: string; // ISO string
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

  // 🔹 Campos específicos para viajes
  numero_personas?: number;
  noches_hotel?: number;
  tipo_cambio_referencia?: number; // 1 EUR = X moneda del viaje
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
