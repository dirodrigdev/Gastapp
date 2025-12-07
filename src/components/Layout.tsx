import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Clock,
  Settings as SettingsIcon,
  PieChart,
  Plane,
} from 'lucide-react';
import { cn, ConnectionBanner } from './Components';

// Relajamos el tipo del icono para que acepte sin problema los LucideIcon
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  /** Solo mostrar a usuarios con acceso a Viajes (Diego / Gastón) */
  onlyTripsUsers?: boolean;
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const currentUser = localStorage.getItem('currentUser') || '';

  const isTripsUser = currentUser === 'Diego' || currentUser === 'Gastón';

  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Inicio',
      icon: HomeIcon,
    },
    {
      to: '/history',
      label: 'Historial',
      icon: Clock,
    },
    {
      to: '/trips',
      label: 'Viajes',
      icon: Plane,
      onlyTripsUsers: true,
    },
    {
      to: '/reports',
      label: 'Informes',
      icon: PieChart,
    },
    {
      to: '/settings',
      label: 'Ajustes',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Aviso de conexión */}
      <ConnectionBanner />

      {/* Contenido principal (SIN opacity-0, SIN animación rara) */}
      <main className="flex-1 max-w-md mx-auto w-full pb-20">
        <Outlet />
      </main>

      {/* Barra de navegación inferior */}
      <nav className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur pb-2">
        <div className="max-w-md mx-auto flex justify-between px-4 pt-1.5 pb-3">
          {navItems
            .filter((item) => !item.onlyTripsUsers || isTripsUser)
            .map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center gap-0.5 flex-1 text-[11px]',
                    isActive ? 'text-blue-600' : 'text-slate-400',
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
};
