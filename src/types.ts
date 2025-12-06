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

// ----------------------
// VIAJES – TIPOS NUEVOS
// ----------------------

// Estado temporal del viaje para la UI (no confundir con "cerrado" contable)
export type ProjectTemporalState = 'futuro' | 'en_curso' | 'pasado';

// Categorías fijas de gastos de viaje
export type TripCategory =
  | 'Vuelos'
  | 'Hoteles'
  | 'Traslados'
  | 'Seguros'
  | 'Tasas y visas'
  | 'Comidas'
  | 'Excursiones'
  | 'Regalos'
  | 'Compras'
  | 'Efectivo'
  | 'Rover'
  | 'Otros';

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

// --- ENTIDADES PRINCIPALES (MES) ---

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
  tipo: ProjectType;               // 'viaje' | 'proyecto'
  nombre: string;                  // Ej: "México 2025"
  
  // Monedas:
  // - moneda_principal: tu base (normalmente EUR)
  // - moneda_proyecto: moneda local del viaje (MXN, THB, etc.)
  moneda_principal: CurrencyType;
  moneda_proyecto?: CurrencyType;

  presupuesto_total: number;       // En moneda_principal (normalmente EUR)

  // Estado contable
  cerrado: boolean;                // true = viaje cerrado contablemente

  // Estado temporal para la UI (futuro / en curso / pasado)
  estado_temporal?: ProjectTemporalState;

  // Metadatos de viaje
  destino?: string;                // Ej: "Cancún"
  personas?: number;               // Nº de personas en el viaje

  // Noches
  noches_hotel?: number;           // Nº de noches de hotel (para coste por noche)
  noches_fuera_madrid?: number;    // Nº de noches/días fuera de Madrid (para Rover, info)

  // Fechas de viaje (ISO)
  fecha_salida_madrid?: string;    // ISO string
  fecha_regreso_madrid?: string;   // ISO string

  // Tipo de cambio de referencia actual (para conversión global)
  // Ej: 1 EUR = 20 MXN -> tipo_cambio_actual = 20 si se define así
  tipo_cambio_actual?: number;

  // Color de la tarjeta en la wallet de viajes (hex o tailwind-key)
  color_hex?: string;

  created_at?: string;
}

export interface ProjectExpense {
  id?: string;
  proyecto_id: string;                 // Referencia al Project / viaje

  fecha: string;                       // ISO string

  // Monto introducido originalmente por ti
  monto_original: number;
  moneda_original: CurrencyType;       // EUR o moneda_proyecto

  // Tipo de cambio utilizado en el momento de crear/editar el gasto
  // Siempre relativo a (moneda_principal <-> moneda_proyecto)
  tipo_cambio_usado: number;

  // Normalizamos ambos mundos para reportes
  // - Si moneda_original = moneda_principal -> monto_en_moneda_principal = monto_original
  // - Si moneda_original = moneda_proyecto  -> monto_en_moneda_proyecto = monto_original
  // y calculamos la otra con tipo_cambio_usado.
  monto_en_moneda_proyecto: number;    // Siempre en moneda_proyecto (si existe)
  monto_en_moneda_principal: number;   // Siempre en moneda_principal

  categoria: TripCategory | string;    // Categoría del gasto dentro del viaje
  descripcion?: string;
  imagen_adjunta_url?: string;

  creado_por_usuario_id: User;
  estado: 'activo' | 'borrado';

  created_at?: string;
}
