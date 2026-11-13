import React from 'react';
import wfLogo from '../assets/logo_WF.png';
import { Loader2, WifiOff } from 'lucide-react';

/**
 * Componente Oficial de Carregamento e Estado Offline
 * Exibe a logo oficial do WorkFlow em escala de cinza com animações suaves e modernas.
 */
export const WFLogoLoader = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text = 'WORKFLOW GESTÃO - CARREGANDO...',
  subtext = null,
  status = 'loading', // 'loading' | 'offline'
  fullScreen = false,
  className = ''
}) => {
  // Configurações de proporções por tamanho
  const sizeMap = {
    sm: { img: 'w-14 sm:w-16', ring: 'w-24 h-24', textSize: 'text-xs', subtextSize: 'text-[11px]' },
    md: { img: 'w-24 sm:w-28', ring: 'w-36 h-36', textSize: 'text-xs sm:text-sm', subtextSize: 'text-xs' },
    lg: { img: 'w-32 sm:w-40', ring: 'w-48 h-48', textSize: 'text-sm sm:text-base', subtextSize: 'text-xs sm:text-sm' },
    xl: { img: 'w-40 sm:w-56', ring: 'w-60 sm:w-72 h-60 sm:h-72', textSize: 'text-lg sm:text-2xl', subtextSize: 'text-sm sm:text-base' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Contêiner da Logo com Anéis em Escala de Cinza */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Efeito de Ping/Onda em Cinza Suave */}
        <div
          className={`absolute ${currentSize.ring} rounded-full bg-neutral-300/40 dark:bg-neutral-700/30 animate-ping opacity-30`}
        />

        {/* Anel Giratório em Cinza para Loading */}
        {status === 'loading' && (
          <div
            className={`absolute ${currentSize.ring} rounded-full border-2 border-neutral-300/60 dark:border-neutral-700/60 border-t-neutral-600 dark:border-t-neutral-300 animate-spin`}
            style={{ animationDuration: '2s' }}
          />
        )}

        {/* Cartão de Base com Efeito Vidro Fosco */}
        <div className="relative z-10 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shadow-2xl flex items-center justify-center">
          <img
            src={wfLogo}
            alt="WorkFlow Logo"
            className={`${currentSize.img} h-auto object-contain transition-all duration-300 filter grayscale contrast-125 brightness-95 dark:brightness-110 drop-shadow-[0_4px_14px_rgba(0,0,0,0.12)] animate-pulse`}
          />

          {/* Ícone de Desconexão caso Status seja Offline */}
          {status === 'offline' && (
            <div className="absolute -bottom-2 -right-2 bg-neutral-800 text-neutral-300 p-2 sm:p-2.5 rounded-full border border-neutral-700 shadow-lg">
              <WifiOff size={size === 'xl' ? 24 : 18} className="animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Título Principal */}
      {text && (
        <h2 className={`font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 ${currentSize.textSize} drop-shadow-sm`}>
          {text}
        </h2>
      )}

      {/* Subtítulo ou Mensagem Secundária */}
      {subtext && (
        <p className={`mt-1.5 font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 max-w-xl ${currentSize.subtextSize}`}>
          {subtext}
        </p>
      )}

      {/* Barra de Status Adicional para Offline ou Loading Longo */}
      {status === 'offline' ? (
        <div className="mt-5 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-semibold shadow-inner">
          <Loader2 size={16} className="animate-spin text-neutral-500 dark:text-neutral-400" />
          <span className="tracking-wide uppercase text-[11px] sm:text-xs">Tentando reconectar automaticamente...</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-neutral-100/95 dark:bg-neutral-950/95 backdrop-blur-md p-6 animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export default WFLogoLoader;

