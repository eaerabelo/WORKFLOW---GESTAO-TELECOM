import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calculator, User, DollarSign, Target, TrendingUp, AlertCircle, 
    Award, Lock, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, 
    ChevronDown, Zap, BarChart2
} from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';
import { authFetch, API_URL } from '../services/api.js';
import { WFLogoLoader } from './WFLogoLoader.jsx';

// Fatores de Aceleração Combo Multi
const FATORES_ACELERADOR_MULTI = {
    FAIXA_1: 1.2,
    FAIXA_2: 1.4,
    FAIXA_3: 1.6,
    FAIXA_4: 1.8
};

// Fallback de cálculo de produto local caso a API esteja temporariamente indisponível
const calcularReceitaProdutoLocal = (sale, pctAtingimentoMplay = 0) => {
    let receitaBase = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;
    let isMovel = false;
    let isResidencial = false;
    
    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
    const combo = String(sale.combo || '').toUpperCase();
    const portabilidade = String(sale.portabilidade || '').toUpperCase();
    
    if (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || 
        pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('FLEX') || 
        pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
        isMovel = true;
    }
    
    if (pBase.includes('FIBRA') || pBase.includes('TV') || pBase.includes('FIXO') || pBase.includes('MESH') || pBase.includes('RESIDENCIAL')) {
        isResidencial = true;
    }

    if (isMovel) {
        if (pBase.includes('DEP') && (sub.includes('GRÁTIS') || sub.includes('GRATUITO'))) {
            receitaBase = 0;
        }
        if (portabilidade === 'SIM') {
            receitaBase *= 1.30;
        }
        if (combo.includes('MULTI')) {
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1;
                if (pctAtingimentoMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4;
                else if (pctAtingimentoMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3;
                else if (pctAtingimentoMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            }
        }
    }

    if (isResidencial) {
        if (pBase.replace(/\s/g, '').includes('TV+APP') || sub.replace(/\s/g, '').includes('TV+APP') || sub === 'APP') {
            receitaBase = 0;
        }
        if (combo.includes('MULTI')) {
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1;
                if (pctAtingimentoMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4;
                else if (pctAtingimentoMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3;
                else if (pctAtingimentoMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            }
        }
    }

    const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
    if (tipoOp === 'UPGRADE') {
        receitaBase *= 0.50;
    } else if (tipoOp === 'SIDEGRADE') {
        receitaBase *= 0.25;
    } else if (tipoOp === 'DOWNGRADE') {
        receitaBase = 0;
    }

    return receitaBase;
};

// Fallback de cálculo de Fator RV local
const calcularFatorRVLocal = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;
    let previaPagamento = 0;
    const role = metricasExtras.role || 'VENDEDOR';

    if (role === 'GERENTE') {
        const pctPos = metricasExtras.pctAtingimentoPos || 0;
        const pctUr = metricasExtras.pctAtingimentoUr || 0;
        if (pctAtingimento < 85 || pctPos < 85 || pctUr < 85) elegivel = false;
        
        if (elegivel) {
            if (pctAtingimento >= 100) fator = 0.015;
            else if (pctAtingimento >= 90.1) fator = 0.010;
            else fator = 0.005;
            previaPagamento = totalComissao * fator;
        }
    } else if (role === 'ASSISTENTE RELACIONAMENTO') {
        if (pctAtingimento < 80) elegivel = false;
        if (elegivel) {
            if (pctAtingimento >= 100) fator = 0.035;
            else if (pctAtingimento >= 95.1) fator = 0.025;
            else fator = 0.015;
            previaPagamento = totalComissao * fator;
        }
    } else if (role === 'GEEK') {
        const pctPos = metricasExtras.pctAtingimentoPos || 0;
        const pctAces = metricasExtras.pctAtingimentoAcessorio || 0;
        const pctApa = metricasExtras.pctAtingimentoAparelho || 0;
        if (pctPos < 80 || pctAces < 80 || pctApa < 80) elegivel = false;

        if (elegivel) {
            fator = 0.06;
            previaPagamento = (metricasExtras.comissaoSeguro || 0) * 0.06 + (metricasExtras.receitaAcessorio || 0) * 0.02;
            if (pctAtingimento >= 100) {
                previaPagamento += (metricasExtras.comissaoSeguro || 0) * 0.04;
            }
        }
    } else if (role === 'ADMINISTRAÇÃO') {
        if (pctAtingimento < 80) elegivel = false;
        if (elegivel) {
            fator = pctAtingimento >= 100 ? 0.0025 : 0.0015;
            previaPagamento = totalComissao * fator;
        }
    } else if (role === 'SENIOR') {
        const pctPos = metricasExtras.pctAtingimentoPos || 0;
        const pctUr = metricasExtras.pctAtingimentoUr || 0;
        if (pctAtingimento < 85 || pctPos < 85 || pctUr < 85) elegivel = false;
        if (elegivel) {
            if (pctAtingimento >= 115) fator = 0.08;
            else if (pctAtingimento >= 100) fator = 0.06;
            else fator = 0.04;
            previaPagamento = totalComissao * fator;
        }
    } else {
        // VENDEDOR
        const pctPos = metricasExtras.pctAtingimentoPos || 0;
        const pctUr = metricasExtras.pctAtingimentoUr || 0;
        if (pctAtingimento < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        if (elegivel) {
            if (pctAtingimento >= 150) fator = 0.11;
            else if (pctAtingimento >= 120) fator = 0.09;
            else if (pctAtingimento >= 100) fator = 0.07;
            else fator = 0.045;
            previaPagamento = totalComissao * fator;
        }
    }

    return {
        fatorAplicado: fator,
        elegivel,
        previaPagamento: Math.max(0, previaPagamento),
        bonusUnitario: 0
    };
};

export const FatorRvv = ({ globalUser, salesData = [], goalsDB = {}, usersDB = {}, globalMonth }) => {
    // REGRAS DE HIERARQUIA E VISIBILIDADE
    const userRole = String(globalUser?.role || 'VENDEDOR').toUpperCase();
    const isVendedor = userRole === 'VENDEDOR';
    const canChangeSeller = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO'].includes(userRole);
    const loggedName = String(globalUser?.name || '');

    // Listagem de colaboradores elegíveis para seleção
    const safeVendedores = useMemo(() => {
        return Object.values(usersDB || {})
            .filter(u => !u?.role || u?.role === 'VENDEDOR')
            .map(u => String(u?.name || ''))
            .filter(Boolean);
    }, [usersDB]);

    const allUsers = useMemo(() => {
        return Object.values(usersDB || {})
            .filter(u => u?.role !== 'SUSPENDER')
            .map(u => String(u?.name || ''))
            .filter(Boolean);
    }, [usersDB]);
        
    const historicalUsers = useMemo(() => {
        return (salesData || []).map(s => String(s.vendedor || '')).filter(Boolean);
    }, [salesData]);

    const uniqueSelectableUsers = useMemo(() => {
        return [...new Set([...allUsers, ...historicalUsers])].sort();
    }, [allUsers, historicalUsers]);

    // O vendedor é estritamente forçado a ver apenas seus próprios dados
    const [selectedSeller, setSelectedSeller] = useState(loggedName);
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Salvaguarda: se for vendedor, não permite selecionar outro nome
    useEffect(() => {
        if (!canChangeSeller && loggedName) {
            setSelectedSeller(loggedName);
        }
    }, [canChangeSeller, loggedName]);

    useEffect(() => {
        const targetSeller = canChangeSeller ? (selectedSeller || loggedName) : loggedName;
        if (!targetSeller) {
            setMetrics(null);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            
            const selectedUserObj = Object.values(usersDB || {}).find(u => String(u?.name || '') === targetSeller);
            const selectedUserRole = selectedUserObj?.role || (targetSeller === loggedName ? userRole : 'VENDEDOR');
            const isStoreLevelRole = ['GERENTE', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(selectedUserRole);

            const activeMetas = (goalsDB || {})[globalMonth] || METAS_PADRAO || {};
            const numSellers = safeVendedores.length || 1;
            const divisor = isStoreLevelRole ? 1 : numSellers;

            // 1. Isola as vendas do mês
            const monthSales = (salesData || []).filter(s => {
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
                : monthSales.filter(s => s.vendedor === targetSeller || s.vendedor === String(targetSeller || ''));

            let sellerTotalReceita = 0;
            let volMplay = 0;
            sellerSales.forEach(s => {
                sellerTotalReceita += Number(s.valorBruto || s.receita) || 0;
                if (String(s.mplay || '').toUpperCase() === 'SIM') volMplay += 1;
            });

            const metaReceita = (Number(activeMetas.receita) || 0) / divisor;
            const metaMplay = Math.ceil((Number(activeMetas.mplay) || 0) / divisor);

            // 3. Calcula o Fator Multiplicador baseado no atingimento individual
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

            let resultados = [];
            let receitaExtraMplay = 0;

            try {
                // Passo 1: Busca resultados na API com timeout
                const resProdRaw = await authFetch(`${API_URL}/api/calcular/fator-rv/resultados`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sellerSales, pctAtingimentoMplay })
                });

                if (resProdRaw.ok) {
                    const resProd = await resProdRaw.json();
                    resultados = resProd.resultados || [];
                    receitaExtraMplay = resProd.receitaExtraMplay || 0;
                } else {
                    throw new Error("API retornou erro");
                }
            } catch (err) {
                // Fallback de cálculo local
                resultados = sellerSales.map(sale => {
                    const rCom = calcularReceitaProdutoLocal(sale, pctAtingimentoMplay);
                    const rSem = calcularReceitaProdutoLocal(sale, 0);
                    receitaExtraMplay += (rCom - rSem);
                    return { id: sale.id, receitaBase: rCom };
                });
            }

            let totalComissao = 0;
            let comissaoAparelho = 0;
            let comissaoSeguro = 0;

            sellerSales.forEach((sale) => {
                const resApi = (resultados || []).find(r => r.id === sale.id);
                const receitaBase = resApi ? resApi.receitaBase : calcularReceitaProdutoLocal(sale, pctAtingimentoMplay);

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
                if (pBase.includes('TV+') || pBase.includes('TV')) {
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

            // Passo 2: Pede o Fator RV Final para a API ou usa fallback local
            const metricasExtras = {
                totalVendas, pctAtingimentoPos, pctAtingimentoUr, notaNps: 0,
                volPosPago, metaPosPago, volFibra, metaFibra, volTv, metaTv,
                pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme,
                role: selectedUserRole,
                totalReceita,
                comissaoAparelho,
                comissaoSeguro,
                receitaAcessorio,
                metaReceita
            };

            let resultRV = {};
            try {
                const resRVRaw = await authFetch(`${API_URL}/api/calcular/fator-rv/calcular`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pctAtingimento, totalComissao, metricasExtras })
                });
                if (resRVRaw.ok) {
                    const resRV = await resRVRaw.json();
                    resultRV = resRV.resultRV || {};
                } else {
                    throw new Error("Erro no cálculo remoto");
                }
            } catch (err) {
                resultRV = calcularFatorRVLocal(pctAtingimento, totalComissao, metricasExtras);
            }

            if (isMounted) {
                setMetrics({
                    totalReceita, totalComissao, totalVendas, totalPos, totalUr,
                    metaReceita, metaPos, metaUr, pctAtingimento, pctAtingimentoPos, pctAtingimentoUr,
                    pctAtingimentoMplay, volMplay, metaMplay, receitaExtraMplay,
                    previaPagamento: resultRV.previaPagamento ?? 0,
                    fatorSimulado: resultRV.fatorAplicado ?? 0,
                    elegivel: resultRV.elegivel ?? false,
                    bonusUnitario: resultRV.bonusUnitario ?? 0,
                    fatorMultiplicador, volPortabilidade, volMulti, volPme,
                    volAparelho, comissaoAparelho, volSeguro, comissaoSeguro,
                    pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme,
                    volAcessorio, receitaAcessorio,
                    isStoreLevelRole, selectedUserRole,
                    targetSeller
                });
                setIsLoading(false);
            }
        };

        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [salesData, selectedSeller, globalMonth, goalsDB, safeVendedores.length, canChangeSeller, loggedName, userRole]);

    // Caso de Perfil Jovem Aprendiz
    if (userRole === 'JOVEM APRENDIZ') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm animate-fade-in text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 mb-4 border border-neutral-200 dark:border-neutral-700">
                    <Lock size={28} className="text-[#E3000F]" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Módulo Restrito</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    O perfil de Jovem Aprendiz não possui apuração de Remuneração Variável (Fator RV) parametrizada no sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors space-y-4">
            {/* CABEÇALHO PRINCIPAL */}
            <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#E3000F]/10 dark:bg-[#E3000F]/20 flex items-center justify-center text-[#E3000F] border border-[#E3000F]/20 shrink-0">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                                Painel Fator RV
                            </h2>
                            <span className="text-[11px] font-bold bg-[#E3000F]/10 text-[#E3000F] dark:bg-[#E3000F]/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-[#E3000F]/20">
                                PRÉVIA
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-semibold uppercase tracking-wide">
                            SIMULADOR DE COMISSIONAMENTO , NÃO VALIDO PARA RECEBIMENTO , SOMENTE PARA ESTIMATIVA
                        </p>
                    </div>
                </div>
                
                {/* SELETOR DE COLABORADOR (COM RESTRIÇÃO E SIGILO PARA VENDEDORES) */}
                <div className="w-full md:w-auto">
                    {canChangeSeller ? (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-inner">
                            <User size={16} className="text-[#E3000F] shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-400 tracking-wider">
                                    Consultor Selecionado
                                </span>
                                <select 
                                    value={selectedSeller} 
                                    onChange={(e) => setSelectedSeller(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-neutral-800 dark:text-neutral-100 outline-none pr-3 cursor-pointer w-full md:min-w-[200px]"
                                >
                                    {uniqueSelectableUsers.map(v => {
                                        const usrObj = Object.values(usersDB || {}).find(u => String(u?.name || '') === v);
                                        const roleLabel = usrObj?.role && usrObj.role !== 'VENDEDOR' ? ` (${usrObj.role})` : '';
                                        return (
                                            <option key={v} value={v} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
                                                {v}{roleLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <ChevronDown size={14} className="text-neutral-400 shrink-0 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                                    <Lock size={10} className="text-[#E3000F]" /> Painel Individual Confidencial
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100">
                                    {loggedName || 'Colaborador'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CORPO DO DASHBOARD */}
            <div className="flex-1 overflow-auto">
                {isLoading || !metrics ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 min-h-[400px] flex items-center justify-center">
                        <WFLogoLoader
                            size="md"
                            text="Calculando Fator RV..."
                            subtext="Processando pontuação de metas, aceleradores e comissão..."
                        />
                    </div>
                ) : (
                    <div className="space-y-5 pb-6">
                        {/* AVISO DO SIMULADOR (DISCRETO E ELEGANTE) */}
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-4 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle size={18} />
                            </div>
                            <div className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                                <strong className="text-neutral-900 dark:text-neutral-100 font-semibold block mb-0.5">
                                    Simulador Operacional de Regras IW da Claro
                                </strong>
                                Os cálculos exibidos são estimativas baseadas na tabela oficial vigente e run rate da filial. O sistema IW da Claro permanece como canal primário e homologado para a apuração final.
                            </div>
                        </div>

                        {/* CARDS PRINCIPAIS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            {/* CARD DESTAQUE: PRÉVIA DE REMUNERAÇÃO VARIÁVEL */}
                            <div className="md:col-span-3 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-xl relative overflow-hidden text-white">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none pr-8">
                                    <DollarSign size={240} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                                            <Award className="text-amber-400" size={16} /> 
                                            <span>Prévia de Remuneração Variável (RV)</span>
                                            <span className="text-neutral-500">•</span>
                                            <span className="text-neutral-300 capitalize">{metrics.targetSeller}</span>
                                        </div>
                                        <div className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-2 font-sans">
                                            {applyCurrencyMask(metrics.previaPagamento)}
                                        </div>
                                        <p className="text-xs sm:text-sm text-neutral-400 font-normal max-w-xl">
                                            Atingimento de <strong className="text-neutral-100 font-semibold">{metrics.pctAtingimento.toFixed(1)}%</strong> da meta {metrics.isStoreLevelRole ? 'geral da LOJA' : 'individual'} • Fator Simulado: <strong className="text-amber-400 font-sans font-black">{(metrics.fatorSimulado * 100).toFixed(2)}%</strong>.
                                        </p>
                                    </div>

                                    {/* STATUS BADGE GRANDE */}
                                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8">
                                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Status de Elegibilidade</span>
                                        <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                            metrics.elegivel 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-[#E3000F]/20 text-red-400 border border-[#E3000F]/30'
                                        }`}>
                                            {metrics.elegivel ? (
                                                <>
                                                    <CheckCircle2 size={14} /> Elegível ao Pagamento
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={14} /> Abaixo do Piso Mínimo
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CARD: ELEGIBILIDADE DAS METAS */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Target size={15} className="text-[#E3000F]" /> Metas de Elegibilidade
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            Piso: 80%
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {/* META 1: RECEITA */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Receita ({applyCurrencyMask(metrics.totalComissao)})
                                                </span>
                                                <span className={`font-sans font-extrabold ${metrics.pctAtingimento >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                    {metrics.pctAtingimento.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        metrics.pctAtingimento >= 100 ? 'bg-emerald-500' : metrics.pctAtingimento >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                    }`} 
                                                    style={{ width: `${Math.min(metrics.pctAtingimento, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* META 2: GROSS TOTAL */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Gross Móvel ({metrics.totalPos} un)
                                                </span>
                                                <span className={`font-sans font-extrabold ${metrics.pctAtingimentoPos >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                    {metrics.pctAtingimentoPos.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        metrics.pctAtingimentoPos >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoPos >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                    }`} 
                                                    style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* META 3: RESIDENCIAL */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Residencial ({metrics.totalUr} un)
                                                </span>
                                                <span className={`font-sans font-extrabold ${metrics.pctAtingimentoUr >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                    {metrics.pctAtingimentoUr.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        metrics.pctAtingimentoUr >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoUr >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                    }`} 
                                                    style={{ width: `${Math.min(metrics.pctAtingimentoUr, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
                                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider block ${
                                        metrics.elegivel 
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                            : 'bg-red-50 text-[#E3000F] dark:bg-red-950/40 dark:text-red-400'
                                    }`}>
                                        {metrics.elegivel ? '✓ Destravou Comissões' : '✗ Abaixo do Gatilho Mínimo'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD: ACELERADORES E BÔNUS M-PLAY */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={15} className="text-[#E3000F]" /> Aceleradores M-Play
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            Multiplicador
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Meta M-Play ({metrics.volMplay}/{metrics.metaMplay})
                                                </span>
                                                <span className={`font-sans font-extrabold ${metrics.pctAtingimentoMplay >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {metrics.pctAtingimentoMplay.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden mb-2">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        metrics.pctAtingimentoMplay >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`} 
                                                    style={{ width: `${Math.min(metrics.pctAtingimentoMplay, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                                                Fator aplicado: <strong className="text-neutral-900 dark:text-neutral-100 font-sans font-bold">{metrics.fatorMultiplicador}x</strong> nas vendas combo com Claro tv+ / M-Play.
                                            </p>
                                        </div>

                                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                            <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-400 block mb-0.5">
                                                Aporte no Run Rate
                                            </span>
                                            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-sans">
                                                +{applyCurrencyMask(metrics.receitaExtraMplay || 0)}
                                            </div>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Receita adicional injetada pelo acelerador nas vendas elegíveis.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 dark:text-neutral-400">Bônus Excedente:</span>
                                    <span className={`font-sans font-extrabold ${metrics.bonusUnitario > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                                        {metrics.bonusUnitario > 0 ? `+${applyCurrencyMask(metrics.bonusUnitario)}` : 'R$ 0,00'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD: DICAS DE FOCO & RUN RATE */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp size={15} className="text-[#E3000F]" /> Dicas de Alavancagem
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            Operação
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {metrics.pctAtingimento < 100 ? (
                                            <div className="p-3 bg-red-50/70 dark:bg-red-950/20 rounded-xl border border-red-200/50 dark:border-red-900/30">
                                                <h4 className="text-[11px] font-bold text-[#E3000F] uppercase tracking-wider mb-0.5">
                                                    Alavancagem de Receita
                                                </h4>
                                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                    Priorize planos Pós com maior conectividade, combos Multi e venda agregada de Seguros e Acessórios para acelerar o run rate.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                                                <h4 className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                                                    Meta de Receita Superada!
                                                </h4>
                                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                    Excelente ritmo. Mantenha as vendas ativas para maximizar o multiplicador nas faixas mais altas de comissão.
                                                </p>
                                            </div>
                                        )}

                                        {metrics.pctAtingimentoPos < 100 && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                                <h4 className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider mb-0.5">
                                                    Portabilidade (+30%)
                                                </h4>
                                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                    Traga clientes de outras operadoras: linhas portadas geram bônus direto de 30% sobre o plano ativado.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Volume Total:</span>
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{metrics.totalVendas} vendas computadas</span>
                                </div>
                            </div>

                            {/* SEÇÃO: DETALHAMENTO DE COMPOSIÇÃO DE RECEITA */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-[#E3000F]" /> Composição da Receita Apurada
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Portabilidades (+30%)</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volPortabilidade} <span className="text-xs font-normal text-neutral-400">linhas</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Bônus de 30% aplicado sobre o valor do plano.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Aparelhos & Seguros</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volAparelho + metrics.volSeguro} <span className="text-xs font-normal text-neutral-400">itens</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Comissão: {applyCurrencyMask(metrics.comissaoAparelho + metrics.comissaoSeguro)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Planos PME / PJ</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volPme} <span className="text-xs font-normal text-neutral-400">planos</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            100% da receita soma na base de comissão.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ajustes de Operação</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 flex items-center gap-1.5 font-sans">
                                            Ativo <CheckCircle2 size={18} className="text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Upgrades (50%) e Sidegrades (25%) ajustados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SEÇÃO: TABELA DE REGRAS POR CARGO */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={16} className="text-[#E3000F]" /> Regras de Enquadramento ({metrics.selectedUserRole || 'VENDEDOR'})
                                    </h3>
                                    <span className="text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-0.5 rounded-full">
                                        Tabela Vigente
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                                            Piso Mínimo
                                        </span>
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                            80% de Atingimento
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                                            Destrava o pagamento da comissão sobre a receita apurada.
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                                            Faixas Base (Vendedor)
                                        </span>
                                        <div className="text-xs space-y-0.5 text-neutral-700 dark:text-neutral-300 font-sans font-semibold">
                                            <div>80% - 99.9%: <strong className="text-neutral-900 dark:text-neutral-100">4.5%</strong></div>
                                            <div>100% - 119.9%: <strong className="text-neutral-900 dark:text-neutral-100">7.0%</strong></div>
                                            <div>≥ 120%: <strong className="text-emerald-600 dark:text-emerald-400">9.0% a 11.0%</strong></div>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                                            Aceleração Multi & Port
                                        </span>
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                            Até 1.8x em M-Play
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                                            Multiplicador progressivo aplicado sobre planos combo e 30% em portabilidades.
                                        </p>
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
