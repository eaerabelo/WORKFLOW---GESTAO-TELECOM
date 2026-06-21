import React, { useState, useEffect } from 'react';
import { Calculator, User, DollarSign, Target, TrendingUp, AlertCircle, Award, Lock, CheckCircle2 } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';
import { aplicarRegrasDeProduto, calcularFatorRV } from '../rules.js';

export const FatorRvv = ({ globalUser, salesData = [], goalsDB = {}, usersDB = {}, globalMonth }) => {
    const isVendedor = globalUser?.role === 'VENDEDOR';
    const loggedName = String(globalUser?.name || '').split(' ')[0];

    const safeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || '').split(' ')[0])
        .filter(Boolean);

    const allUsers = Object.values(usersDB || {})
        .filter(u => u?.role !== 'SUSPENDER')
        .map(u => String(u?.name || '').split(' ')[0])
        .filter(Boolean);
        
    const historicalUsers = (salesData || []).map(s => String(s.vendedor || '').split(' ')[0]).filter(Boolean);
    const uniqueSelectableUsers = [...new Set([...allUsers, ...historicalUsers])].sort();

    const [selectedSeller, setSelectedSeller] = useState(loggedName);
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!selectedSeller) {
            setMetrics(null);
            return;
        }
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            
            const selectedUserObj = Object.values(usersDB || {}).find(u => String(u?.name || '').split(' ')[0] === selectedSeller);
            const selectedUserRole = selectedUserObj?.role || 'VENDEDOR';
            const isStoreLevelRole = ['GERENTE', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(selectedUserRole);

            const activeMetas = (goalsDB || {})[globalMonth] || METAS_PADRAO || {};
            const numSellers = safeVendedores.length || 1;
            const divisor = isStoreLevelRole ? 1 : numSellers;

            // 1. Isola as vendas do mês
            const monthSales = salesData.filter(s => {
                if (typeof s.data !== 'string') return false;
                if (s.data.includes('/')) {
                    const parts = s.data.split('/');
                    if (parts.length === 3) return `${parts[2]}-${parts[1]}` === globalMonth;
                }
                if (s.data.includes('-')) return s.data.slice(0, 7) === globalMonth;
                return false;
            });

            // 2. Isola as vendas baseadas no perfil (Líderes herdam a produção da loja)
            const sellerSales = isStoreLevelRole 
                ? monthSales 
                : monthSales.filter(s => s.vendedor === selectedSeller || s.vendedor === String(selectedSeller || '').split(' ')[0]);

            let sellerTotalReceita = 0;
            let volMplay = 0;
            sellerSales.forEach(s => {
                sellerTotalReceita += Number(s.valorBruto || s.receita) || 0;
                if (s.mplay === 'SIM') volMplay += 1;
            });

            const metaReceita = (Number(activeMetas.receita) || 0) / divisor;
            const metaMplay = Math.ceil((Number(activeMetas.mplay) || 0) / divisor);

            // 3. Calcula o Fator Multiplicador baseado no atingimento INDIVIDUAL
            const pctAtingimentoMplay = metaMplay > 0 ? (volMplay / metaMplay) * 100 : (volMplay > 0 ? 100 : 0);

            let fatorMultiplicador = 1.2;
            if (pctAtingimentoMplay >= 160.00) fatorMultiplicador = 1.8;
            else if (pctAtingimentoMplay >= 130.00) fatorMultiplicador = 1.6;
            else if (pctAtingimentoMplay >= 100.00) fatorMultiplicador = 1.4;

            let totalReceita = 0;
            let totalVendas = sellerSales.length;
            let totalPos = 0;
            let totalUr = 0;
            let volPosPago = 0;
            let volFibra = 0;
            let volTv = 0;
            let volPortabilidade = 0;
            let volMulti = 0;
            let volPme = 0;
            let volAparelho = 0;
            let volSeguro = 0;
            let volAcessorio = 0;
            let receitaAcessorio = 0;
            let volBlPme = 0;

            try {
                // Cálculo local usando o rules.js
                const resultados = sellerSales.map(sale => ({
                    id: sale.id,
                    receitaBase: aplicarRegrasDeProduto(sale, { pctAtingimentoMplay })
                }));

                let totalComissao = 0;
                let comissaoAparelho = 0;
                let comissaoSeguro = 0;

                sellerSales.forEach((sale) => {
                    const resApi = (resultados || []).find(r => r.id === sale.id);
                    const receitaBase = resApi ? resApi.receitaBase : 0;

                    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
                    const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                    const combo = String(sale.combo || '').toUpperCase();
                    const port = String(sale.portabilidade || '').toUpperCase();
                    
                    if (port === 'SIM') volPortabilidade += q;
                    if (combo.includes('MULTI')) volMulti += q;
                    if (pBase.includes('PME')) volPme += q;

                    if (pBase.includes('APARELHO')) {
                        volAparelho += q;
                        comissaoAparelho += receitaBase;
                    }
                    if (pBase.includes('SEGURO')) {
                        volSeguro += q;
                        comissaoSeguro += receitaBase;
                    }

                    if (pBase.includes('ACESSORIO') || pBase.includes('ACESSÓRIO')) {
                        volAcessorio += q;
                        receitaAcessorio += Number(sale.valorBruto || sale.receita) || 0;
                    }
                    if (pBase.includes('FIBRA PME') || pBase.includes('UR PME') || pBase.includes('BL PME')) {
                        volBlPme += q;
                    }

                    if ((pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || pBase.includes('FLEX') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('PME') && pBase !== 'PME') {
                        totalPos += q;
                    }
                    
                    if (pBase.includes('FIBRA') || pBase.includes('TV') || pBase.includes('FIXO') || pBase.includes('MESH')) {
                        totalUr += q;
                    }
                    
                    if ((pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('PME') && pBase !== 'PME') {
                        volPosPago += q;
                    }
                    if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) {
                        volFibra += q;
                    }
                    if (pBase.includes('CLARO TV+') || pBase.includes('TV')) {
                        volTv += q;
                    }

                    totalReceita += Number(sale.valorBruto || sale.receita) || 0;
                    totalComissao += receitaBase;
                });

                const metaPos = (Number(activeMetas.posTotal) || 0) / divisor;
                const metaUr = (Number(activeMetas.urTotal) || 0) / divisor;
                
                const metaPosPago = Math.ceil((Number(activeMetas.posPago) || 0) / divisor);
                const metaFibra = Math.ceil((Number(activeMetas.fibra) || 0) / divisor);
                const metaTv = Math.ceil((Number(activeMetas.tv) || 0) / divisor);

                const metaAparelho = Math.ceil((Number(activeMetas.aparelho) || 0) / divisor);
                const metaAcessorio = Math.ceil((Number(activeMetas.acessorio) || 0) / divisor);
                const metaTmAcessorio = Number(activeMetas.tmAcessorio) || 120;
                const metaBlPme = Math.ceil((Number(activeMetas.blPme) || 1) / divisor);

                const pctAtingimento = metaReceita > 0 ? (totalComissao / metaReceita) * 100 : 0;
                const pctAtingimentoPos = metaPos > 0 ? (totalPos / metaPos) * 100 : 0;
                const pctAtingimentoUr = metaUr > 0 ? (totalUr / metaUr) * 100 : 0;

                const pctAtingimentoAparelho = metaAparelho > 0 ? (volAparelho / metaAparelho) * 100 : (volAparelho > 0 ? 100 : 0);
                const pctAtingimentoAcessorio = metaAcessorio > 0 ? (volAcessorio / metaAcessorio) * 100 : (volAcessorio > 0 ? 100 : 0);
                const tmAcessorio = volAcessorio > 0 ? (receitaAcessorio / volAcessorio) : 0;
                const pctAtingimentoTmAcessorio = metaTmAcessorio > 0 ? (tmAcessorio / metaTmAcessorio) * 100 : (tmAcessorio > 0 ? 100 : 0);
                const pctAtingimentoBlPme = metaBlPme > 0 ? (volBlPme / metaBlPme) * 100 : (volBlPme > 0 ? 100 : 0);

                // Pede o Fator RV Final calculando localmente
                const metricasExtras = {
                    totalVendas, pctAtingimentoPos, pctAtingimentoUr, notaNps: 0,
                    volPosPago, metaPosPago, volFibra, metaFibra, volTv, metaTv,
                    pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme
                };
                const resultRV = calcularFatorRV(pctAtingimento, totalComissao, metricasExtras);

                if (isMounted) {
                    setMetrics({
                        totalReceita, totalComissao, totalVendas, totalPos, totalUr,
                        metaReceita, metaPos, metaUr, pctAtingimento, pctAtingimentoPos, pctAtingimentoUr,
                        pctAtingimentoMplay, volMplay, metaMplay,
                        previaPagamento: resultRV.previaPagamento,
                        fatorSimulado: resultRV.fatorAplicado,
                        elegivel: resultRV.elegivel,
                        bonusUnitario: resultRV.bonusUnitario,
                        fatorMultiplicador, volPortabilidade, volMulti, volPme,
                        volAparelho, comissaoAparelho, volSeguro, comissaoSeguro,
                        pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme,
                        volAcessorio, receitaAcessorio,
                        isStoreLevelRole, selectedUserRole
                    });
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Erro ao calcular métricas com a API:", error);
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [salesData, selectedSeller, globalMonth, goalsDB, safeVendedores.length, isVendedor]);

    if (globalUser?.role === 'JOVEM APRENDIZ') {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Indisponível</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">O perfil de Jovem Aprendiz não possui regras de Remuneração Variável (RV) atreladas no sistema.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            {/* Cabeçalho */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-neutral-900 rounded-t-2xl shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Painel Fator RV <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-[#E3000F] px-2 py-0.5 rounded-full uppercase tracking-wider">{"modo demo"}</span></h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Prévia de Remuneração Variável e Atingimento.</p>
                    </div>
                </div>
                
                {/* Seletor de Vendedor para Gestão */}
                <div className="w-full md:w-auto flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <User size={18} className="text-neutral-500 ml-2 shrink-0" />
                    <select 
                        value={selectedSeller} 
                        onChange={(e) => setSelectedSeller(e.target.value)}
                        disabled={globalUser?.role !== 'GERENTE'}
                        className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 py-1 cursor-pointer w-full md:min-w-[180px] appearance-none disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>Selecione um consultor</option>
                        {uniqueSelectableUsers.map(v => {
                            const usrObj = Object.values(usersDB || {}).find(u => String(u?.name || '').split(' ')[0] === v);
                            const roleLabel = usrObj?.role && usrObj.role !== 'VENDEDOR' ? ` (${usrObj.role})` : '';
                            return (
                                <option key={v} value={v} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">{v}{roleLabel}</option>
                            );
                        })}
                    </select>
                    {globalUser?.role !== 'GERENTE' && (
                        <Lock size={14} className="text-[#E3000F] mr-2 shrink-0" title="Acesso sigiloso. Você só pode ver seus próprios dados financeiros." />
                    )}
                </div>
            </div>

            {/* Corpo do Dashboard */}
            <div className="flex-1 overflow-auto p-6 bg-neutral-50/50 dark:bg-neutral-950/50 rounded-b-2xl">
                {!selectedSeller ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Selecione um vendedor para visualizar o Dashboard.</p>
                    </div>
                ) : isLoading || !metrics ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                        <div className="w-12 h-12 border-4 border-[#E3000F] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Calculando regras de comissão na API...</p>
                    </div>
                ) : metrics.selectedUserRole === 'JOVEM APRENDIZ' ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                        <Lock size={48} className="mb-4 opacity-20" />
                        <p>O perfil de Jovem Aprendiz não possui regras de Remuneração Variável (RV) atreladas no sistema.</p>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-6">
                        
                        {/* Alerta de Regra Aplicada */}
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[#E3000F] dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-0.5">Regras Oficiais do IW Aplicadas - Simulador</strong>
                                Este painel foi desenvolvido para ser um simulador das regras do IW. O sistema oficial do IW continua sendo o canal primário e definitivo para a sua prévia real de comissionamento.
                                <br /><br />
                                ⚠️ Aviso: Os valores exibidos nesta tela são apenas para fins de demonstração. Eles não constituem uma previsão real de ganhos e podem sofrer alterações.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Prévia Principal */}
                            <div className="md:col-span-3 bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-8 border border-neutral-800 shadow-2xl relative overflow-hidden group text-white">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity duration-500 mr-8 pointer-events-none">
                                    <DollarSign size={200} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Award className="text-yellow-500" size={18} /> Prévia de Remuneração Variável
                                    </h3>
                                    <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
                                        {applyCurrencyMask(metrics.previaPagamento)}
                                    </div>
                                    <p className="text-sm text-neutral-500 font-medium">
                                        Baseado no atingimento de <strong className="text-neutral-300">{metrics.pctAtingimento.toFixed(1)}%</strong> da meta {metrics.isStoreLevelRole ? 'da LOJA' : 'individual'} (Fator Simulado: {metrics.fatorSimulado * 100}%).
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Atingimento das 3 Metas (Elegibilidade) */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Target size={16} className="text-[#E3000F]" /> Elegibilidade (Mín. 80%)
                                    </h3>
                                    
                                    {metrics.selectedUserRole === 'GEEK' ? (
                                        <>
                                            {/* GEEK: Meta 1: Pós */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Gross Móvel ({metrics.totalPos} un)</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimentoPos >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoPos >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}></div>
                                                </div>
                                            </div>
                                            {/* GEEK: Meta 2: Acessório */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Acessórios ({metrics.volAcessorio} un)</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimentoAcessorio >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAcessorio.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoAcessorio >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoAcessorio, 100)}%` }}></div>
                                                </div>
                                            </div>
                                            {/* GEEK: Meta 3: Aparelho */}
                                            <div>
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Aparelhos ({metrics.volAparelho} un)</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimentoAparelho >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAparelho.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoAparelho >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoAparelho, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* DEFAULT: Meta 1: Receita */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Receita ({applyCurrencyMask(metrics.totalComissao)})</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimento >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimento.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimento >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimento, 100)}%` }}></div>
                                                </div>
                                            </div>
                                            {/* DEFAULT: Meta 2: Gross Total */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Gross Total ({metrics.totalPos} un)</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimentoPos >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoPos >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}></div>
                                                </div>
                                            </div>
                                            {/* DEFAULT: Meta 3: Residencial */}
                                            <div>
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Residencial ({metrics.totalUr} un)</span>
                                                    <span className={`text-xs font-black ${metrics.pctAtingimentoUr >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoUr.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoUr >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoUr, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className={`text-[10px] font-bold text-center py-2 rounded-xl uppercase tracking-wider ${metrics.elegivel ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-[#E3000F] dark:bg-red-900/20'}`}>
                                        {metrics.elegivel ? '✅ Elegível para Recebimento' : '❌ Não Elegível (Falta Atingimento)'}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Dicas e Foco */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#E3000F]" /> Dicas de Foco
                                    </h3>
                                    <div className="space-y-3">
                                        {metrics.selectedUserRole === 'GEEK' ? (
                                            <>
                                                {metrics.pctAtingimentoPos < 100 && (
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1">Acelere o Gross (Móvel)</h4>
                                                        <p className="text-[10px] text-purple-600 dark:text-purple-300 leading-relaxed">
                                                            {metrics.pctAtingimentoPos >= 70 ? "Quase batendo a meta móvel! Auxilie a equipe no salão de vendas e impulsione planos com maior conectividade." : 
                                                                metrics.pctAtingimentoPos >= 50 ? "É necessário dar mais suporte nas negociações de planos Pós e Controle para tracionar o volume." : 
                                                                    "Atenção: O volume móvel está baixo. Interaja mais com os clientes na loja demonstrando os benefícios do 5G."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoAcessorio < 100 && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Venda de Acessórios</h4>
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-relaxed">
                                                            {metrics.pctAtingimentoAcessorio >= 70 ? "Excelente ritmo em acessórios! Foco em bater os 100% para garantir o bônus." : 
                                                                metrics.pctAtingimentoAcessorio >= 50 ? "Aumente a demonstração de acessórios (fones, carregadores originais) na mesa de atendimento." : 
                                                                    "Alerta de Acessórios: A meta está longe do ideal. Proponha combos de capinha + película em todos os aparelhos vendidos."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoAparelho < 100 && (
                                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">Foco em Aparelhos</h4>
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-300 leading-relaxed">
                                                            {metrics.pctAtingimentoAparelho >= 70 ? "Meta de aparelhos à vista! Continue utilizando o Claro Troca para facilitar as vendas." : 
                                                                metrics.pctAtingimentoAparelho >= 50 ? "Identifique os clientes elegíveis a upgrade de aparelho e apresente os benefícios do Claro UP." : 
                                                                    "Aviso: Volume de aparelhos muito baixo. Explore mais as vitrines interativas e condições de parcelamento em 21x."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoPos >= 100 && metrics.pctAtingimentoAcessorio >= 100 && metrics.pctAtingimentoAparelho >= 100 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl text-center">
                                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-2">
                                                            <Award size={20} />
                                                        </div>
                                                        <h4 className="text-[11px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-1">Meta de Tecnologia Alcançada!</h4>
                                                        <p className="text-[10px] text-green-600 dark:text-green-300 leading-relaxed">Você bateu 100% em todas as suas metas principais. Agora concentre-se no Ticket Médio e na Banda Larga PME para liberar bônus adicionais!</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : metrics.isStoreLevelRole ? (
                                            <>
                                                {metrics.pctAtingimento < 100 && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Gestão de Receita</h4>
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-relaxed">
                                                            {metrics.pctAtingimento >= 70 ? "A loja está com um bom ritmo de faturamento! Oriente a equipe a focar na conversão de produtos de alto valor agregado, como combos Multi e Seguros, para garantir a superação da meta global." : 
                                                                metrics.pctAtingimento >= 50 ? "O faturamento global precisa de tração. Identifique os vendedores com menor ticket médio e realize clínicas de vendas para melhorar a oferta de Upgrades e portfólio completo." : 
                                                                    "Alerta Gerencial: A meta de receita da operação está sob risco. Reavalie a estratégia de piso de loja, reforce as campanhas vigentes e impulsione abordagens mais agressivas de venda cruzada."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoPos < 100 && (
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1">Alavancagem de Gross (Móvel)</h4>
                                                        <p className="text-[10px] text-purple-600 dark:text-purple-300 leading-relaxed">
                                                            {metrics.pctAtingimentoPos >= 70 ? "A meta de volume móvel está próxima! Reforce a importância da oferta de portabilidades e linhas dependentes em todos os atendimentos para fechar a cota da loja." : 
                                                                metrics.pctAtingimentoPos >= 50 ? "A equipe precisa tracionar as vendas de Pós e Controle. Revise o funil de atendimento e promova abordagens focadas nos benefícios da rede 5G e planos com maior franquia." : 
                                                                    "Atenção Liderança: Baixo volume de ativações móveis. É necessário intensificar a prospecção ativa de clientes e alinhar com a equipe a priorização das ofertas de migração e novos chips."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoUr < 100 && (
                                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">Estratégia Residencial</h4>
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-300 leading-relaxed">
                                                            {metrics.pctAtingimentoUr >= 70 ? "Bom avanço nos indicadores residenciais da loja! Mantenha a equipe engajada na oferta casada de Fibra e TV para todos os clientes móveis." : 
                                                                metrics.pctAtingimentoUr >= 50 ? "A penetração de serviços residenciais está abaixo do potencial. Treine os consultores para diagnosticar necessidades de banda larga e entretenimento logo na sondagem." : 
                                                                    "Sinal Crítico: O atingimento de produtos residenciais está puxando o resultado da loja para baixo. Estruture ações focadas e defina mini-metas diárias de Fibra e TV para os vendedores."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimento >= 100 && metrics.pctAtingimentoPos >= 100 && metrics.pctAtingimentoUr >= 100 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl text-center">
                                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-2">
                                                            <Award size={20} />
                                                        </div>
                                                        <h4 className="text-[11px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-1">Gestão de Excelência!</h4>
                                                        <p className="text-[10px] text-green-600 dark:text-green-300 leading-relaxed">A loja superou os 100% em todos os indicadores principais de elegibilidade. Mantenha o time motivado para maximizar os bônus e aceleradores na reta final do mês!</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {metrics.pctAtingimento < 100 && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Foco na Receita</h4>
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-relaxed">
                                                            {metrics.pctAtingimento >= 70 ? "Você está quase lá! Foque em planos de maior valor, combos Claro Multi e oferte seguros e acessórios para bater a meta de receita." : 
                                                                metrics.pctAtingimento >= 50 ? "É necessário revisar as ofertas para aumentar o ticket médio. Foque na rentabilização oferecendo Upgrades e serviços adicionais." : 
                                                                    "Atenção: Resultado de receita muito abaixo do esperado. Mude sua estratégia de imediato e ofereça combos de alto valor em todo atendimento."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoPos < 100 && (
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1">Acelere o Gross (Móvel)</h4>
                                                        <p className="text-[10px] text-purple-600 dark:text-purple-300 leading-relaxed">
                                                            {metrics.pctAtingimentoPos >= 70 ? "Falta pouco para a meta de móvel! Lembre-se de ofertar portabilidade e planos com dependentes para fechar essa lacuna." : 
                                                                metrics.pctAtingimentoPos >= 50 ? "O volume de vendas móveis requer atenção. Aborde de forma mais consultiva e apresente os benefícios reais dos planos Pós e Controle." : 
                                                                    "Alerta: Baixíssima conversão no móvel. Rever urgentemente a abordagem de venda e focar na busca ativa por novos clientes."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimentoUr < 100 && (
                                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3 rounded-xl">
                                                        <h4 className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">Venda mais Residencial</h4>
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-300 leading-relaxed">
                                                            {metrics.pctAtingimentoUr >= 70 ? "Bom progresso no Residencial! Continue explorando a venda casada, todo cliente móvel é um potencial cliente de Fibra ou TV." : 
                                                                metrics.pctAtingimentoUr >= 50 ? "Aumente a oferta de serviços residenciais. Investigue a necessidade de internet fixa e TV em todas as interações de rotina." : 
                                                                    "Crítico: O indicador residencial está comprometendo seus ganhos. Oferte Fibra e TV proativamente para reverter este cenário."}
                                                        </p>
                                                    </div>
                                                )}
                                                {metrics.pctAtingimento >= 100 && metrics.pctAtingimentoPos >= 100 && metrics.pctAtingimentoUr >= 100 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl text-center">
                                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-2">
                                                            <Award size={20} />
                                                        </div>
                                                        <h4 className="text-[11px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-1">Excelente Trabalho!</h4>
                                                        <p className="text-[10px] text-green-600 dark:text-green-300 leading-relaxed">Você atingiu 100% em todas as metas de elegibilidade principais. Continue vendendo para maximizar seu bônus unitário e fatores aceleradores!</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Simulador de Aceleradores */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div className="w-full flex flex-col text-left">
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#E3000F]" /> Aceleradores e Bônus
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Fator Aceleração M-Play ({metrics.volMplay}/{metrics.metaMplay})</span>
                                                <span className={`text-xs font-black ${metrics.pctAtingimentoMplay >= 100 ? 'text-green-500' : 'text-blue-500'}`}>{metrics.pctAtingimentoMplay.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden mb-2">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoMplay >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(metrics.pctAtingimentoMplay, 100)}%` }}></div>
                                            </div>
                                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight mt-1 block">
                                                Fator Automático Aplicado: <strong className="text-neutral-700 dark:text-neutral-300">{metrics.fatorMultiplicador}x</strong> nas vendas Combo com M-Play.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className="text-neutral-600 dark:text-neutral-400">Bônus Unitário (Acima Meta):</span>
                                        <span className={`font-bold ${metrics.bonusUnitario > 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-500'}`}>
                                            {metrics.bonusUnitario > 0 ? `+${applyCurrencyMask(metrics.bonusUnitario)}` : 'R$ 0,00'}
                                        </span>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800">
                                        {metrics.selectedUserRole === 'GEEK' ? (
                                            <p className="text-[11px] text-yellow-700 dark:text-yellow-400 font-medium leading-relaxed"><strong className="block mb-1 flex items-center gap-1"><Award size={12} /> Como ativar este Bônus?</strong> Como Assistente Tecnológico, você recebe <strong>R$ 235,00</strong> se bater 100% de Acessórios + Ticket Médio (TM), além de até <strong>R$ 300,00</strong> extras pelo atingimento de Banda Larga PME!</p>
                                        ) : (
                                            <p className="text-[11px] text-yellow-700 dark:text-yellow-400 font-medium leading-relaxed"><strong className="block mb-1 flex items-center gap-1"><Award size={12} /> Como ativar este Bônus?</strong> Ao ultrapassar 100% da meta de Pós-Pago, você recebe entre <strong>R$ 10,00 e R$ 15,00</strong> extras por cada venda adicional!</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detalhamento de Composição */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[#E3000F]" /> O que está sendo computado na sua Receita
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Portabilidades (+30%)</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volPortabilidade} <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">linhas</span></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Linhas trazidas de outra operadora recebem bônus sobre o valor do plano.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Aparelhos & Seguros</span>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volAparelho}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase ml-1">Aparelhos</span>
                                            </div>
                                            <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div>
                                                <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volSeguro}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase ml-1">Seguros</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">
                                            Representam <strong className="text-neutral-700 dark:text-neutral-300">{applyCurrencyMask(metrics.comissaoAparelho + metrics.comissaoSeguro)}</strong> ({metrics.totalComissao > 0 ? (((metrics.comissaoAparelho + metrics.comissaoSeguro) / metrics.totalComissao) * 100).toFixed(1) : 0}%) da sua receita de comissão. Fique atento à composição!
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Vendas PME (100% Receita)</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volPme} <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">planos</span></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Planos PJ não entram na meta quantitativa (Gross), mas somam integralmente na receita.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Regras de Operação</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Automático <CheckCircle2 size={16} className="text-green-500" /></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Upgrades (50%) e Sidegrades (25%) já estão sendo calculados automaticamente no valor final.</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};