import React from 'react';
import { applyCurrencyMask } from '../utils/masks';

export const ProgressBar = ({ label, realizado, meta, isDark = false, isCurrency = false }) => {
    const metaVal = Number(meta) || 0;
    const displayPct = metaVal > 0 ? Math.round((realizado / metaVal) * 100) : 0;
    const barPct = Math.min(displayPct, 100);
    
    const bgBar = isDark ? 'bg-neutral-800 dark:bg-neutral-700' : 'bg-neutral-100 dark:bg-neutral-800';
    const fillBar = displayPct >= 100 ? 'bg-green-500' : 'bg-[#E3000F]';
    const textMain = isDark ? 'text-white' : 'text-neutral-800 dark:text-neutral-100';
    const textSub = isDark ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400';
    
    const formattedRealizado = isCurrency ? applyCurrencyMask(realizado) : realizado;
    const formattedMeta = isCurrency ? applyCurrencyMask(metaVal) : (Number.isInteger(metaVal) ? metaVal : metaVal.toFixed(1));

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1.5 gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>{label}</span>
                <div className="text-right shrink-0 flex items-baseline justify-end">
                    <span className={`text-2xl font-black ${textMain}`}>{formattedRealizado}</span>
                    <span className={`text-sm font-bold ml-1.5 ${textSub}`}>/ {formattedMeta}</span>
                    <span className={`text-xs font-bold ml-2 px-1.5 py-0.5 rounded-md ${displayPct >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-[#E3000F] dark:bg-red-900/30 dark:text-red-400'}`}>
                        {displayPct}%
                    </span>
                </div>
            </div>
            <div className={`w-full ${bgBar} rounded-full h-2 overflow-hidden`}>
                <div className={`${fillBar} h-full rounded-full transition-all duration-1000`} style={{ width: `${barPct}%` }}></div>
            </div>
        </div>
    );
};