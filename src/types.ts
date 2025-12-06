// src/types.ts

// --- USUARIOS ---

export type User = 'Diego' | 'Gastón';

// --- ENUMS LEGACY (por compatibilidad) ---

export enum ExpenseCategoryLegacy {
  FOOD = 'Comida',
  TRANSPORT = 'Transporte',
  HOME = 'Hogar',
  ENTERTAINMENT = 'Ocio',
  SHOPPING = 'Compras',
  SERVICES = 'Servicios',
  HEALTH = 'Salud',
  OTHER = 'Otros',
}

export enum ProjectType {
  TRIP = 'viaje',
  PROJECT = 'proyecto',
}

// --- MONEDAS ---

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  ARS = 'ARS',
  BRL = 'BRL',
  CLP = 'CLP',
  MXN = 'MXN',
  JPY = 'JPY',
  LKR = 'LKR',
  KRW = 'KRW',
  THB = 'THB',
  IDR = 'IDR',
}

// Podemos seguir usando strings libres (para "OTRO" o códigos raros)
export type CurrencyType = Currency | string;

// --- ESTRUCTURAS DINÁMICAS PRINCIPALES ---

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

// --- GASTO MENSUAL PRINCIPAL (HOME) ---

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

// --- PROYECTOS / VIAJES ---

export interface Project {
  id?: string;

  // tipo: viaje / proyecto genérico
  tipo: ProjectType;

  // nombre visible del proyecto/viaje
  nombre: string;

  // destino opcional (ej. "Cancún", "Bali 2025")
  destino?: string;

  // moneda "principal" de este proyecto (para reportes / viaje)
  moneda_principal: CurrencyType;

  // tipo de cambio referencia que estamos usando en Trips.tsx
  // (ej. cuántos MXN por 1 EUR, etc.)
  tipo_cambio_referencia?: number;

  // presupuesto total del proyecto/viaje (en EUR, por ahora)
  presupuesto_total: number;

  // metadatos del viaje
  numero_personas?: number;
  noches_hotel?: number;
  noches_fuera?: number;

  // estado temporal para clasificar en UI (no afecta cálculos)
  // se usa en db.ts -> createProject
  estado_temporal?: 'futuro' | 'en_curso' | 'pasado';

  // flag manual para "viaje cerrado" contablemente
  cerrado: boolean;

  created_at?: string;
}

// --- GASTOS DE PROYECTO / VIAJE ---

export interface ProjectExpense {
  id?: string;
  proyecto_id: string;

  fecha: string; // ISO

  // importe original y moneda original (lo que realmente pagaste)
  monto_original: number;
  moneda_original: CurrencyType;

  // tipo de cambio que se aplicó en el momento de guardar
  tipo_cambio_usado: number;

  // normalizaciones:
  // - en moneda del proyecto (ej. MXN del viaje)
  monto_en_moneda_proyecto: number;

  // - en moneda principal global (EUR)
  monto_en_moneda_principal: number;

  categoria: string;
  descripcion?: string;
  imagen_adjunta_url?: string;

  creado_por_usuario_id: User;
  estado: 'activo' | 'borrado';

  // para ordenar y debug
  created_at?: string;
}
