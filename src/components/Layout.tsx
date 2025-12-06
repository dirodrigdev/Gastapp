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

export const Layout: React.FC = () => {
  const location = useLocation();
  const currentUser = localStorage.getItem('currentUser');

  const navItems = [
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
    // 👉 Viajes (visible solo para Diego, por ahora)
    {
      to: '/trips',
      label: 'Viajes',
      icon: Plane,
      onlyDiego: true,
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
      {/* Banner de conexión: aparece solo si no hay internet */}
      <ConnectionBanner />

      <main className="flex-1 max-w-md mx-auto w-full pb-20">
        <Outlet />
      </main>

      {/* Subimos la barra un poco para evitar la “rayita” del iPhone */}
      <nav className="fixed bottom-2 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-md mx-auto flex justify-between px-4 py-2">
          {navItems
            .filter((item) => !item.onlyDiego || currentUser === 'Diego')
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
