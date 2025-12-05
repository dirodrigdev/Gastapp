
import React, { useState, useRef, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  ShoppingCart, Coffee, Car, Zap, Heart, Shield, Film, Smartphone, Gift, AlertCircle, LayoutGrid, Dog,
  Trash2, Home, Scissors, Shirt, Tv
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- ICON SYSTEM ---
export const ICON_MAP: Record<string, React.ElementType> = {
  'Shopping': ShoppingCart, 'Food': Coffee, 'Transport': Car,
  'Bills': Zap, 'Health': Heart, 'Insurance': Shield,
  'Entertainment': Film, 'Tech': Smartphone, 'Gift': Gift,
  'Other': AlertCircle, 'General': LayoutGrid, 'Dog': Dog,
  'Beauty': Scissors, 'Clothes': Shirt, 'Services': Tv
};

export const ICON_KEYS = Object.keys(ICON_MAP);

export const getCategoryIcon = (categoryName: string): React.ElementType => {
  const normalized = categoryName.toUpperCase();
  if (normalized.includes('SUPER') || normalized.includes('AMAZON') || normalized.includes('COMPRA')) return ICON_MAP['Shopping'];
  if (normalized.includes('COMIDA')) return ICON_MAP['Food'];
  if (normalized.includes('TRANSPORTE') || normalized.includes('UBER')) return ICON_MAP['Transport'];
  if (normalized.includes('HOGAR') || normalized.includes('ALQUILER')) return Home;
  if (normalized.includes('IKER') || normalized.includes('PERRO')) return ICON_MAP['Dog'];
  if (normalized.includes('SALUD') || normalized.includes('GYM')) return ICON_MAP['Health'];
  if (normalized.includes('OCIO')) return ICON_MAP['Entertainment'];
  if (normalized.includes('SERVICIO')) return ICON_MAP['Services'];
  if (normalized.includes('PELUQUERIA')) return ICON_MAP['Beauty'];
  if (normalized.includes('ROPA')) return ICON_MAP['Clothes'];
  if (normalized.includes('SEGURO')) return ICON_MAP['Insurance'];
  if (normalized.includes('PLATAFORMA')) return ICON_MAP['Tech'];
  return ICON_MAP['General'];
};

// --- PERIOD LOGIC (BASE 12 MAYO 2023) ---
export type PeriodInfo = { periodNumber: number; startDate: Date; endDate: Date; label: string; daysInPeriod: number; daysPassed: number; daysRemaining: number };

export const calculatePeriodInfo = (currentDate: Date = new Date(), closingDay: number = 11): PeriodInfo => {
  const now = new Date(currentDate);
  now.setHours(0, 0, 0, 0);

  let startYear = now.getFullYear();
  let startMonth = now.getMonth();

  if (now.getDate() <= closingDay) {
    startMonth--;
  }

  const startDate = new Date(startYear, startMonth, closingDay + 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, closingDay);
  endDate.setHours(0, 0, 0, 0);

  // ANCHOR: 12 Mayo 2023 = P1
  const anchorDate = new Date(2023, 4, 12); 
  
  let periodNumber = (startDate.getFullYear() - anchorDate.getFullYear()) * 12 + (startDate.getMonth() - anchorDate.getMonth()) + 1;
  if (periodNumber < 1) periodNumber = 1;

  const oneDay = 1000 * 60 * 60 * 24;
  const daysInPeriod = Math.round((endDate.getTime() - startDate.getTime()) / oneDay);
  const daysPassed = Math.round((now.getTime() - startDate.getTime()) / oneDay);
  const daysRemaining = Math.round((endDate.getTime() - now.getTime()) / oneDay);

  return {
    periodNumber,
    startDate,
    endDate,
    daysInPeriod,
    daysPassed: Math.max(0, daysPassed),
    daysRemaining: Math.max(0, daysRemaining),
    label: `P${periodNumber} (${format(startDate, 'd MMM', { locale: es })} - ${format(endDate, 'd MMM', { locale: es })})`.toUpperCase()
  };
};

// --- UI COMPONENTS ---

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("bg-white rounded-xl shadow-sm border border-slate-100", className)} {...props}>{children}</div>
));

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline', size?: 'sm' | 'md' | 'icon' }>(
  ({ children, onClick, variant = 'primary', size = 'md', className, type = "button", ...props }, ref) => {
    const baseStyle = "px-4 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50";
    const variants = { 
        primary: "bg-blue-600 text-white shadow-blue-500/20 shadow-lg", 
        secondary: "bg-slate-100 text-slate-600",
        danger: "bg-red-50 text-red-600",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-50",
        outline: "border border-slate-200 text-slate-700"
    };
    const sizes = { sm: "py-2 text-xs", md: "py-3 text-sm", icon: "p-2 w-10 h-10" };
    
    return (
        <button 
            ref={ref}
            type={type} 
            onClick={onClick} 
            className={cn(baseStyle, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
  }
);

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all", className)} {...props} />
));

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { options: {value:string, label:string}[] }>(({ className, options, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn("w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white", className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
));

export const formatLocaleNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0,00';
  const num = Number(value);
  if (isNaN(num)) return '0,00';
  return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(num);
};

export const parseLocaleNumber = (value: string): number => {
  if (!value) return 0;
  const clean = value.toString().replace(/\./g, '').replace(',', '.');
  const float = parseFloat(clean);
  return isNaN(float) ? 0 : float;
};

// --- SWIPE ROW (REVEAL MODE) ---
// Replaced "confirm" with a reveal pattern to avoid sandbox errors
export const SwipeRow: React.FC<{ children: React.ReactNode, onDelete: () => void }> = ({ children, onDelete }) => {
  const [offset, setOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartX.current !== null) {
          const diff = e.touches[0].clientX - touchStartX.current;
          // Only allow dragging left
          if (diff < 0) {
             setOffset(Math.max(-80, diff));
          } else {
             setOffset(0); 
          }
      }
  };

  const handleTouchEnd = () => {
    // If dragged more than 40px left, snap open to -80
    if (offset < -40) {
        setOffset(-80);
    } else {
        setOffset(0);
    }
    touchStartX.current = null;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent parent click (edit)
      onDelete();
      setOffset(0);
  };

  const reset = (e: React.MouseEvent) => {
    // e.stopPropagation(); // Removed to allow clicking item to edit if closed
    if (offset !== 0) {
        e.stopPropagation(); // Only stop prop if we are resetting state
        setOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden mb-2 select-none touch-pan-y h-[72px] rounded-xl bg-red-500">
       {/* Background (Delete Button) - Always visually present behind */}
       <div className="absolute top-0 right-0 bottom-0 w-[80px] flex items-center justify-center">
           <button 
             onClick={handleDeleteClick}
             className="w-full h-full flex items-center justify-center text-white"
             aria-label="Eliminar elemento"
           >
              <Trash2 size={24} aria-hidden="true" />
           </button>
       </div>

       {/* Foreground Content */}
       <div 
         className="absolute inset-0 bg-white transition-transform duration-200 ease-out border border-slate-100 rounded-xl"
         style={{ transform: `translateX(${offset}px)` }}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
         onClick={reset}
         role="listitem"
       >
         <div className="w-full h-full">{children}</div>
       </div>
    </div>
  );
};
