import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Crown, Star, ChevronLeft, Target } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';

export const Indicadores = ({ salesData = [], usersDB = {}, globalMonth, goalsDB = {} }) => {
    const [focusedIndicator, setFocusedIndicator] = useState(null);

    const INDICATORS = [
        { key: 'receita', label: 'RECEITA (R$)', isCurrency: true, metaKey: 'receita' },
        { key: 'gross', label: 'GROSS TOTAL', metaKey: 'posTotal' },
        { key: 'posTotal', label: 'PÓS-PAGO', metaKey: 'posPago' },
        { key: 'controleTotal', label: 'CONTROLE', metaKey: 'controle' },
        { key: 'urTotal', label: 'UR TOTAL', metaKey: 'urTotal' },
        { key: 'fibra', label: 'FIBRA', metaKey: 'fibra' },
        { key: 'tv', label: 'TV+', metaKey: 'tv' },
        { key: 'aparelho', label: 'APARELHO', metaKey: 'aparelho' },
        { key: 'acessorio', label: 'ACESSÓRIO', metaKey: 'acessorio' },
        { key: 'seguro', label: 'SEGURO', metaKey: 'seguro' },
        { key: 'pelicula', label: 'PELÍCULA', metaKey: 'pelicula' },
        { key: 'mplay', label: 'M-PLAY', metaKey: 'mplay' }
    ];

    const currentMonthMeta = useMemo(() => {
        return goalsDB[globalMonth] || {};
    }, [goalsDB, globalMonth]);

    const activeSellersCount = useMemo(() => {
        const count = Object.values(usersDB || {}).filter(u => !u?.role || u?.role === 'VENDEDOR').length;
        return count > 0 ? count : 1;
    }, [usersDB]);

    const currentMonthSales = useMemo(() => {
        if (!salesData || !globalMonth) return [];
        return salesData.filter(s => {
            if (typeof s.data !== 'string') return false;
            if (s.data.includes('/')) {
                const parts = s.data.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1]}` === globalMonth;
            }
            if (s.data.includes('-')) return s.data.slice(0, 7) === globalMonth;
            return false;
        });
    }, [salesData, globalMonth]);

    const metricsByVendedor = useMemo(() => {
        if (!currentMonthSales.length) return [];

        const sellerMap = {};

        currentMonthSales.forEach(sale => {
            const v = sale.vendedor;
            if (!v) return;

            if (!sellerMap[v]) {
                sellerMap[v] = {
                    nomeCompleto: v,
                    primeiroNome: v,
                    receita: 0,
                    gross: 0,
                    posTotal: 0,
                    controleTotal: 0,
                    urTotal: 0,
                    fibra: 0,
                    tv: 0,
                    aparelho: 0,
                    acessorio: 0,
                    pelicula: 0,
                    seguro: 0,
                    mplay: 0
                };
            }

            let valString = sale.receita !== undefined ? sale.receita : sale.valor_total;
            if (typeof valString === 'string') {
                if (valString.includes(',')) {
                    valString = valString.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
                } else {
                    valString = valString.replace(/R\$\s?/, '');
                }
            }
            let receitaNum = Number(valString || 0);
            if (isNaN(receitaNum)) receitaNum = 0;
            sellerMap[v].receita += receitaNum;

            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, bl = 0, flex = 0;
            let migracaoPos = 0, migracaoControle = 0, grossPme = 0, urPme = 0;
            let fibra = 0, tv = 0, tvBox = 0, fixo = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0, mplay = 0;

            const pBase = String(sale.produto || '').toUpperCase();
            const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
            const op = String(sale.operacao || '').toUpperCase();
            const sub = String(sale.subProduto || '').toUpperCase();

            if (pBase.includes('PME') && !pBase.includes('FIBRA')) { grossPme += q; }
            else if (pBase.includes('PÓS') || pBase.includes('POS')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q; else posTt += q; }
            else if (pBase.includes('CONTROLE')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else controle += q; }
            else if (pBase.includes('FLEX')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else flex += q; }
            else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) { if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q; else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA')) depBl += q; else depPg += q; }
            else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('NET VIRTUA')) bl += q;
            else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
            else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
            else if (pBase.includes('TV-BOX')) tvBox += q;
            else if (pBase.includes('TV+') || pBase.includes('TV')) tv += q;
            else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
            else if (pBase.includes('APARELHO')) { aparelho += q; }
            else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; }
            else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; }
            else if (pBase.includes('SEGURO')) seguro += q;

            if (sale.mplay === 'SIM') mplay += 1;

            sellerMap[v].gross += (posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
            sellerMap[v].urTotal += (fibra + tv + tvBox + fixo + urPme);
            sellerMap[v].posTotal += (posTt + migracaoPos);
            sellerMap[v].controleTotal += (controle + migracaoControle);
            sellerMap[v].fibra += (fibra + bl);
            sellerMap[v].tv += (tv + tvBox);
            sellerMap[v].aparelho += aparelho;
            sellerMap[v].acessorio += acessorio;
            sellerMap[v].pelicula += pelicula;
            sellerMap[v].seguro += seguro;
            sellerMap[v].mplay += mplay;
        });

        return Object.values(sellerMap);
    }, [salesData, globalMonth]);

    const storeMetrics = useMemo(() => {
        const result = {
            receita: 0, gross: 0, posTotal: 0, controleTotal: 0, urTotal: 0,
            fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
        };
        currentMonthSales.forEach(sale => {
            let valString = sale.receita !== undefined ? sale.receita : sale.valor_total;
            if (typeof valString === 'string') {
                if (valString.includes(',')) {
                    valString = valString.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
                } else {
                    valString = valString.replace(/R\$\s?/, '');
                }
            }
            let receitaNum = Number(valString || 0);
            if (isNaN(receitaNum)) receitaNum = 0;
            result.receita += receitaNum;

            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subProduto || '').toUpperCase();

            let isGross = false, isPos = false, isControle = false;

            if (pBase.includes('PME') && !pBase.includes('FIBRA')) {
                isGross = true;
            } else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                isGross = true;
                isPos = true;
            } else if (pBase.includes('CONTROLE')) {
                isGross = true;
                isControle = true;
            } else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                isGross = true;
            } else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('NET VIRTUA')) {
                isGross = true;
            } else if (pBase.includes('FLEX')) {
                isGross = true;
            } else if (pBase.includes('FIBRA')) {
                result.fibra += q;
                result.urTotal += q;
            } else if (pBase.includes('TV') && !pBase.includes('TV BOX') && !pBase.includes('TV-BOX')) {
                result.tv += q;
                result.urTotal += q;
            } else if (pBase.includes('APARELHO')) {
                result.aparelho += q;
            } else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) {
                result.acessorio += q;
            } else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) {
                result.pelicula += q;
            } else if (pBase.includes('SEGURO')) {
                result.seguro += q;
            } else if (pBase.includes('M-PLAY') || pBase.includes('MPLAY')) {
                result.mplay += q;
            }

            if (isGross) result.gross += q;
            if (isPos) result.posTotal += q;
            if (isControle) result.controleTotal += q;
        });
        return result;
    }, [currentMonthSales]);

    const getRankedSellers = (key) => {
        return [...metricsByVendedor]
            .filter(v => v[key] > 0)
            .sort((a, b) => b[key] - a[key]);
    };

    const renderValue = (value, isCurrency) => {
        if (isCurrency) return applyCurrencyMask(value);
        return Number.isInteger(value) ? value : value.toFixed(1);
    };

    if (focusedIndicator) {
        const ranking = getRankedSellers(focusedIndicator.key);
        const maxVal = ranking[0]?.[focusedIndicator.key] || 1;

        return (
            <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col relative">
                <button
                    onClick={() => setFocusedIndicator(null)}
                    className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 z-10"
                >
                    <ChevronLeft size={18} />
                    <span className="font-bold text-sm">Voltar ao Grid</span>
                </button>

                <div className="max-w-4xl mx-auto w-full mt-14 md:mt-0">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-neutral-800 dark:text-neutral-100 flex items-center justify-center gap-3">
                            <Target className="text-[#E3000F]" size={32} />
                            RANKING: {focusedIndicator.label}
                        </h2>
                        <p className="text-neutral-500 mt-2">Classificação completa da equipe no mês atual</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col gap-4">
                        {ranking.length === 0 ? (
                            <div className="text-center p-8 text-neutral-500">Nenhuma venda registrada neste indicador.</div>
                        ) : (
                            ranking.map((seller, index) => {
                                const isTop1 = index === 0;
                                const isTop2 = index === 1;
                                const isTop3 = index === 2;
                                
                                const indMetaStore = Number(currentMonthMeta[focusedIndicator.metaKey]) || 0;
                                const indMetaIndividual = indMetaStore / activeSellersCount;
                                const atingimento = indMetaIndividual > 0 ? (seller[focusedIndicator.key] / indMetaIndividual) * 100 : 0;
                                
                                // O valor de percentage define a barra. Se a meta individual existe, usamos o atingimento.
                                // Caso contrário, usamos a proporção em relação ao melhor vendedor.
                                const percentage = indMetaIndividual > 0 
                                    ? Math.min(100, Math.max(5, atingimento))
                                    : Math.max(5, (seller[focusedIndicator.key] / maxVal) * 100);

                                return (
                                    <div key={seller.nomeCompleto} className="flex items-center gap-4 group">
                                        <div className="w-8 shrink-0 font-black text-lg text-right">
                                            {isTop1 ? <Crown size={24} className="text-yellow-500 ml-auto" /> :
                                                isTop2 ? <Medal size={24} className="text-gray-400 ml-auto" /> :
                                                    isTop3 ? <Medal size={24} className="text-amber-600 ml-auto" /> :
                                                        <span className="text-neutral-400">{index + 1}º</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className={`font-bold ${isTop1 ? 'text-yellow-600 dark:text-yellow-500' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                    {seller.nomeCompleto}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    {indMetaIndividual > 0 && (
                                                        <span className={`text-xs font-bold ${atingimento >= 100 ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                            {atingimento.toFixed(1)}% da meta
                                                        </span>
                                                    )}
                                                    <span className="font-black text-lg text-neutral-800 dark:text-neutral-100">
                                                        {renderValue(seller[focusedIndicator.key], focusedIndicator.isCurrency)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${atingimento >= 100 ? 'bg-green-500' : isTop1 ? 'bg-yellow-500' : 'bg-[#E3000F]'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100">Destaques por Indicador</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Ranking dos Top 3 vendedores em cada métrica no mês atual. Clique num indicador para ver a lista completa.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {INDICATORS.map(ind => {
                        const ranking = getRankedSellers(ind.key).slice(0, 3);
                        return (
                            <div
                                key={ind.key}
                                onClick={() => setFocusedIndicator(ind)}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 hover:border-[#E3000F]/50 dark:hover:border-[#E3000F]/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-lg group-hover:text-[#E3000F] transition-colors">{ind.label}</h3>
                                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trophy size={14} />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-3">
                                    {ranking.length === 0 ? (
                                        <div className="text-sm text-neutral-400 italic text-center py-4">Sem vendas</div>
                                    ) : (
                                        ranking.map((seller, idx) => {
                                            const indMetaStore = Number(currentMonthMeta[ind.metaKey]) || 0;
                                            const indMetaIndividual = indMetaStore / activeSellersCount;
                                            const atingimento = indMetaIndividual > 0 ? (seller[ind.key] / indMetaIndividual) * 100 : 0;
                                            
                                            return (
                                                <div key={seller.primeiroNome} className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2">
                                                        {idx === 0 ? (
                                                            <Crown size={16} className="text-yellow-500" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-neutral-400 w-4 text-center">{idx + 1}º</span>
                                                        )}
                                                        <span className={`text-sm font-bold ${idx === 0 ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                                            {seller.primeiroNome}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {indMetaIndividual > 0 && (
                                                            <span className={`text-[10px] font-bold ${atingimento >= 100 ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                                {atingimento.toFixed(0)}%
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                                            {renderValue(seller[ind.key], ind.isCurrency)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- SEÇÃO LOJA --- */}
                <div className="mt-12 mb-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                        <Target className="text-[#E3000F]" /> LOJA - INDICADORES
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Desempenho total da loja em relação à meta cadastrada.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {INDICATORS.map(ind => {
                        const indMetaStore = Number(currentMonthMeta[ind.metaKey]) || 0;
                        const valorRealizado = storeMetrics[ind.key] || 0;
                        const atingimento = indMetaStore > 0 ? (valorRealizado / indMetaStore) * 100 : 0;
                        
                        return (
                            <div
                                key={`loja_${ind.key}`}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm flex flex-col h-full"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-lg">{ind.label}</h3>
                                </div>

                                <div className="flex-1 flex flex-col justify-end gap-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-xs font-bold text-neutral-400 uppercase">Realizado</div>
                                            <div className="text-2xl font-black text-neutral-900 dark:text-white">
                                                {renderValue(valorRealizado, ind.isCurrency)}
                                            </div>
                                        </div>
                                        {indMetaStore > 0 && (
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-neutral-400 uppercase">Meta</div>
                                                <div className="text-lg font-bold text-neutral-600 dark:text-neutral-300">
                                                    {renderValue(indMetaStore, ind.isCurrency)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {indMetaStore > 0 && (
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-neutral-500">Atingimento</span>
                                                <span className={`text-xs font-black ${atingimento >= 100 ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                    {atingimento.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${atingimento >= 100 ? 'bg-green-500' : 'bg-[#E3000F]'}`}
                                                    style={{ width: `${Math.min(100, atingimento)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
