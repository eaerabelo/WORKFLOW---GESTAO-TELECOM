import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Home, Watch, ShieldCheck, Zap, MonitorPlay, Calendar, Lock, Users, Crown, Medal, FileText, Target } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { ProgressBar } from './ProgressBar.jsx';
import toast from 'react-hot-toast';
import { METAS_PADRAO } from '../utils/constants';
import { fetchColaboradoresDashboard } from '../services/api';

export const Colaboradores = ({ selectedSeller, setSelectedSeller, isVendedor, globalUser, setAuthModal, globalMonth, setGlobalMonth }) => {
    const [activeSubTab, setActiveSubTab] = useState('DESEMPENHO');
    const monthFilter = globalMonth;
    const setMonthFilter = setGlobalMonth;

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchColaboradoresDashboard(monthFilter);
                if (data) {
                    setDashboardData(data);
                }
            } catch (error) {
                console.error("Erro ao buscar dashboard:", error);
                toast.error("Erro ao carregar dados dos colaboradores");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [monthFilter]);

    const safeVendedores = dashboardData?.safeVendedores || [];
    const individualMetas = dashboardData?.individualMetas || METAS_PADRAO;
    const sellerMetricsMap = dashboardData?.sellerMetricsMap || {};
    const rankings = dashboardData?.rankings || {};
    const sellerDailyData = dashboardData?.sellerDailyData || {};

    const {
        topReceitaName, topReceitaName2, topReceitaName3,
        topPosName, topControleName, topAcessorioName,
        topAparelhoName, topResidencialName
    } = rankings;

    const getSellerMetrics = (sellerName) => {
        return sellerMetricsMap[sellerName] || {
            totalReceita: 0, volControle: 0, volPosPago: 0, volPosTotal: 0,
            volFibra: 0, volTv: 0, volUrTotal: 0, volAparelho: 0, volAcessorio: 0,
            volPelicula: 0, volSeguro: 0, volMesh: 0, volTrocafy: 0, volMPlay: 0
        };
    };

    const handleSellerClick = (seller) => {
        if (isVendedor && seller !== globalUser?.name && seller !== String(globalUser?.name || '')) {
            toast.error("Acesso restrito! Solicite a senha da Liderança para visualizar outro colaborador.");
            setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' });
        } else {
            setSelectedSeller(seller);
        }
    };

    const dailyDataForSeller = selectedSeller ? sellerDailyData[selectedSeller] : null;
    const dailyRows = dailyDataForSeller ? dailyDataForSeller.dailyRows : [];
    const dailyTotals = dailyDataForSeller ? dailyDataForSeller.dailyTotals : {};

    const DAILY_COLUMNS = [
        { key: 'grossDia', label: 'GROSS DIA', highlight: true },
        { key: 'posPagoTotal', label: 'PÓS-PAGO' },
        { key: 'controleTotal', label: 'CONTROLE' },
        { key: 'urTotal', label: 'UR TOTAL', highlight: true },
        { key: 'fibra', label: 'FIBRA' },
        { key: 'tv', label: 'TV+' },
        { key: 'aparelho', label: 'APARELHOS' },
        { key: 'acessorio', label: 'ACESSÓRIOS' },
        { key: 'pelicula', label: 'PELÍCULAS' },
        { key: 'seguro', label: 'SEGURO' },
        { key: 'mplay', label: 'M-PLAY' },
        { key: 'receita', label: 'RECEITA (R$)', isCurrency: true, highlight: true }
    ];

    const renderValue = (val, isCurrency) => {
        if (val === null || val === undefined || val === 0) return <span className="text-neutral-400 dark:text-neutral-600">-</span>;
        return isCurrency ? applyCurrencyMask(val) : val;
    };

    return (
        <div className="flex flex-col min-h-full animate-fade-in transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Desempenho da Equipe</h2>
                            <span className="bg-[#E3000F] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                                {safeVendedores.length} Vendedores
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Acompanhe o atingimento de metas mês a mês.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto">
                    <Calendar size={18} className="text-neutral-500 dark:text-neutral-400 ml-2" />
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 cursor-pointer focus:text-[#E3000F] w-full sm:w-auto"
                    />
                </div>
            </div>

            {!selectedSeller ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {safeVendedores.map(seller => {
                            const isRestricted = isVendedor && seller !== globalUser?.name && seller !== String(globalUser?.name || '');
                            const metrics = isRestricted ? null : sellerMetricsMap[seller];
                            const isTopReceita = seller === topReceitaName;
                            const isTopReceita2 = seller === topReceitaName2;
                            const isTopReceita3 = seller === topReceitaName3;
                            const isTopPos = seller === topPosName;
                            const isTopControle = seller === topControleName;
                            const isTopAcessorio = seller === topAcessorioName;
                            const isTopAparelho = seller === topAparelhoName;
                            const isTopResidencial = seller === topResidencialName;
                            return (
                                <div key={seller} onClick={() => handleSellerClick(seller)} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F]/30 dark:hover:border-[#E3000F]/50 transition-all cursor-pointer group relative overflow-hidden">
                                    {isRestricted && (
                                        <div className="absolute top-4 right-4 text-neutral-300 dark:text-neutral-600 group-hover:text-[#E3000F] dark:group-hover:text-[#E3000F] transition-colors" title="Acesso Sigiloso">
                                            <Lock size={16} />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#E3000F] font-bold text-lg group-hover:bg-[#E3000F] group-hover:text-white transition-colors shrink-0">
                                            {seller.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg truncate" title={seller}>{seller.split(' ').slice(0, 2).join(' ')}</h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider">Vendedor</span>
                                                {isTopReceita && <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com maior Receita"><Crown size={12} className="text-yellow-600 dark:text-yellow-500" /> Top 1</span>}
                                                {isTopReceita2 && <span className="text-[10px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com a 2ª maior Receita"><Medal size={12} className="text-slate-500 dark:text-slate-400" /> Top 2</span>}
                                                {isTopReceita3 && <span className="text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com a 3ª maior Receita"><Medal size={12} className="text-amber-600 dark:text-amber-500" /> Top 3</span>}
                                                {isTopPos && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com mais Pós-pago"><Medal size={12} className="text-blue-600 dark:text-blue-500" /> Destaque Pós</span>}
                                                {isTopControle && <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com mais Controle"><Medal size={12} className="text-purple-600 dark:text-purple-500" /> Destaque Controle</span>}
                                                {isTopAparelho && <span className="text-[10px] font-bold text-pink-700 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com mais Aparelhos"><Medal size={12} className="text-pink-600 dark:text-pink-500" /> Destaque Aparelho</span>}
                                                {isTopAcessorio && <span className="text-[10px] font-bold text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com mais Acessórios"><Medal size={12} className="text-orange-600 dark:text-orange-500" /> Destaque Acessórios</span>}
                                                {isTopResidencial && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Vendedor com mais Vendas Residenciais"><Medal size={12} className="text-emerald-600 dark:text-emerald-500" /> Destaque Residencial</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        {isRestricted ? (
                                            <div className="flex flex-col items-center justify-center py-2 opacity-50">
                                                <Lock size={20} className="mb-1 text-neutral-400 dark:text-neutral-500" />
                                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Acesso Sigiloso</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-end mb-2 gap-2">
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Receita (Mês)</span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{applyCurrencyMask(metrics.totalReceita)}</span>
                                                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">/ {applyCurrencyMask(individualMetas.receita)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end gap-2">
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós Total</span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{metrics.volPosTotal}</span>
                                                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">/ {Number.isInteger(individualMetas.posTotal) ? individualMetas.posTotal : individualMetas.posTotal.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end gap-2">
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">UR Total</span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{metrics.volUrTotal}</span>
                                                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">/ {Number.isInteger(individualMetas.urTotal) ? individualMetas.urTotal : individualMetas.urTotal.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full animate-fade-in transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedSeller(null)} className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Desempenho: <span className="text-[#E3000F] uppercase">{selectedSeller}</span></h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Acompanhamento detalhado de Meta x Realizado.</p>
                            </div>
                        </div>
                        <div className="md:min-w-[300px] lg:min-w-[340px] w-full md:w-auto mt-2 md:mt-0">
                            <ProgressBar label="RECEITA TOTAL" realizado={getSellerMetrics(selectedSeller).totalReceita} meta={individualMetas.receita} isCurrency={true} isDark={false} />
                        </div>
                    </div>

                    <div className="flex overflow-x-auto scrollbar-hide border-b border-neutral-200 dark:border-neutral-800 mb-6 shrink-0" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                        <button onClick={() => setActiveSubTab('DESEMPENHO')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeSubTab === 'DESEMPENHO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Visão Geral</button>
                        <button onClick={() => setActiveSubTab('DIARIO')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeSubTab === 'DIARIO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Resultado Diário</button>
                        <button onClick={() => setActiveSubTab('NECESSIDADE_DIARIA')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeSubTab === 'NECESSIDADE_DIARIA' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Necessidade Diária</button>
                    </div>

                    {activeSubTab === 'NECESSIDADE_DIARIA' ? (() => {
                        // Cálculos Extratos para Necessidade Diária
                        let remainingDays = 0;
                        const [yearStr, monthStr] = (monthFilter || '').split('-');
                        if (yearStr && monthStr) {
                            const year = parseInt(yearStr, 10);
                            const month = parseInt(monthStr, 10);
                            const daysInMonth = new Date(year, month, 0).getDate();
                            const today = new Date();
                            const currentY = today.getFullYear();
                            const currentM = today.getMonth() + 1;
                            const currentD = today.getDate();
                            if (year > currentY || (year === currentY && month > currentM)) remainingDays = daysInMonth;
                            else if (year === currentY && month === currentM) remainingDays = Math.max(1, daysInMonth - currentD + 1);
                        }

                        const calcNec = (meta, real, isCurrency) => {
                            const diff = meta - real;
                            if (diff <= 0) return { faltam: 0, porDia: 0, isBatida: true };
                            if (remainingDays === 0) return { faltam: diff, porDia: 0, isEncerrado: true };
                            const pd = isCurrency ? (diff / remainingDays) : Math.ceil(diff / remainingDays);
                            return { faltam: diff, porDia: pd, isBatida: false };
                        };

                        const metrics = getSellerMetrics(selectedSeller);

                        const necPosPago = calcNec(individualMetas.posPago, metrics.volPosPago, false);
                        const necControle = calcNec(individualMetas.controle, metrics.volControle, false);
                        const necPosTotal = {
                            faltam: necPosPago.faltam + necControle.faltam,
                            porDia: necPosPago.porDia + necControle.porDia,
                            isBatida: (necPosPago.faltam + necControle.faltam) <= 0,
                            isEncerrado: remainingDays === 0
                        };

                        const necFibra = calcNec(individualMetas.fibra, metrics.volFibra, false);
                        const necTv = calcNec(individualMetas.tv, metrics.volTv, false);
                        const necUrTotal = {
                            faltam: necFibra.faltam + necTv.faltam,
                            porDia: necFibra.porDia + necTv.porDia,
                            isBatida: (necFibra.faltam + necTv.faltam) <= 0,
                            isEncerrado: remainingDays === 0
                        };

                        const necessidadeData = [
                            { label: 'Receita (R$)', meta: individualMetas.receita, real: metrics.totalReceita, isCurrency: true, nec: calcNec(individualMetas.receita, metrics.totalReceita, true) },
                            { label: 'Pós Total', meta: individualMetas.posTotal, real: metrics.volPosTotal, isCurrency: false, nec: necPosTotal },
                            { label: 'Pós-Pago', meta: individualMetas.posPago, real: metrics.volPosPago, isCurrency: false, nec: necPosPago },
                            { label: 'Controle', meta: individualMetas.controle, real: metrics.volControle, isCurrency: false, nec: necControle },
                            { label: 'UR Total', meta: individualMetas.urTotal, real: metrics.volUrTotal, isCurrency: false, nec: necUrTotal },
                            { label: 'Fibra', meta: individualMetas.fibra, real: metrics.volFibra, isCurrency: false, nec: necFibra },
                            { label: 'TV+ / Box', meta: individualMetas.tv, real: metrics.volTv, isCurrency: false, nec: necTv },
                            { label: 'Aparelhos', meta: individualMetas.aparelho, real: metrics.volAparelho, isCurrency: false, nec: calcNec(individualMetas.aparelho, metrics.volAparelho, false) },
                            { label: 'Acessórios', meta: individualMetas.acessorio, real: metrics.volAcessorio, isCurrency: false, nec: calcNec(individualMetas.acessorio, metrics.volAcessorio, false) },
                            { label: 'Películas', meta: individualMetas.pelicula, real: metrics.volPelicula, isCurrency: false, nec: calcNec(individualMetas.pelicula, metrics.volPelicula, false) },
                            { label: 'Seguro', meta: individualMetas.seguro, real: metrics.volSeguro, isCurrency: false, nec: calcNec(individualMetas.seguro, metrics.volSeguro, false) },
                            { label: 'M-Play', meta: individualMetas.mplay, real: metrics.volMPlay, isCurrency: false, nec: calcNec(individualMetas.mplay, metrics.volMPlay, false) },
                            { label: 'Trocafy', meta: individualMetas.trocafy, real: metrics.volTrocafy, isCurrency: false, nec: calcNec(individualMetas.trocafy, metrics.volTrocafy, false) },
                            { label: 'Mesh', meta: individualMetas.mesh, real: metrics.volMesh, isCurrency: false, nec: calcNec(individualMetas.mesh, metrics.volMesh, false) }
                        ];

                        return (
                            <div className="flex-1 pb-6 pr-2 space-y-6 overflow-y-auto scrollbar-thin">
                                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg"><Target size={20} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg uppercase tracking-wide">Necessidade Diária</h3>
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                                        Acompanhe quanto você precisa vender diariamente para atingir as metas do mês atual. O cálculo divide o saldo restante pelos dias que faltam para o mês acabar.
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {necessidadeData.map((ind, i) => (
                                            <div key={i} className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-[#E3000F]/30 transition-colors">
                                                <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">{ind.label}</div>
                                                <div className={`text-xl font-black ${ind.label === 'Receita (R$)' ? 'text-[#E3000F]' : 'text-neutral-800 dark:text-neutral-100'}`}>
                                                    {ind.nec.isBatida ? <span className="text-sm font-bold text-green-500">Meta Batida 🎉</span> :
                                                        ind.nec.isEncerrado ? <span className="text-sm font-bold text-neutral-400">Mês encerrado</span> :
                                                            (ind.isCurrency ? applyCurrencyMask(ind.nec.porDia) + ' /dia' : Math.ceil(ind.nec.porDia) + ' /dia')}
                                                </div>
                                                <div className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-2 font-bold">
                                                    Faltam: {ind.isCurrency ? applyCurrencyMask(ind.nec.faltam) : ind.nec.faltam.toFixed(0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })() : activeSubTab === 'DESEMPENHO' ? (
                        <div className="flex-1 pb-6 pr-2 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm lg:col-span-2 flex flex-col relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Smartphone size={150} /></div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg"><Smartphone size={20} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg uppercase tracking-wide">GROSS TOTAL</h3>
                                    </div>
                                    <div className="mb-8">
                                        <ProgressBar label="PÓS TOTAL (Pós + Controle + Dependentes + Flex)" realizado={getSellerMetrics(selectedSeller).volPosTotal} meta={individualMetas.posTotal} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                                        <ProgressBar label="Individual: PÓS-PAGO" realizado={getSellerMetrics(selectedSeller).volPosPago} meta={individualMetas.posPago} />
                                        <ProgressBar label="Individual: CONTROLE" realizado={getSellerMetrics(selectedSeller).volControle} meta={individualMetas.controle} />
                                    </div>
                                </div>

                                <div className="bg-neutral-900 dark:bg-neutral-950 rounded-3xl p-6 shadow-sm text-white flex flex-col relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 p-8 opacity-10 pointer-events-none"><Home size={120} /></div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-neutral-700 text-white rounded-lg"><Home size={20} /></div>
                                        <h3 className="font-bold text-white text-lg uppercase tracking-wide">UR-Residencial</h3>
                                    </div>
                                    <div className="mb-8"><ProgressBar label="UR TOTAL (Fibra + TV)" realizado={getSellerMetrics(selectedSeller).volUrTotal} meta={individualMetas.urTotal} isDark={true} /></div>
                                    <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-neutral-700 dark:border-neutral-800">
                                        <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={14} className="text-[#E3000F]" />Fibras</span>
                                            <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volFibra}</span><span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">/ {Number.isInteger(individualMetas.fibra) ? individualMetas.fibra : individualMetas.fibra.toFixed(1)}</span></div>
                                        </div>
                                        <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MonitorPlay size={14} className="text-[#E3000F]" /> TV BOX</span>
                                            <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volTv}</span><span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">/ {Number.isInteger(individualMetas.tv) ? individualMetas.tv : individualMetas.tv.toFixed(1)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg"><Watch size={20} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">APARELHOS & ACESSORIOS</h3>
                                    </div>
                                    <div className="space-y-6 mt-auto">
                                        <ProgressBar label="Aparelhos" realizado={getSellerMetrics(selectedSeller).volAparelho} meta={individualMetas.aparelho} />
                                        <ProgressBar label="Acessórios" realizado={getSellerMetrics(selectedSeller).volAcessorio} meta={individualMetas.acessorio} />
                                        <ProgressBar label="Películas" realizado={getSellerMetrics(selectedSeller).volPelicula} meta={individualMetas.pelicula} />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm lg:col-span-2 flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-lg"><ShieldCheck size={20} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">SERVIÇOS ADICIONAIS</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-auto">
                                        <ProgressBar label="Seguro (Proteção Móvel)" realizado={getSellerMetrics(selectedSeller).volSeguro} meta={individualMetas.seguro} />
                                        <ProgressBar label="Anexação M-Play" realizado={getSellerMetrics(selectedSeller).volMPlay} meta={individualMetas.mplay} />
                                        <ProgressBar label="Trocafy" realizado={getSellerMetrics(selectedSeller).volTrocafy} meta={individualMetas.trocafy} />
                                        <ProgressBar label="Equipamento MESH" realizado={getSellerMetrics(selectedSeller).volMesh} meta={individualMetas.mesh} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm scrollbar-thin">
                            <table className="w-full text-center border-collapse text-[10px] whitespace-nowrap min-w-max">
                                <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase tracking-wider sticky top-0 z-20">
                                    <tr>
                                        <th className="border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold sticky left-0 bg-neutral-900 dark:bg-neutral-950 shadow-[2px_0_5px_rgba(0,0,0,0.2)] z-30">DATA</th>
                                        {DAILY_COLUMNS.map(col => (
                                            <th key={col.key} className={`border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold ${col.highlight ? 'bg-neutral-900 dark:bg-black text-yellow-500' : ''}`}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                    {dailyRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                            <td className="border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 sticky left-0 bg-white dark:bg-neutral-900 font-bold text-neutral-900 dark:text-neutral-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">{row.data}</td>
                                            {DAILY_COLUMNS.map(col => (
                                                <td key={col.key} className={`border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 ${col.highlight ? 'bg-yellow-50/30 dark:bg-yellow-900/10 font-bold' : ''}`}>
                                                    {renderValue(row[col.key], col.isCurrency)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-neutral-50 dark:bg-neutral-900 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                    <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-[#E3000F]">TOTAL MÊS</td>
                                        {DAILY_COLUMNS.map(col => (
                                            <td key={col.key} className={`border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 ${col.highlight ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                                {renderValue(dailyTotals[col.key], col.isCurrency)}
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};