import React, { useEffect, useState } from 'react';
import { cn } from './Components';

interface SplashProps {
  // Por si en el futuro quieres enganchar algo, pero ahora NO lo necesitamos
  onFinish?: () => void;
}

/**
 * Splash animado autónomo:
 * - Fase "phone": marco tipo iPhone centrado.
 * - Fase "console": se comprime a forma de consola GastApp.
 * - Luego hace un pequeño settle y desaparece (fade out).
 *
 * Importante: el propio Splash se auto-oculta (return null)
 * después de la animación. No bloquea la app.
 */
const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'phone' | 'console'>('phone');
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    // 1) Pasar de marco "iPhone" a consola
    const t1 = setTimeout(() => {
      setPhase('console');
    }, 550);

    // 2) Desaparecer splash (fade out + desmontar)
    const t2 = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <>
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
            // Fase consola GastApp (más baja, más ancha)
            phase === 'console' &&
              'w-[88vw] max-w-md h-[220px] rounded-[30px] translate-y-[-10px] scale-[0.98]',
          )}
        >
          {/* Glow externo */}
          <div className="absolute inset-[-14px] rounded-[46px] bg-slate-900/40 blur-xl" />

          {/* Marco multicolor girando */}
          <div className="relative w-full h-full rounded-[40px]">
            <div
              className="absolute inset-0 rounded-[40px] p-[2px]"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #22c55e, #22d3ee, #6366f1, #f97316, #eab308, #22c55e)',
                animation: 'gastappSpinBorder 3.5s linear infinite',
              }}
            >
              {/* Interior oscuro tipo “vidrio” */}
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
