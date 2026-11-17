import React from 'react';
import wfLogo from '../assets/logo_WF.png';
import { WifiOff } from 'lucide-react';

/**
 * Componente Oficial de Carregamento WorkFlow (WF)
 * Design limpo, sem caixa/fundo atrás da logo, com animação orbital e levitação fluida do emblema WF.
 */
export const WFLogoLoader = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text = 'WORKFLOW GESTÃO',
  subtext = null,
  status = 'loading', // 'loading' | 'offline'
  fullScreen = false,
  className = ''
}) => {
  const sizeMap = {
    sm: {
      orbit: 'w-20 h-20',
      img: 'w-12 h-12',
      bar: 'w-36',
      title: 'text-xs',
      sub: 'text-[11px]'
    },
    md: {
      orbit: 'w-28 h-28',
      img: 'w-16 h-16 sm:w-20 sm:h-20',
      bar: 'w-48 sm:w-56',
      title: 'text-xs sm:text-sm',
      sub: 'text-xs'
    },
    lg: {
      orbit: 'w-32 h-32 sm:w-36 sm:h-36',
      img: 'w-20 h-20 sm:w-24 sm:h-24',
      bar: 'w-56 sm:w-64',
      title: 'text-sm sm:text-base',
      sub: 'text-xs sm:text-sm'
    },
    xl: {
      orbit: 'w-36 h-36 sm:w-40 sm:h-40',
      img: 'w-24 h-24 sm:w-28 sm:h-28',
      bar: 'w-64 sm:w-72',
      title: 'text-base sm:text-lg',
      sub: 'text-xs sm:text-sm'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isOfflineStatus = status === 'offline';

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <style>{`
        @keyframes wfLogoFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
            filter: drop-shadow(0 8px 18px rgba(227, 0, 15, 0.22));
          }
          50% {
            transform: translateY(-5px) scale(1.04);
            filter: drop-shadow(0 14px 26px rgba(227, 0, 15, 0.36));
          }
        }
        @keyframes wfOrbitSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes wfOrbitReverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes wfPulseWave {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.35;
          }
        }
        @keyframes wfBarShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>

      {/* EMBLEMA WF COM ANIMAÇÃO ORBITAL E LEVITAÇÃO (SEM FUNDO/CAIXA ATRÁS) */}
      <div className={`relative ${currentSize.orbit} flex items-center justify-center mb-5`}>
        {/* Halo de luz suave ao fundo */}
        <div
          className={`absolute inset-2 rounded-full blur-xl pointer-events-none ${
            isOfflineStatus ? 'bg-amber-500/20' : 'bg-[#E3000F]/20'
          }`}
          style={{ animation: 'wfPulseWave 2.8s ease-in-out infinite' }}
        />

        {/* Anel externo sutil estático */}
        <div className="absolute inset-0 rounded-full border border-neutral-200/70 dark:border-neutral-800/80" />

        {/* Arco orbital principal girando suavemente */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent ${
            isOfflineStatus
              ? 'border-t-amber-500 border-r-amber-500/40'
              : 'border-t-[#E3000F] border-r-[#E3000F]/35'
          }`}
          style={{ animation: 'wfOrbitSpin 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite' }}
        />

        {/* Segundo arco interno em rotação reversa */}
        <div
          className={`absolute inset-2.5 rounded-full border border-transparent ${
            isOfflineStatus
              ? 'border-b-amber-400/50'
              : 'border-b-[#E3000F]/45'
          }`}
          style={{ animation: 'wfOrbitReverse 2.4s linear infinite' }}
        />

        {/* Logo WF Pura com Animação de Flutuação */}
        <img
          src={wfLogo}
          alt="WorkFlow"
          className={`${currentSize.img} object-contain relative z-10 pointer-events-none`}
          style={{ animation: 'wfLogoFloat 2.6s ease-in-out infinite' }}
        />

        {isOfflineStatus && (
          <div className="absolute -bottom-1 right-0 z-20 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
            <WifiOff size={10} />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* BARRA DE PROGRESSO MINIMALISTA E ELEGANTE */}
      <div className={`${currentSize.bar} h-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden relative mb-4`}>
        <div
          className={`w-1/2 h-full rounded-full ${
            isOfflineStatus
              ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#E3000F] to-transparent'
          }`}
          style={{ animation: 'wfBarShimmer 1.35s ease-in-out infinite' }}
        />
      </div>

      {/* TÍTULO PRINCIPAL */}
      {text && (
        <h2 className={`font-extrabold uppercase tracking-[0.14em] text-neutral-800 dark:text-neutral-100 ${currentSize.title}`}>
          {text}
        </h2>
      )}

      {/* SUBTÍTULO */}
      {subtext && (
        <p className={`mt-1.5 font-medium text-neutral-500 dark:text-neutral-400 max-w-md ${currentSize.sub}`}>
          {subtext}
        </p>
      )}

      {/* AVISO EXTRA EM CASO OFFLINE */}
      {isOfflineStatus && (
        <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>Reconectando automaticamente ao servidor...</span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-neutral-950 p-6 transition-colors duration-300">
        {content}
      </div>
    );
  }

  return content;
};

export default WFLogoLoader;
