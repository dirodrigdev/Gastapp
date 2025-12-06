import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';

import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';

// 👉 NUEVO: página de Viajes
import { Trips } from './pages/Trips';

// Wrapper de seguridad
const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Rutas privadas */}
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

          {/* 👉 NUEVO: VIAJES */}
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Trips />
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
