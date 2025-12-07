import React, { useEffect, useState } from 'react';
import { cn } from './Components';

interface SplashProps {
  onFinish?: () => void;
}

/**
 * Splash animado:
 * - Fase 0: marco tipo iPhone en el centro
 * - Fase 1: se “comprime” a formato consola central
 * - Fase 2: pequeño zoom / golpe y fade out (lo maneja App)
 */
const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'phone' | 'console'>('phone');

  useEffect(() => {
    // Pasar de marco tipo iPhone a consola
    const t1 = setTimeout(() => {
      setPhase('console');
    }, 550);

    // Terminar splash y mostrar app
    const t2 = setTimeout(() => {
      onFinish?.();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <>
      {/* Keyframes locales para el borde giratorio */}
      <style>{`
        @keyframes gastappSpinBorder {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950">
        <div
          className={cn(
            'relative transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            'flex items-center justify-center',
            // Fase marco tipo iPhone
            phase === 'phone' &&
              'w-[78vw] max-w-sm aspect-[9/19] rounded-[40px]',
            // Fase consola (más baja, más ancha)
            phase === 'console' &&
              'w-[88vw] max-w-md h-[220px] rounded-[30px] translate-y-[-10px] scale-[0.98]',
          )}
        >
          {/* Glow externo suave */}
          <div className="absolute inset-[-14px] rounded-[46px] bg-slate-900/40 blur-xl" />

          {/* Marco degradado animado */}
          <div className="relative w-full h-full rounded-[40px]">
            <div
              className="absolute inset-0 rounded-[40px] p-[2px]"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #22c55e, #22d3ee, #6366f1, #f97316, #eab308, #22c55e)',
                animation: 'gastappSpinBorder 3.5s linear infinite',
              }}
            >
              {/* “Vidrio” interior oscuro */}
              <div className="w-full h-full rounded-[36px] bg-slate-950/95 shadow-[0_18px_60px_rgba(0,0,0,0.75)]" />
            </div>

            {/* Segundo marco tenue (doble línea) */}
            <div className="absolute inset-[10px] rounded-[32px] border border-slate-500/40" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Splash;
