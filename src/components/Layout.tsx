
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, History, Briefcase, Settings, PieChart } from 'lucide-react';
import { cn } from './Components';

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 no-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-end h-16 pb-2">
          <NavItem to="/" icon={<Home size={22} />} label="Home" />
          <NavItem to="/history" icon={<History size={22} />} label="Historial" />
          
          {/* Projects Link Hidden for V1 */}
          {/* <NavItem to="/projects" icon={<Briefcase size={22} />} label="Proyectos" /> */}
          
          <NavItem to="/reports" icon={<PieChart size={22} />} label="Informes" />
          <NavItem to="/settings" icon={<Settings size={22} />} label="Ajustes" />
        </div>
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 gap-1 transition-colors duration-200",
          isActive ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
        )
      }
    >
      <div className="relative">
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-tight">{label}</span>
    </NavLink>
  );
};