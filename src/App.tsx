import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';

// Páginas
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Trips } from './pages/Trips';

// Splash
import { Splash } from './components/splash';

// Flag rápida por si quieres desactivar el splash
const ENABLE_SPLASH = true;

const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(ENABLE_SPLASH);

  useEffect(() => {
    if (!ENABLE_SPLASH) {
      setShowSplash(false);
      return;
    }

    // Si ya se vio antes, saltamos directo a la app
    const alreadySeen = localStorage.getItem('gastapp_splash_seen');
    if (alreadySeen === '1') {
      setShowSplash(false);
    }
  }, []);

  const handleSplashFinish = () => {
    localStorage.setItem('gastapp_splash_seen', '1');
    setShowSplash(false);
  };

  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />;
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
