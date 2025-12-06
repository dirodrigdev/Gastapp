// src/types.ts

// --- USUARIOS ---

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
  OTHER = 'Otros',
}

// --- PROYECTOS / VIAJES ---

export enum ProjectType {
  TRIP = 'viaje',
  PROJECT = 'proyecto',
}

// Estado “blando” de viaje/proyecto (para la UI)
export type ProjectEstadoTemporal = 'planeado' | 'en_curso' | 'pasado';

// --- MONEDAS ---

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  ARS = 'ARS',
  BRL = 'BRL',
  MXN = 'MXN',
  CLP = 'CLP',
  JPY = 'JPY',
  LKR = 'LKR',
  KRW = 'KRW',
  THB = 'THB',
  IDR = 'IDR',
}

// Permitimos también string para casos “OTRO”
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

// --- ENTIDADES PRINCIPALES (GASTOS MENSUALES) ---

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

  tipo: ProjectType;
  nombre: string;
  destino?: string;

  // moneda_principal del proyecto/viaje (EUR, MXN, etc.)
  moneda_principal: CurrencyType;

  // Tipo de cambio de referencia (por ahora número simple, semántica: “1 EUR = X moneda_viaje” o similar)
  tipo_cambio_referencia?: number;

  // Presupuesto global (opcionalmente lo podremos usar más adelante)
  presupuesto_total: number;

  // Metadatos de viaje
  numero_personas?: number;
  noches_hotel?: number;
  noches_fuera?: number;

  // Estado duro
  cerrado: boolean;

  // Estado “temporal” para la UI (planeado / en curso / pasado)
  estado_temporal?: ProjectEstadoTemporal;

  // Trazabilidad
  created_at?: string;
}

// --- GASTOS DE PROYECTO / VIAJE ---

export interface ProjectExpense {
  id?: string;
  proyecto_id: string;

  fecha: string;

  // Lo que el usuario escribió originalmente
  monto_original: number;
  moneda_original: CurrencyType;

  // Tipo de cambio usado al momento de crear/editar
  tipo_cambio_usado: number;

  // Normalizaciones
  monto_en_moneda_proyecto: number;   // en moneda_principal del viaje
  monto_en_moneda_principal: number;  // típicamente EUR (si algún día distingues “moneda sistema”)

  categoria: string;
  descripcion?: string;
  imagen_adjunta_url?: string;

  creado_por_usuario_id: User;
  estado: 'activo' | 'borrado';
  created_at?: string;
}
