import React from 'react';
import wfLogo from '../assets/logo_WF.png';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Componente Oficial de Carregamento Linear e Estado Offline
 * Padrão Linear Moderno: Sem discrepância geométrica, com barra de progresso linear suave.
 */
export const WFLogoLoader = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text = 'WORKFLOW GESTÃO - CARREGANDO...',
  subtext = null,
  status = 'loading', // 'loading' | 'offline'
  fullScreen = false,
  className = ''
}) => {
  // Proporções por tamanho da logo e da barra linear
  const sizeMap = {
    sm: { img: 'w-16 sm:w-20', bar: 'w-48 sm:w-56 h-1.5', textSize: 'text-xs', subtextSize: 'text-[11px]' },
    md: { img: 'w-28 sm:w-32', bar: 'w-56 sm:w-64 h-1.5', textSize: 'text-xs sm:text-sm', subtextSize: 'text-xs' },
    lg: { img: 'w-36 sm:w-44', bar: 'w-64 sm:w-72 h-2', textSize: 'text-sm sm:text-base', subtextSize: 'text-xs sm:text-sm' },
    xl: { img: 'w-48 sm:w-56', bar: 'w-72 sm:w-80 h-2', textSize: 'text-base sm:text-lg', subtextSize: 'text-xs sm:text-sm' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Injeção de Estilo dos Keyframes da Animação Linear */}
      <style>{`
        @keyframes wfLinearSlide {
          0% {
            left: -40%;
            width: 35%;
          }
          50% {
            left: 30%;
            width: 50%;
          }
          100% {
            left: 100%;
            width: 35%;
          }
        }
        @keyframes wfGlowPulse {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.015);
          }
        }
      `}</style>

      {/* Cartão Linear da Logo (Sem anéis circulares discrepantes) */}
      <div className="relative mb-5" style={{ animation: 'wfGlowPulse 2.4s ease-in-out infinite' }}>
        <div className="relative z-10 px-6 py-5 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xl flex items-center justify-center">
          <img
            src={wfLogo}
            alt="WorkFlow Logo"
            className={`${currentSize.img} h-auto object-contain transition-all duration-300 drop-shadow-md`}
          />

          {/* Ícone de Desconexão caso Status seja Offline */}
          {status === 'offline' && (
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-neutral-950 p-2 rounded-full border-2 border-white dark:border-neutral-900 shadow-lg">
              <WifiOff size={16} />
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE CARREGAMENTO LINEAR (Padrão Oficial Telecom) */}
      <div className={`relative ${currentSize.bar} rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shadow-inner mb-4`}>
        {status === 'loading' ? (
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#E3000F] via-red-500 to-[#E3000F] shadow-sm shadow-red-500/50"
            style={{
              animation: 'wfLinearSlide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        ) : (
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
            style={{
              animation: 'wfLinearSlide 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        )}
      </div>

      {/* Título Principal */}
      {text && (
        <h2 className={`font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100 ${currentSize.textSize} drop-shadow-sm`}>
          {text}
        </h2>
      )}

      {/* Subtítulo ou Mensagem de Conexão */}
      {subtext && (
        <p className={`mt-1 font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 max-w-md ${currentSize.subtextSize}`}>
          {subtext}
        </p>
      )}

      {/* Status Offline ou Indicador Linear Complementar */}
      {status === 'offline' && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-sm">
          <RefreshCw size={14} className="animate-spin" />
          <span className="uppercase text-[11px] tracking-wider">Tentando restabelecer conexão com o servidor...</span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1d24] via-[#14161d] to-[#0e1015] p-6 animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export default WFLogoLoader;
