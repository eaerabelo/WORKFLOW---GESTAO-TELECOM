import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Crown, Star, ChevronLeft, Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { applyCurrencyMask, getTodaySP } from '../utils/masks';

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

    // Dados de calendário e dias para cálculo de projeção e tendência (Run Rate)
    const trendData = useMemo(() => {
        const todayStr = getTodaySP();
        const [cyStr, cmStr, cdStr] = todayStr.split('-');
        const currentMonthIso = `${cyStr}-${cmStr}`;
        const isCurrentMonth = globalMonth === currentMonthIso;

        const [yStr, mStr] = String(globalMonth || '').split('-');
        const yy = parseInt(yStr, 10);
        const mm = parseInt(mStr, 10);
        if (!yy || !mm) return { isCurrentMonth: false, elapsedDays: 1, totalDays: 30, cd: 1 };

        const totalDays = new Date(yy, mm, 0).getDate();
        const cd = Math.max(1, parseInt(cdStr, 10));
        const elapsedDays = isCurrentMonth ? cd : totalDays;

        return { isCurrentMonth, elapsedDays, totalDays, cd };
    }, [globalMonth]);

    const calcTrend = (realizado, meta) => {
        const real = Number(realizado) || 0;
        const m = Number(meta) || 0;
        if (!trendData.isCurrentMonth || trendData.elapsedDays <= 0 || trendData.totalDays <= 0 || m <= 0) {
            return { hasTrend: false, projecao: real, tendenciaPct: m > 0 ? Math.round((real / m) * 100) : 0, ritmoDiario: 0 };
        }
        const ritmoDiario = real / trendData.elapsedDays;
        const projecao = ritmoDiario * trendData.totalDays;
        const tendenciaPct = Math.round((projecao / m) * 100);
        return { hasTrend: true, projecao, tendenciaPct, ritmoDiario };
    };

    const getTrendBadgeStyle = (pct) => {
        if (pct >= 100) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
        if (pct >= 80) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
    };

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
        const totalRealizadoLoja = storeMetrics[focusedIndicator.key] || 0;
        const metaLoja = Number(currentMonthMeta[focusedIndicator.metaKey]) || 0;
        const atingimentoLoja = metaLoja > 0 ? (totalRealizadoLoja / metaLoja) * 100 : 0;
        const trendLoja = calcTrend(totalRealizadoLoja, metaLoja);

        return (
            <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col relative">
                <button
                    onClick={() => setFocusedIndicator(null)}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors bg-white dark:bg-neutral-900 px-3.5 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 z-10 text-xs sm:text-sm font-bold"
                >
                    <ChevronLeft size={16} />
                    <span>Voltar aos Indicadores</span>
                </button>

                <div className="max-w-4xl mx-auto w-full mt-14 sm:mt-12 md:mt-0">
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100 flex items-center justify-center gap-2 sm:gap-3">
                            <Target className="text-[#E3000F] shrink-0" size={28} />
                            <span>RANKING: {focusedIndicator.label}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">Classificação completa da equipe e projeção de fechamento</p>
                    </div>

                    {/* Resumo Consolidado com Projeção e Tendência da Loja */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-[#E3000F]" /> Consolidado da Loja
                            </span>
                            {trendData.isCurrentMonth && (
                                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                                    Dia {trendData.elapsedDays} de {trendData.totalDays} ({Math.round((trendData.elapsedDays / trendData.totalDays) * 100)}% do mês)
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Realizado</span>
                                <span className="text-base sm:text-xl font-black text-neutral-900 dark:text-white">
                                    {renderValue(totalRealizadoLoja, focusedIndicator.isCurrency)}
                                </span>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Meta Loja</span>
                                <span className="text-base sm:text-xl font-bold text-neutral-700 dark:text-neutral-200">
                                    {renderValue(metaLoja, focusedIndicator.isCurrency)}
                                </span>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Projeção Mês</span>
                                <span className="text-base sm:text-xl font-black text-neutral-900 dark:text-white">
                                    {trendLoja.hasTrend ? renderValue(trendLoja.projecao, focusedIndicator.isCurrency) : renderValue(totalRealizadoLoja, focusedIndicator.isCurrency)}
                                </span>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center">
                                <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Tendência</span>
                                <span className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded border mt-0.5 ${getTrendBadgeStyle(trendLoja.tendenciaPct)}`}>
                                    {trendLoja.tendenciaPct}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
                        {ranking.length === 0 ? (
                            <div className="text-center p-8 text-neutral-500">Nenhuma venda registrada neste indicador.</div>
                        ) : (
                            ranking.map((seller, index) => {
                                const isTop1 = index === 0;
                                const isTop2 = index === 1;
                                const isTop3 = index === 2;

                                const indMetaStore = Number(currentMonthMeta[focusedIndicator.metaKey]) || 0;
                                const indMetaIndividual = indMetaStore / activeSellersCount;
                                const valReal = seller[focusedIndicator.key] || 0;
                                const atingimento = indMetaIndividual > 0 ? (valReal / indMetaIndividual) * 100 : 0;
                                const sellerTrend = calcTrend(valReal, indMetaIndividual);

                                const percentage = indMetaIndividual > 0
                                    ? Math.min(100, Math.max(5, atingimento))
                                    : Math.max(5, (valReal / maxVal) * 100);

                                return (
                                    <div key={seller.nomeCompleto} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/20 flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-6 shrink-0 font-black text-sm text-center">
                                                    {isTop1 ? <Crown size={18} className="text-yellow-500 inline" /> :
                                                        isTop2 ? <Medal size={18} className="text-gray-400 inline" /> :
                                                            isTop3 ? <Medal size={18} className="text-amber-600 inline" /> :
                                                                <span className="text-neutral-400 text-xs">{index + 1}º</span>}
                                                </div>
                                                <span className={`font-bold text-sm truncate ${isTop1 ? 'text-yellow-600 dark:text-yellow-500' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                    {seller.nomeCompleto}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-black text-base sm:text-lg text-neutral-800 dark:text-neutral-100">
                                                    {renderValue(valReal, focusedIndicator.isCurrency)}
                                                </span>
                                                {indMetaIndividual > 0 && (
                                                    <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${atingimento >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                                        {atingimento.toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${atingimento >= 100 ? 'bg-green-500' : isTop1 ? 'bg-yellow-500' : 'bg-[#E3000F]'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        {sellerTrend.hasTrend && (
                                            <div className="flex flex-wrap items-center justify-between text-[9.5px] sm:text-[10px] text-neutral-400 dark:text-neutral-500 font-medium pt-1">
                                                <span>Projeção: <strong className="text-neutral-700 dark:text-neutral-300 font-bold">{renderValue(sellerTrend.projecao, focusedIndicator.isCurrency)}</strong></span>
                                                <span className={`font-bold px-1.5 py-0.5 rounded border ${getTrendBadgeStyle(sellerTrend.tendenciaPct)}`}>
                                                    Tendência: {sellerTrend.tendenciaPct}%
                                                </span>
                                            </div>
                                        )}
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
                        const indMetaStore = Number(currentMonthMeta[ind.metaKey]) || 0;
                        const valorRealLoja = storeMetrics[ind.key] || 0;
                        const trendLoja = calcTrend(valorRealLoja, indMetaStore);

                        return (
                            <div
                                key={ind.key}
                                onClick={() => setFocusedIndicator(ind)}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 hover:border-[#E3000F]/50 dark:hover:border-[#E3000F]/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-lg group-hover:text-[#E3000F] transition-colors">{ind.label}</h3>
                                    <div className="flex items-center gap-1.5">
                                        {trendLoja.hasTrend && (
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getTrendBadgeStyle(trendLoja.tendenciaPct)}`} title={`Projeção: ${renderValue(trendLoja.projecao, ind.isCurrency)}`}>
                                                {trendLoja.tendenciaPct}%
                                            </span>
                                        )}
                                        <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Trophy size={13} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-3">
                                    {ranking.length === 0 ? (
                                        <div className="text-sm text-neutral-400 italic text-center py-4">Sem vendas</div>
                                    ) : (
                                        ranking.map((seller, idx) => {
                                            const indMetaIndividual = indMetaStore / activeSellersCount;
                                            const valRealSeller = seller[ind.key] || 0;
                                            const atingimento = indMetaIndividual > 0 ? (valRealSeller / indMetaIndividual) * 100 : 0;
                                            const sellerTrend = calcTrend(valRealSeller, indMetaIndividual);

                                            return (
                                                <div key={seller.primeiroNome} className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {idx === 0 ? (
                                                            <Crown size={16} className="text-yellow-500 shrink-0" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-neutral-400 w-4 text-center shrink-0">{idx + 1}º</span>
                                                        )}
                                                        <span className={`text-sm font-bold truncate ${idx === 0 ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                                            {seller.primeiroNome}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {sellerTrend.hasTrend ? (
                                                            <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border ${getTrendBadgeStyle(sellerTrend.tendenciaPct)}`} title={`Projeção: ${renderValue(sellerTrend.projecao, ind.isCurrency)}`}>
                                                                {sellerTrend.tendenciaPct}%
                                                            </span>
                                                        ) : indMetaIndividual > 0 ? (
                                                            <span className={`text-[10px] font-bold ${atingimento >= 100 ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                                {atingimento.toFixed(0)}%
                                                            </span>
                                                        ) : null}
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                                            {renderValue(valRealSeller, ind.isCurrency)}
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
                <div className="mt-12 mb-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                            <Target className="text-[#E3000F]" /> LOJA - INDICADORES COM PROJEÇÃO & TENDENCIAMENTO
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
                            Desempenho total da loja, projeção de fechamento no mês e tendência linear por dia.
                        </p>
                    </div>
                    {trendData.isCurrentMonth && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold shrink-0 flex items-center gap-2">
                            <Calendar size={14} className="text-[#E3000F]" />
                            <span>Dia {trendData.elapsedDays} de {trendData.totalDays}</span>
                            <span className="text-neutral-400 dark:text-neutral-500 font-normal">({Math.round((trendData.elapsedDays / trendData.totalDays) * 100)}% decorrido)</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {INDICATORS.map(ind => {
                        const indMetaStore = Number(currentMonthMeta[ind.metaKey]) || 0;
                        const valorRealizado = storeMetrics[ind.key] || 0;
                        const atingimento = indMetaStore > 0 ? (valorRealizado / indMetaStore) * 100 : 0;
                        const trendLoja = calcTrend(valorRealizado, indMetaStore);

                        return (
                            <div
                                key={`loja_${ind.key}`}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm flex flex-col h-full hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-base sm:text-lg">{ind.label}</h3>
                                    {trendLoja.hasTrend && (
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${getTrendBadgeStyle(trendLoja.tendenciaPct)}`}>
                                            {trendLoja.tendenciaPct}% Tend.
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-end gap-3">
                                    <div className="grid grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                        <div>
                                            <div className="text-[9.5px] font-bold text-neutral-400 uppercase">Realizado</div>
                                            <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white truncate">
                                                {renderValue(valorRealizado, ind.isCurrency)}
                                            </div>
                                        </div>
                                        {indMetaStore > 0 && (
                                            <div className="text-right">
                                                <div className="text-[9.5px] font-bold text-neutral-400 uppercase">Meta</div>
                                                <div className="text-base sm:text-lg font-bold text-neutral-600 dark:text-neutral-300 truncate">
                                                    {renderValue(indMetaStore, ind.isCurrency)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {indMetaStore > 0 && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1 text-[11px]">
                                                <span className="font-bold text-neutral-500">Atingimento Atual</span>
                                                <span className={`font-black ${atingimento >= 100 ? 'text-green-600 dark:text-green-500' : 'text-[#E3000F]'}`}>
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

                                    {trendLoja.hasTrend && (
                                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-neutral-500 dark:text-neutral-400 font-semibold text-[11px]">Projeção Mês</span>
                                                <strong className="text-neutral-900 dark:text-white font-black text-sm">
                                                    {renderValue(trendLoja.projecao, ind.isCurrency)}
                                                </strong>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                                <span>Ritmo Diário</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">
                                                    {renderValue(trendLoja.ritmoDiario, ind.isCurrency)}/dia
                                                </span>
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
