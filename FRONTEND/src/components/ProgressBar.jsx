import React from 'react';
import { applyCurrencyMask } from '../utils/masks';

export const ProgressBar = ({ label, realizado, meta, isDark = false, isCurrency = false, elapsedDays = null, totalDays = null, isCurrentMonth = true }) => {
    const metaVal = Number(meta) || 0;
    const realVal = Number(realizado) || 0;
    const displayPct = metaVal > 0 ? Math.round((realVal / metaVal) * 100) : 0;
    const barPct = Math.min(displayPct, 100);

    // Cálculo Matemático de Tendência de Meta (Run Rate):
    // Ritmo Diário = Realizado / Dias Corridos
    // Projeção Mês = Ritmo Diário * Total de Dias do Mês
    // % Tendência = (Projeção / Meta) * 100
    const hasTrendCalc = isCurrentMonth !== false && elapsedDays && totalDays && elapsedDays > 0 && totalDays > 0 && metaVal > 0;
    const ritmoDiario = hasTrendCalc ? (realVal / elapsedDays) : 0;
    const projecaoVal = hasTrendCalc ? (ritmoDiario * totalDays) : realVal;
    const tendenciaPct = hasTrendCalc ? Math.round((projecaoVal / metaVal) * 100) : displayPct;
    const formattedProjecao = isCurrency ? applyCurrencyMask(projecaoVal) : Math.round(projecaoVal);
    const formattedRitmo = isCurrency ? applyCurrencyMask(ritmoDiario) : (Number.isInteger(ritmoDiario) ? ritmoDiario : ritmoDiario.toFixed(1));
    
    const bgBar = isDark ? 'bg-neutral-800 dark:bg-neutral-700' : 'bg-neutral-100 dark:bg-neutral-800';
    const fillBar = displayPct >= 100 ? 'bg-green-500' : 'bg-[#E3000F]';
    const textMain = isDark ? 'text-white' : 'text-neutral-800 dark:text-neutral-100';
    const textSub = isDark ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400';
    
    const formattedRealizado = isCurrency ? applyCurrencyMask(realVal) : realVal;
    const formattedMeta = isCurrency ? applyCurrencyMask(metaVal) : (Number.isInteger(metaVal) ? metaVal : metaVal.toFixed(1));

    const trendBadgeColor = tendenciaPct >= 100
        ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60')
        : tendenciaPct >= 80
            ? (isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60')
            : (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60');

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1.5 gap-1.5 sm:gap-2 min-w-0">
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider leading-tight min-w-0 flex-1 break-words ${textSub}`}>{label}</span>
                <div className="text-right shrink-0 flex items-baseline justify-end flex-wrap gap-y-1">
                    <span className={`text-base sm:text-2xl font-black leading-none ${textMain}`}>{formattedRealizado}</span>
                    <span className={`text-[11px] sm:text-sm font-bold ml-1 sm:ml-1.5 ${textSub}`}>/ {formattedMeta}</span>
                    <span className={`text-[10px] sm:text-xs font-bold ml-1.5 sm:ml-2 px-1.5 py-0.5 rounded-md ${displayPct >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-[#E3000F] dark:bg-red-900/30 dark:text-red-400'}`}>
                        {displayPct}%
                    </span>
                </div>
            </div>
            <div className={`w-full ${bgBar} rounded-full h-2 overflow-hidden`}>
                <div className={`${fillBar} h-full rounded-full transition-all duration-1000`} style={{ width: `${barPct}%` }}></div>
            </div>
            {hasTrendCalc && (
                <div className="flex flex-wrap items-center justify-between mt-1.5 gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 min-w-0 truncate">
                        <span>Projeção:</span>
                        <strong className="text-neutral-800 dark:text-neutral-100 font-black">{formattedProjecao}</strong>
                        <span className="text-[8.5px] sm:text-[9.5px] text-neutral-400 dark:text-neutral-500 font-normal">
                            (Dia {elapsedDays}/{totalDays} • {formattedRitmo}/dia)
                        </span>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${trendBadgeColor}`}>
                        Tendência: {tendenciaPct}%
                    </span>
                </div>
            )}
        </div>
    );
};