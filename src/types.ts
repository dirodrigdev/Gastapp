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

export enum ProjectType {
  TRIP = 'viaje',
  PROJECT = 'proyecto',
}

// Monedas "base" que tenemos como enum
export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  ARS = 'ARS',
  BRL = 'BRL',
  CLP = 'CLP',
  MXN = 'MXN',
  COP = 'COP',
  JPY = 'JPY',
  KRW = 'KRW',
  THB = 'THB',
  IDR = 'IDR',
  LKR = 'LKR',
}

// Tipo lógico para cualquier moneda: una de las conocidas o un string libre (OTRA)
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

/**
 * Proyecto / Viaje
 *
 * Para viajes usamos:
 * - tipo: 'viaje'
 * - moneda_principal: normalmente 'EUR'
 * - moneda_proyecto: moneda local del viaje (MXN, THB, etc.)
 */
export interface Project {
  id?: string;

  tipo: ProjectType;

  // Nombre interno del proyecto / viaje (ej: "México 2025")
  nombre: string;

  // Destino principal visible (ej: "Cancún") — opcional
  destino_principal?: string;

  // Moneda "base" (para ti será EUR casi siempre)
  moneda_principal: CurrencyType;

  // Moneda del viaje/proyecto (ej: MXN, THB, etc.)
  moneda_proyecto: CurrencyType;

  // Presupuesto total del proyecto en moneda_principal (EUR)
  presupuesto_total?: number;

  // Personas que viajan
  personas?: number;

  // Noches de hotel (las que usamos para coste medio por noche)
  noches_totales?: number;

  // Opcional: noches fuera de Madrid (info extra)
  noches_fuera_madrid?: number;

  // Tipo de cambio de referencia:
  // cuántas unidades de moneda_proyecto equivalen a 1 unidad de moneda_principal
  // (ej: 1 EUR = 20 MXN → tipo_cambio_referencia = 20)
  tipo_cambio_referencia?: number;

  // Marcador contable: cuando lo cierres "de verdad"
  cerrado: boolean;

  // Estado temporal lúdico: futuro / en curso / pasado
  estado_temporal?: 'futuro' | 'en_curso' | 'pasado';

  created_at?: string;
}

export interface ProjectExpense {
  id?: string;
  proyecto_id: string;
  fecha: string; // ISO
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
