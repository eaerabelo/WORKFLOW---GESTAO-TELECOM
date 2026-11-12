import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Home, Watch, ShieldCheck, Zap, MonitorPlay, Calendar, Lock, Users, Crown, Medal, FileText, Target, Activity } from 'lucide-react';
import { applyCurrencyMask, getTodaySP } from '../utils/masks';
import { ProgressBar } from './ProgressBar.jsx';
import toast from 'react-hot-toast';
import { METAS_PADRAO } from '../utils/constants';
import { fetchColaboradoresDashboard } from '../services/api';

export const Colaboradores = ({ selectedSeller, setSelectedSeller, isVendedor, globalUser, salesData = [], setAuthModal, globalMonth, setGlobalMonth, usersDB = {} }) => {
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
    }, [monthFilter, globalUser?.name, globalUser?.photoUrl]);

    const safeVendedores = dashboardData?.safeVendedores || [];
    const individualMetas = dashboardData?.individualMetas || METAS_PADRAO;
    const sellerMetricsMap = dashboardData?.sellerMetricsMap || {};
    const rankings = dashboardData?.rankings || {};
    const sellerDailyData = dashboardData?.sellerDailyData || {};
    const sellerProfilesMap = dashboardData?.sellerProfilesMap || {};

    const getSellerPhoto = (sellerName) => {
        if (!sellerName) return '';
        const targetUpper = String(sellerName).trim().toUpperCase();
        if (globalUser?.name && String(globalUser.name).trim().toUpperCase() === targetUpper && globalUser?.photoUrl !== undefined) {
            return globalUser.photoUrl || '';
        }
        const matchedUser = Object.values(usersDB || {}).find(u => u && String(u.name || '').trim().toUpperCase() === targetUpper);
        if (matchedUser && matchedUser.photoUrl !== undefined) {
            return matchedUser.photoUrl || '';
        }
        if (sellerProfilesMap[sellerName]?.photoUrl) {
            return sellerProfilesMap[sellerName].photoUrl;
        }
        const matchedProfileKey = Object.keys(sellerProfilesMap).find(k => String(k).trim().toUpperCase() === targetUpper);
        return matchedProfileKey ? (sellerProfilesMap[matchedProfileKey]?.photoUrl || '') : '';
    };

    const {
        topReceitaName, topReceitaName2, topReceitaName3,
        topPosName, topControleName, topAcessorioName,
        topAparelhoName, topResidencialName
    } = rankings;

    const getSellerMetrics = (sellerName) => {
        const base = sellerMetricsMap[sellerName] || {
            totalReceita: 0, volControle: 0, volPosPago: 0, volPosTotal: 0,
            volFibra: 0, volTv: 0, volUrTotal: 0, volAparelho: 0, volAcessorio: 0,
            volPelicula: 0, volSeguro: 0, volMesh: 0, volTrocafy: 0, volMPlay: 0
        };

        // Garante cálculo em tempo real de Migrações, Ativações e Portabilidade
        let volMigracao = base.volMigracao;
        let volAtivacao = base.volAtivacao;
        let volPortabilidade = base.volPortabilidade;

        if (volMigracao === undefined || volAtivacao === undefined || volPortabilidade === undefined) {
            volMigracao = 0;
            volAtivacao = 0;
            volPortabilidade = 0;
            (salesData || []).forEach(sale => {
                if (String(sale.vendedor || '') !== sellerName || !sale.data) return;
                let saleMonth = '';
                if (sale.data.includes('/')) {
                    const parts = sale.data.split('/');
                    if (parts.length === 3) saleMonth = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                } else if (sale.data.includes('-')) {
                    saleMonth = sale.data.slice(0, 7);
                }
                if (saleMonth !== monthFilter) return;

                const p = String(sale.produto || '').toUpperCase();
                const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
                const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
                const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
                const port = String(sale.portabilidade || '').toUpperCase();
                const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);

                const isMovelLine = p.includes('POS') || p.includes('PÓS') || p.includes('CONTROLE') || p.includes('DEPENDENTE') || p.includes('BANDA LARGA') || p.includes('FLEX') || pBase.includes('PME');
                const isMigra = op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA');
                const isPort = port === 'SIM' || op.includes('PORT');

                // Regra de Operações: Ativação não deve entrar Portabilidade, somente ativação pura
                if (isPort) {
                    volPortabilidade += q;
                } else if (isMigra) {
                    volMigracao += q;
                } else if (op.includes('ATIVA') || isMovelLine) {
                    volAtivacao += q;
                }
            });
        }

        return { ...base, volMigracao, volAtivacao, volPortabilidade };
    };

    const handleSellerClick = (seller) => {
        if (isVendedor && seller !== globalUser?.name && seller !== String(globalUser?.name || '')) {
            toast.error("Acesso restrito! Solicite a senha da Liderança para visualizar outro colaborador.");
            setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' });
        } else {
            setSelectedSeller(seller);
        }
    };

    // ================================================================
    // CÁLCULO DE TENDÊNCIA DE META (RUN RATE)
    // Ritmo Diário = Realizado ÷ Dias Corridos
    // Projeção = Ritmo Diário × Dias Totais do Mês
    // Tendência % = (Projeção ÷ Meta) × 100
    // ================================================================
    const { trendElapsedDays, trendTotalDays, isCurrentMonth } = (() => {
        const [yStr, mStr] = String(monthFilter || '').split('-');
        const yy = parseInt(yStr, 10);
        const mm = parseInt(mStr, 10);
        if (!yy || !mm) return { trendElapsedDays: null, trendTotalDays: null, isCurrentMonth: false };
        const total = new Date(yy, mm, 0).getDate();
        
        // Uso estrito do horário de São Paulo para evitar distorções de fuso horário
        const todayStr = getTodaySP();
        const [cyStr, cmStr, cdStr] = todayStr.split('-');
        const cy = parseInt(cyStr, 10);
        const cm = parseInt(cmStr, 10);
        const cd = parseInt(cdStr, 10);

        if (yy === cy && mm === cm) {
            return { trendElapsedDays: Math.max(1, cd), trendTotalDays: total, isCurrentMonth: true };
        }
        return { trendElapsedDays: null, trendTotalDays: null, isCurrentMonth: false };
    })();
    const trendProps = { elapsedDays: trendElapsedDays, totalDays: trendTotalDays, isCurrentMonth };

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
        <div className="flex flex-col min-h-full w-full max-w-full min-w-0 animate-fade-in transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3.5 sm:mb-6 gap-2.5 sm:gap-4 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F] shrink-0">
                        <Users size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 truncate">Desempenho da Equipe</h2>
                            <span className="bg-[#E3000F] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                                {safeVendedores.length} Vendedores
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">Acompanhe o atingimento de metas mês a mês.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-neutral-50 dark:bg-neutral-800 p-1.5 sm:p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto">
                    <Calendar size={16} className="text-neutral-500 dark:text-neutral-400 ml-1.5 sm:ml-2 shrink-0" />
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-transparent text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 cursor-pointer focus:text-[#E3000F] w-full sm:w-auto"
                    />
                </div>
            </div>

            {!selectedSeller ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
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
                            const pctRecMobile = (!isRestricted && metrics && individualMetas.receita > 0)
                                ? Math.round((metrics.totalReceita / individualMetas.receita) * 100)
                                : 0;
                            return (
                                <div key={seller} onClick={() => handleSellerClick(seller)} className="bg-white dark:bg-neutral-900 rounded-2xl p-3 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F]/30 dark:hover:border-[#E3000F]/50 active:scale-[0.98] sm:active:scale-100 transition-all cursor-pointer group relative overflow-hidden">
                                    {isRestricted && (
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-300 dark:text-neutral-600 group-hover:text-[#E3000F] dark:group-hover:text-[#E3000F] transition-colors" title="Acesso Sigiloso">
                                            <Lock size={15} />
                                        </div>
                                    )}
                                    {!isRestricted && metrics && (
                                        <div className="sm:hidden absolute top-3 right-3">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${pctRecMobile >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-red-50 text-[#E3000F] border-red-200/70 dark:bg-[#E3000F]/15 dark:text-red-400 dark:border-[#E3000F]/30'}`}>
                                                {pctRecMobile}% Meta
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2.5 sm:gap-4 mb-2.5 sm:mb-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#E3000F] font-bold text-sm sm:text-lg group-hover:bg-[#E3000F] group-hover:text-white transition-colors shrink-0 overflow-hidden border border-neutral-200 dark:border-neutral-700 ring-2 ring-[#E3000F]/15 sm:ring-0">
                                            {getSellerPhoto(seller) ? (
                                                <img src={getSellerPhoto(seller)} alt={seller} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                seller.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-14 sm:pr-2">
                                            <h3 className="font-extrabold sm:font-bold text-neutral-800 dark:text-neutral-100 text-sm sm:text-lg truncate leading-tight" title={seller}>{seller.split(' ').slice(0, 2).join(' ')}</h3>
                                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                                                <span className="text-[8.5px] sm:text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider">Vendedor</span>
                                                {isTopReceita && <span className="text-[8.5px] sm:text-[10px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com maior Receita"><Crown size={11} className="text-yellow-600 dark:text-yellow-500" /> Top 1</span>}
                                                {isTopReceita2 && <span className="text-[8.5px] sm:text-[10px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com a 2ª maior Receita"><Medal size={11} className="text-slate-500 dark:text-slate-400" /> Top 2</span>}
                                                {isTopReceita3 && <span className="text-[8.5px] sm:text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com a 3ª maior Receita"><Medal size={11} className="text-amber-600 dark:text-amber-500" /> Top 3</span>}
                                                {isTopPos && <span className="text-[8.5px] sm:text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com mais Pós-pago"><Medal size={11} className="text-blue-600 dark:text-blue-500" /> Destaque Pós</span>}
                                                {isTopControle && <span className="text-[8.5px] sm:text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com mais Controle"><Medal size={11} className="text-purple-600 dark:text-purple-500" /> Destaque Controle</span>}
                                                {isTopAparelho && <span className="text-[8.5px] sm:text-[10px] font-bold text-pink-700 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com mais Aparelhos"><Medal size={11} className="text-pink-600 dark:text-pink-500" /> Destaque Aparelho</span>}
                                                {isTopAcessorio && <span className="text-[8.5px] sm:text-[10px] font-bold text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com mais Acessórios"><Medal size={11} className="text-orange-600 dark:text-orange-500" /> Destaque Acessórios</span>}
                                                {isTopResidencial && <span className="text-[8.5px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1" title="Vendedor com mais Vendas Residenciais"><Medal size={11} className="text-emerald-600 dark:text-emerald-500" /> Destaque Residencial</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2.5 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        {isRestricted ? (
                                            <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-0 py-1 sm:py-2 opacity-50">
                                                <Lock size={16} className="sm:mb-1 text-neutral-400 dark:text-neutral-500" />
                                                <span className="text-[9.5px] sm:text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Acesso Sigiloso</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* VISUAL LÚDICO DE APLICATIVO SOMENTE NO CELULAR (< 640px) */}
                                                <div className="sm:hidden space-y-2">
                                                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${pctRecMobile >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#E3000F] to-rose-500'}`}
                                                            style={{ width: `${Math.min(pctRecMobile, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        <div className="bg-red-50/60 dark:bg-[#E3000F]/10 border border-red-100/80 dark:border-[#E3000F]/20 rounded-xl p-1.5 text-center min-w-0">
                                                            <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#E3000F] truncate">Receita</div>
                                                            <div className="text-[11px] font-black text-neutral-900 dark:text-white truncate mt-0.5">{applyCurrencyMask(metrics.totalReceita)}</div>
                                                            <div className="text-[7.5px] font-semibold text-neutral-400 dark:text-neutral-500 truncate">/ {applyCurrencyMask(individualMetas.receita)}</div>
                                                        </div>
                                                        <div className="bg-blue-50/60 dark:bg-blue-950/25 border border-blue-100/80 dark:border-blue-900/30 rounded-xl p-1.5 text-center min-w-0">
                                                            <div className="text-[8px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">Pós Total</div>
                                                            <div className="text-xs font-black text-neutral-900 dark:text-white leading-tight mt-0.5">
                                                                {metrics.volPosTotal} <span className="text-[8.5px] font-bold text-neutral-400">/ {Number.isInteger(individualMetas.posTotal) ? individualMetas.posTotal : individualMetas.posTotal.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100/80 dark:border-emerald-900/30 rounded-xl p-1.5 text-center min-w-0">
                                                            <div className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">UR Total</div>
                                                            <div className="text-xs font-black text-neutral-900 dark:text-white leading-tight mt-0.5">
                                                                {metrics.volUrTotal} <span className="text-[8.5px] font-bold text-neutral-400">/ {Number.isInteger(individualMetas.urTotal) ? individualMetas.urTotal : individualMetas.urTotal.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* VISUAL PADRÃO DESKTOP / TABLET (>= 640px) */}
                                                <div className="hidden sm:block space-y-3">
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
                <div className="flex flex-col h-full w-full max-w-full min-w-0 animate-fade-in transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3.5 sm:mb-4 bg-white dark:bg-neutral-900 p-3.5 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm gap-3 sm:gap-4 shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <button onClick={() => setSelectedSeller(null)} className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300 transition-colors shrink-0">
                                <ArrowLeft size={18} />
                            </button>
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#E3000F] font-bold text-sm sm:text-base shrink-0 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                {getSellerPhoto(selectedSeller) ? (
                                    <img src={getSellerPhoto(selectedSeller)} alt={selectedSeller} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    String(selectedSeller || '').charAt(0)
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 flex-wrap truncate">Desempenho: <span className="text-[#E3000F] uppercase truncate">{selectedSeller}</span></h2>
                                <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">Acompanhamento detalhado de Meta x Realizado.</p>
                            </div>
                        </div>
                        <div className="md:min-w-[300px] lg:min-w-[340px] w-full md:w-auto mt-1 md:mt-0">
                            <ProgressBar label="RECEITA TOTAL" realizado={getSellerMetrics(selectedSeller).totalReceita} meta={individualMetas.receita} isCurrency={true} isDark={false} {...trendProps} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:flex overflow-x-auto scrollbar-hide bg-neutral-200/70 dark:bg-neutral-900 sm:bg-transparent p-1 sm:p-0 rounded-xl sm:rounded-none sm:border-b border-neutral-200 dark:border-neutral-800 mb-4 sm:mb-6 shrink-0 gap-1 sm:gap-0" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                        <button onClick={() => setActiveSubTab('DESEMPENHO')} className={`px-2 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-black sm:font-bold uppercase tracking-tight sm:tracking-wider transition-all rounded-lg sm:rounded-none sm:border-b-2 truncate ${activeSubTab === 'DESEMPENHO' ? 'bg-white dark:bg-neutral-800 sm:bg-white sm:dark:bg-neutral-900 text-[#E3000F] shadow-sm sm:shadow-none sm:border-[#E3000F]' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>DASHBOARD</button>
                        <button onClick={() => setActiveSubTab('DIARIO')} className={`px-2 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-black sm:font-bold uppercase tracking-tight sm:tracking-wider transition-all rounded-lg sm:rounded-none sm:border-b-2 truncate ${activeSubTab === 'DIARIO' ? 'bg-white dark:bg-neutral-800 sm:bg-white sm:dark:bg-neutral-900 text-[#E3000F] shadow-sm sm:shadow-none sm:border-[#E3000F]' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Resultado Diário</button>
                        <button onClick={() => setActiveSubTab('NECESSIDADE_DIARIA')} className={`px-2 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-black sm:font-bold uppercase tracking-tight sm:tracking-wider transition-all rounded-lg sm:rounded-none sm:border-b-2 truncate ${activeSubTab === 'NECESSIDADE_DIARIA' ? 'bg-white dark:bg-neutral-800 sm:bg-white sm:dark:bg-neutral-900 text-[#E3000F] shadow-sm sm:shadow-none sm:border-[#E3000F]' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Necessidade Diária</button>
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
                            <div className="flex-1 pb-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-thin">
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-6">
                                        <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg"><Target size={18} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm sm:text-lg uppercase tracking-wide">Necessidade Diária</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-6">
                                        Acompanhe quanto você precisa vender diariamente para atingir as metas do mês atual. O cálculo divide o saldo restante pelos dias que faltam para o mês acabar.
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                                        {necessidadeData.map((ind, i) => (
                                            <div key={i} className="bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-[#E3000F]/30 transition-colors min-w-0">
                                                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider sm:tracking-widest mb-1 truncate">{ind.label}</div>
                                                <div className={`text-sm sm:text-xl font-black truncate ${ind.label === 'Receita (R$)' ? 'text-[#E3000F]' : 'text-neutral-800 dark:text-neutral-100'}`}>
                                                    {ind.nec.isBatida ? <span className="text-xs sm:text-sm font-bold text-green-500">Meta Batida 🎉</span> :
                                                        ind.nec.isEncerrado ? <span className="text-xs sm:text-sm font-bold text-neutral-400">Mês encerrado</span> :
                                                            (ind.isCurrency ? applyCurrencyMask(ind.nec.porDia) + ' /dia' : Math.ceil(ind.nec.porDia) + ' /dia')}
                                                </div>
                                                <div className="text-[8.5px] sm:text-[9px] text-neutral-400 dark:text-neutral-500 mt-1.5 sm:mt-2 font-bold truncate">
                                                    Faltam: {ind.isCurrency ? applyCurrencyMask(ind.nec.faltam) : ind.nec.faltam.toFixed(0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })() : activeSubTab === 'DESEMPENHO' ? (
                        <div className="flex-1 pb-6 space-y-4 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm lg:col-span-2 flex flex-col relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Smartphone size={150} /></div>
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg"><Smartphone size={18} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm sm:text-lg uppercase tracking-wide">GROSS TOTAL</h3>
                                    </div>
                                    <div className="mb-5 sm:mb-8">
                                        <ProgressBar label="PÓS TOTAL (Pós + Controle + Dependentes + Flex)" realizado={getSellerMetrics(selectedSeller).volPosTotal} meta={individualMetas.posTotal} {...trendProps} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 sm:gap-y-4 pt-4 sm:pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                                        <ProgressBar label="Individual: PÓS-PAGO" realizado={getSellerMetrics(selectedSeller).volPosPago} meta={individualMetas.posPago} {...trendProps} />
                                        <ProgressBar label="Individual: CONTROLE" realizado={getSellerMetrics(selectedSeller).volControle} meta={individualMetas.controle} {...trendProps} />
                                    </div>
                                </div>

                                <div className="bg-neutral-900 dark:bg-neutral-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-white flex flex-col relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 p-8 opacity-10 pointer-events-none"><Home size={120} /></div>
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <div className="p-2 bg-neutral-700 text-white rounded-lg"><Home size={18} /></div>
                                        <h3 className="font-bold text-white text-sm sm:text-lg uppercase tracking-wide">UR-Residencial</h3>
                                    </div>
                                    <div className="mb-5 sm:mb-8"><ProgressBar label="UR TOTAL (Fibra + TV)" realizado={getSellerMetrics(selectedSeller).volUrTotal} meta={individualMetas.urTotal} isDark={true} {...trendProps} /></div>
                                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-auto pt-4 sm:pt-6 border-t border-neutral-700 dark:border-neutral-800">
                                        <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-3 sm:p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1"><Zap size={13} className="text-[#E3000F]" />Fibras</span>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl sm:text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volFibra}</span><span className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-0.5">/ {Number.isInteger(individualMetas.fibra) ? individualMetas.fibra : individualMetas.fibra.toFixed(1)}</span></div>
                                        </div>
                                        <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-3 sm:p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1"><MonitorPlay size={13} className="text-[#E3000F]" /> TV BOX</span>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl sm:text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volTv}</span><span className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-0.5">/ {Number.isInteger(individualMetas.tv) ? individualMetas.tv : individualMetas.tv.toFixed(1)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg"><Watch size={18} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm uppercase tracking-wide">DEVICES</h3>
                                    </div>
                                    <div className="space-y-4 sm:space-y-6 mt-auto">
                                        <ProgressBar label="Aparelhos" realizado={getSellerMetrics(selectedSeller).volAparelho} meta={individualMetas.aparelho} {...trendProps} />
                                        <ProgressBar label="Acessórios" realizado={getSellerMetrics(selectedSeller).volAcessorio} meta={individualMetas.acessorio} {...trendProps} />
                                        <ProgressBar label="Películas" realizado={getSellerMetrics(selectedSeller).volPelicula} meta={individualMetas.pelicula} {...trendProps} />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-lg"><ShieldCheck size={18} /></div>
                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm uppercase tracking-wide">SERVIÇOS ADICIONAIS</h3>
                                    </div>
                                    <div className="space-y-3.5 sm:space-y-4 mt-auto">
                                        <ProgressBar label="Seguro (Proteção Móvel)" realizado={getSellerMetrics(selectedSeller).volSeguro} meta={individualMetas.seguro} {...trendProps} />
                                        <ProgressBar label="Anexação M-Play" realizado={getSellerMetrics(selectedSeller).volMPlay} meta={individualMetas.mplay} {...trendProps} />
                                        <ProgressBar label="Trocafy" realizado={getSellerMetrics(selectedSeller).volTrocafy} meta={individualMetas.trocafy} {...trendProps} />
                                        <ProgressBar label="Equipamento MESH" realizado={getSellerMetrics(selectedSeller).volMesh} meta={individualMetas.mesh} {...trendProps} />
                                    </div>
                                </div>

                                {(() => {
                                    const m = getSellerMetrics(selectedSeller);
                                    const qtdAtivacao = Number(m.volAtivacao) || 0;
                                    const qtdMigracao = Number(m.volMigracao) || 0;
                                    const qtdPortabilidade = Number(m.volPortabilidade) || 0;
                                    const totalOp = (qtdAtivacao + qtdMigracao + qtdPortabilidade) || 0;

                                    const pctAtivacao = totalOp > 0 ? Math.round((qtdAtivacao / totalOp) * 100) : 0;
                                    const pctMigracao = totalOp > 0 ? Math.round((qtdMigracao / totalOp) * 100) : 0;
                                    const pctPortabilidade = totalOp > 0 ? Math.round((qtdPortabilidade / totalOp) * 100) : 0;

                                    const statusItems = [
                                        {
                                            label: 'ATIVAÇÕES PURAS',
                                            qtd: qtdAtivacao,
                                            pct: pctAtivacao,
                                            barColor: 'bg-[#E3000F]',
                                            badgeStyle: 'bg-red-100 text-[#E3000F] dark:bg-[#E3000F]/20 dark:text-red-400'
                                        },
                                        {
                                            label: 'MIGRAÇÕES',
                                            qtd: qtdMigracao,
                                            pct: pctMigracao,
                                            barColor: 'bg-amber-500',
                                            badgeStyle: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        },
                                        {
                                            label: 'PORTABILIDADE',
                                            qtd: qtdPortabilidade,
                                            pct: pctPortabilidade,
                                            barColor: 'bg-emerald-500',
                                            badgeStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }
                                    ];

                                    return (
                                        <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col relative overflow-hidden">
                                            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg shrink-0">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm uppercase tracking-wide truncate">STATUS DE OPERAÇÕES</h3>
                                                        <p className="text-[9.5px] sm:text-[10px] font-medium text-neutral-400 dark:text-neutral-500 truncate">Ativação Pura, Migrações e Portabilidade</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shrink-0">
                                                    {totalOp} Gross
                                                </span>
                                            </div>

                                            <div className="space-y-3 sm:space-y-5 mt-auto">
                                                {statusItems.map((st, idx) => (
                                                    <div key={idx} className="bg-neutral-50/70 dark:bg-neutral-800/40 p-2.5 sm:p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                                        <div className="flex justify-between items-end mb-1.5 sm:mb-2 gap-2">
                                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 truncate">{st.label}</span>
                                                            <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0">
                                                                <span className="text-lg sm:text-2xl font-black text-neutral-800 dark:text-neutral-100 leading-none">{st.qtd}</span>
                                                                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-500">un</span>
                                                                <span className={`text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md ${st.badgeStyle}`}>
                                                                    {st.pct}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-2 sm:h-2.5 overflow-hidden">
                                                            <div
                                                                className={`${st.barColor} h-full rounded-full transition-all duration-1000`}
                                                                style={{ width: `${Math.min(st.pct, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ===================== ANÁLISE DETALHADA DE ANEXAÇÃO ===================== */}
                                {(() => {
                                    const m = getSellerMetrics(selectedSeller);
                                    const aparelhos = Number(m.volAparelho) || 0;
                                    // Regras de anexação por aparelho vendido
                                    const regras = [
                                        { key: 'pelicula', label: 'Películas', ratio: 1, real: Number(m.volPelicula) || 0, regra: '1 película por aparelho', color: 'bg-sky-500' },
                                        { key: 'acessorio', label: 'Acessórios', ratio: 3, real: Number(m.volAcessorio) || 0, regra: '3 acessórios por aparelho', color: 'bg-orange-500' },
                                        { key: 'seguro', label: 'Seguro', ratio: 1, real: Number(m.volSeguro) || 0, regra: '1 seguro por aparelho (1:1)', color: 'bg-blue-600' },
                                        { key: 'trocafy', label: 'Trocafy', ratio: 1, real: Number(m.volTrocafy) || 0, regra: '1 Trocafy por aparelho (1:1)', color: 'bg-violet-500' }
                                    ].map(r => {
                                        const esperado = aparelhos * r.ratio;
                                        const perdido = Math.max(0, esperado - r.real);
                                        const pct = esperado > 0 ? Math.round((r.real / esperado) * 100) : 0;
                                        return { ...r, esperado, perdido, pct };
                                    });
                                    const totalEsperado = regras.reduce((a, r) => a + r.esperado, 0);
                                    const totalReal = regras.reduce((a, r) => a + Math.min(r.real, r.esperado), 0);
                                    const totalPerdido = regras.reduce((a, r) => a + r.perdido, 0);
                                    const indiceGeral = totalEsperado > 0 ? Math.round((totalReal / totalEsperado) * 100) : 0;

                                    return (
                                        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg shrink-0"><Watch size={18} /></div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm uppercase tracking-wide truncate">ANÁLISE DE ANEXAÇÃO</h3>
                                                        <p className="text-[9.5px] sm:text-[10px] font-medium text-neutral-400 dark:text-neutral-500 truncate">Base: {aparelhos} aparelho(s) vendido(s) no mês</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${indiceGeral >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : indiceGeral >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' : 'bg-red-50 text-[#E3000F] border-red-200 dark:bg-[#E3000F]/15 dark:text-red-400 dark:border-[#E3000F]/30'}`}>
                                                    Índice: {indiceGeral}%
                                                </span>
                                            </div>

                                            {aparelhos === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-neutral-400 dark:text-neutral-500">
                                                    <Smartphone size={28} className="mb-2 opacity-40" />
                                                    <span className="text-xs font-bold">Nenhum aparelho vendido no período.</span>
                                                    <span className="text-[10px]">A anexação é calculada a partir de cada aparelho vendido.</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                                        {regras.map(r => (
                                                            <div key={r.key} className="bg-neutral-50/70 dark:bg-neutral-800/40 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 min-w-0">
                                                                <div className="flex justify-between items-center gap-2 mb-1">
                                                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 whitespace-nowrap truncate">{r.label}</span>
                                                                    <span className={`text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${r.pct >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-[#E3000F] dark:bg-red-900/30 dark:text-red-400'}`}>{r.pct}%</span>
                                                                </div>
                                                                <div className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mb-2 whitespace-nowrap truncate">Regra: {r.regra}</div>
                                                                <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-2 overflow-hidden mb-2">
                                                                    <div className={`${r.pct >= 100 ? 'bg-green-500' : r.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${Math.min(r.pct, 100)}%` }} />
                                                                </div>
                                                                <div className="flex justify-between items-center gap-2 text-[10px] sm:text-[11px] font-bold">
                                                                    <span className="text-neutral-600 dark:text-neutral-300 whitespace-nowrap">Feito: <strong className="text-neutral-900 dark:text-white">{r.real}</strong> / {r.esperado}</span>
                                                                    {r.perdido > 0 ? (
                                                                        <span className="text-[#E3000F] dark:text-red-400 whitespace-nowrap">Deixou de anexar: {r.perdido}</span>
                                                                    ) : (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Anexação completa ✓</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 sm:mt-4 p-3 rounded-2xl bg-neutral-900 dark:bg-neutral-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300">Oportunidades não anexadas no mês</span>
                                                        <span className="text-sm sm:text-base font-black text-amber-300 whitespace-nowrap">{totalPerdido} itens ({totalReal} de {totalEsperado} esperados)</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* ===================== RANKING DE OPERADORAS (PORTABILIDADE) ===================== */}
                                {(() => {
                                    const counts = {};
                                    (salesData || []).forEach(sale => {
                                        if (String(sale.vendedor || '').trim().toUpperCase() !== String(selectedSeller || '').trim().toUpperCase()) return;
                                        if (String(sale.portabilidade || '').toUpperCase() !== 'SIM' || !sale.data) return;
                                        let saleMonth = '';
                                        if (sale.data.includes('/')) {
                                            const parts = sale.data.split('/');
                                            if (parts.length === 3) saleMonth = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                                        } else if (sale.data.includes('-')) {
                                            saleMonth = sale.data.slice(0, 7);
                                        }
                                        if (saleMonth !== monthFilter) return;
                                        const op = String(sale.operadoraOrigem || 'NÃO INFORMADA').trim().toUpperCase() || 'NÃO INFORMADA';
                                        const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                                        counts[op] = (counts[op] || 0) + q;
                                    });
                                    const lista = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                                    const totalPort = lista.reduce((a, [, v]) => a + v, 0);
                                    const lider = lista[0];

                                    return (
                                        <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0"><Target size={18} /></div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm uppercase tracking-wide truncate">PORTABILIDADE POR OPERADORA</h3>
                                                        <p className="text-[9.5px] sm:text-[10px] font-medium text-neutral-400 dark:text-neutral-500 truncate">De onde vêm os clientes portados</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shrink-0 whitespace-nowrap">{totalPort} Port.</span>
                                            </div>

                                            {lista.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-neutral-400 dark:text-neutral-500">
                                                    <Target size={28} className="mb-2 opacity-40" />
                                                    <span className="text-xs font-bold">Nenhuma portabilidade no período.</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Mais pedidos de portabilidade</span>
                                                            <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white whitespace-nowrap truncate">{lider[0]}</span>
                                                        </div>
                                                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 shrink-0">{totalPort > 0 ? Math.round((lider[1] / totalPort) * 100) : 0}%</span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {lista.map(([op, qtd], idx) => {
                                                            const pct = totalPort > 0 ? Math.round((qtd / totalPort) * 100) : 0;
                                                            return (
                                                                <div key={op} className="min-w-0">
                                                                    <div className="flex justify-between items-center mb-1 gap-2">
                                                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 whitespace-nowrap truncate">{idx + 1}º {op}</span>
                                                                        <span className="text-[10px] sm:text-xs font-black text-neutral-800 dark:text-neutral-100 shrink-0 whitespace-nowrap">{qtd} un • {pct}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                                                        <div className={`${idx === 0 ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-500'} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
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