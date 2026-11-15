import React from 'react';
import wfLogo from '../assets/logo_WF.png';
import { WifiOff } from 'lucide-react';

/**
 * Componente Oficial de Carregamento Linear do Sistema
 * Padrão Linear Telecom: Caixa da logo e indicador de progresso 100% integrados e retilíneos,
 * eliminando qualquer discrepância geométrica entre elementos redondos e retangulares.
 */
export const WFLogoLoader = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text = 'WORKFLOW GESTÃO - CARREGANDO...',
  subtext = null,
  status = 'loading', // 'loading' | 'offline'
  fullScreen = false,
  className = ''
}) => {
  // Proporções por tamanho do container e da logo
  const sizeMap = {
    sm: { card: 'w-48 sm:w-56', img: 'h-10 sm:h-12', textSize: 'text-xs', subtextSize: 'text-[11px]' },
    md: { card: 'w-60 sm:w-72', img: 'h-14 sm:h-16', textSize: 'text-xs sm:text-sm', subtextSize: 'text-xs' },
    lg: { card: 'w-72 sm:w-84', img: 'h-18 sm:h-20', textSize: 'text-sm sm:text-base', subtextSize: 'text-xs sm:text-sm' },
    xl: { card: 'w-80 sm:w-96', img: 'h-22 sm:h-24', textSize: 'text-base sm:text-lg', subtextSize: 'text-xs sm:text-sm' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Keyframes de animação estritamente lineares */}
      <style>{`
        @keyframes wfLinearRunner {
          0% {
            left: -45%;
            width: 40%;
          }
          50% {
            left: 25%;
            width: 55%;
          }
          100% {
            left: 105%;
            width: 40%;
          }
        }
        @keyframes wfSubtleGlow {
          0%, 100% {
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          50% {
            box-shadow: 0 6px 28px 0px rgba(227, 0, 15, 0.15), 0 0 0 1px rgba(227, 0, 15, 0.2);
          }
        }
      `}</style>

      {/* BLOCO UNIFICADO LINEAR (Card + Barra Linear Integrada) */}
      <div 
        className={`${currentSize.card} rounded-xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden mb-5 transition-all duration-300`}
        style={{ animation: 'wfSubtleGlow 3s ease-in-out infinite' }}
      >
        {/* Espaço da Logo */}
        <div className="px-6 py-6 sm:py-7 flex items-center justify-center relative">
          <img
            src={wfLogo}
            alt="WorkFlow Logo"
            className={`${currentSize.img} w-auto object-contain drop-shadow-sm`}
          />

          {/* Badge linear de desconexão caso offline */}
          {status === 'offline' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              <WifiOff size={12} />
              <span>Offline</span>
            </div>
          )}
        </div>

        {/* BARRA DE PROGRESSO RETILÍNEA INTEGRADA À BASE DO CARD */}
        <div className="w-full h-1 sm:h-1.5 bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
          {status === 'loading' ? (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#E3000F] via-red-500 to-[#E3000F]"
              style={{
                animation: 'wfLinearRunner 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            />
          ) : (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
              style={{
                animation: 'wfLinearRunner 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            />
          )}
        </div>
      </div>

      {/* Título Principal Linear */}
      {text && (
        <h2 className={`font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100 ${currentSize.textSize} drop-shadow-sm`}>
          {text}
        </h2>
      )}

      {/* Subtítulo ou Mensagem de Conexão */}
      {subtext && (
        <p className={`mt-1 font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 max-w-md ${currentSize.subtextSize}`}>
          {subtext}
        </p>
      )}

      {/* Mensagem linear em caso offline */}
      {status === 'offline' && (
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-none bg-amber-500 animate-pulse" />
          <span>Tentando restabelecer conexão com o servidor...</span>
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
