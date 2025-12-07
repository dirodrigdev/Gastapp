// src/components/Splash.tsx
import React, { useEffect } from 'react';
import '../splash.css';

interface SplashProps {
  onFinish?: () => void;
}

/**
 * Pantalla de splash:
 * - Fondo negro
 * - “consola” central con borde animado
 * - Tras ~1.6s llama a onFinish y deja paso a la app
 */
export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 1600); // duración total de la animación

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      <div className="splash-console">
        <div className="splash-console-inner" />
      </div>
    </div>
  );
};
