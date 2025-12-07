// src/App.tsx
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';

import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Trips } from './pages/Trips';

import { Splash } from './components/Splash';

// Wrapper de seguridad
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  // Leemos la flag de entorno, pero castear import.meta a any
  // para que TS no se queje aunque falte vite-env.d.ts
  const enableSplash =
    ((import.meta as any)?.env?.VITE_ENABLE_SPLASH ?? 'true') !== 'false';

  const [showSplash, setShowSplash] = useState<boolean>(enableSplash);

  useEffect(() => {
    if (!enableSplash) {
      setShowSplash(false);
    }
  }, [enableSplash]);

  // Mientras el splash esté activo, mostramos solo eso
  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Rutas privadas con layout común */}
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
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
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
