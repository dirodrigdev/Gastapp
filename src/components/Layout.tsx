import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LucideIcons from 'lucide-react';

// Utility para unir clases de Tailwind sin conflictos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- UI COMPONENTS ---

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-2xl bg-white border border-slate-200 shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' | 'icon' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95",
      outline: "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm active:scale-95",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-lg",
      icon: "h-10 w-10 p-2 flex items-center justify-center"
    };
    return (
      <button ref={ref} className={cn("inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
  return (
    <input type={type} className={cn("flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
  );
});
Input.displayName = "Input";

export const SwipeRow = ({ children, onDelete }: { children: React.ReactNode, onDelete: () => void }) => {
  // Versión simplificada sin librerías externas de gestos para evitar errores de dependencias
  // En una V2 podríamos añadir 'react-swipeable'
  return (
    <div className="relative group overflow-hidden rounded-xl">
       <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center text-white z-0" onClick={onDelete}>
         <LucideIcons.Trash2 size={20} />
       </div>
       <div className="relative z-10 bg-white transition-transform group-hover:-translate-x-2">
          {children}
       </div>
    </div>
  )
};

// --- HELPERS ---

export const parseLocaleNumber = (stringNumber: string): number => {
  if (!stringNumber) return 0;
  // Reemplaza comas por puntos para que JS lo entienda, elimina puntos de miles
  const clean = stringNumber.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const formatLocaleNumber = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
        style: 'decimal',
        minimumFractionDigits: 0, // Simplificado sin decimales por defecto
        maximumFractionDigits: 2
    }).format(value);
};

export const calculatePeriodInfo = (currentDate: Date = new Date(), closingDay: number = 11) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    let startDate: Date;
    let endDate: Date;
    
    // Si hoy es 12 o más, estamos en el periodo que cierra el próximo mes
    if (day > closingDay) {
        startDate = new Date(year, month, closingDay + 1);
        endDate = new Date(year, month + 1, closingDay);
    } else {
        // Si hoy es 11 o menos, estamos en el periodo que empezó el mes pasado
        startDate = new Date(year, month - 1, closingDay + 1);
        endDate = new Date(year, month, closingDay);
    }

    // Fix para P32 (Diciembre) -> Enero es mes 0
    const periodNumber = (startDate.getFullYear() - 2023) * 12 + startDate.getMonth() + 4; // Ajuste manual para calzar con tu Excel

    return { startDate, endDate, periodNumber, label: `P${periodNumber}` };
};

export const getCategoryIcon = (iconName: string) => {
    // Mapeo seguro de iconos
    const iconMap: any = {
        'Home': LucideIcons.Home,
        'ShoppingCart': LucideIcons.ShoppingCart,
        'Utensils': LucideIcons.Utensils,
        'Car': LucideIcons.Car,
        'Heart': LucideIcons.Heart,
        'Zap': LucideIcons.Zap,
        'ShoppingBag': LucideIcons.ShoppingBag,
        'Beer': LucideIcons.Beer,
        'Plane': LucideIcons.Plane,
        'Smartphone': LucideIcons.Smartphone,
        'Tv': LucideIcons.Tv,
        'Scissors': LucideIcons.Scissors,
        'Dumbbell': LucideIcons.Dumbbell,
        'Smile': LucideIcons.Smile,
        'Shirt': LucideIcons.Shirt,
        'AlertCircle': LucideIcons.AlertCircle,
        'General': LucideIcons.CircleDollarSign
    };
    return iconMap[iconName] || LucideIcons.CircleDollarSign;
};

// Icon Keys for selection
export const ICON_KEYS = ['Home','ShoppingCart','Utensils','Car','Heart','Zap','ShoppingBag','Beer','Plane','Smartphone','Tv','Scissors','Dumbbell','Smile','Shirt','AlertCircle'];
export const ICON_MAP: any = LucideIcons;
