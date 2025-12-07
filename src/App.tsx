import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Splash } from './components/Splash';

import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Trips } from './pages/Trips';

// ---------------- PROTECCIÓN BÁSICA ----------------

const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

// --------------- LÓGICA PARA MOSTRAR SPLASH ---------------

const shouldShowSplash = (): boolean => {
  // 1) flag global por entorno (puedes poner VITE_ENABLE_SPLASH=false en .env)
  if (import.meta.env.VITE_ENABLE_SPLASH === 'false') return false;

  // 2) usuarios con “reduced motion”
  if (typeof window !== 'undefined') {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
    } catch {
      // ignoramos fallo silencioso
    }
  }

  // 3) toggle manual en localStorage
  const flag = localStorage.getItem('gastapp:disableSplash');
  if (flag === '1') return false;

  return true;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(() => shouldShowSplash());

  useEffect(() => {
    if (!showSplash) return;
    // duración total aprox de las animaciones (700 + 550 ms) + pequeño margen
    const t = setTimeout(() => setShowSplash(false), 1300);
    return () => clearTimeout(t);
  }, [showSplash]);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Rutas privadas con layout */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <Budgets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
