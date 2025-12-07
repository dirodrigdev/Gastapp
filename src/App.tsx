import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Trips } from './pages/Trips';

import Splash from './components/Splash';

// Pequeño wrapper para proteger rutas si no hay usuario
const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

// Flag para activar/desactivar el splash fácilmente
const shouldUseSplash =
  (import.meta as any)?.env?.VITE_ENABLE_SPLASH !== '0';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(shouldUseSplash);

  // Seguridad extra: si por cualquier cosa no se dispara onFinish
  useEffect(() => {
    if (!shouldUseSplash) return;
    const maxTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(maxTimeout);
  }, []);

  return (
    <HashRouter>
      {/* Splash por encima de todo */}
      {showSplash && shouldUseSplash && (
        <Splash onFinish={() => setShowSplash(false)} />
      )}

      {/* La app vive siempre detrás; mientras showSplash=true, queda “tapada” */}
      <Routes>
        {/* Ruta pública */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Rutas privadas envueltas en Layout */}
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
