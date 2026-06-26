import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Target, Crown, Map, ChevronLeft, Medal, Trophy } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';

const STORES = [
    { id: 'uniao_osasco', name: 'UNIÃO OSASCO', code: 'AT1M' },
    { id: 'calcadao', name: 'CALÇADÃO OSASCO', code: 'LB32' },
    { id: 'lapa', name: 'LAPA', code: 'FKJ6' },
    { id: 'shopping_bourbon', name: 'BOURBON', code: 'LB46' },
    { id: 'shopping_butanta', name: 'BUTANTÃ', code: 'G5Z9' },
    { id: 'shopping_higienopolis', name: 'HIGIENÓPOLIS', code: 'LB24' },
    { id: 'shopping_villa_lobos', name: 'VILLA LOBOS', code: 'LB43' },
    { id: 'shopping_west_plaza', name: 'WEST PLAZA', code: 'LB36' },
];

const INDICATORS = [
    { key: 'receita', label: 'RECEITA (R$)', isCurrency: true },
    { key: 'gross', label: 'GROSS TOTAL' },
    { key: 'posTotal', label: 'PÓS-PAGO' },
    { key: 'controleTotal', label: 'CONTROLE' },
    { key: 'urTotal', label: 'UR TOTAL' },
    { key: 'fibra', label: 'FIBRA' },
    { key: 'tv', label: 'TV+' },
    { key: 'aparelho', label: 'APARELHO' },
    { key: 'acessorio', label: 'ACESSÓRIO' },
    { key: 'seguro', label: 'SEGURO' },
    { key: 'pelicula', label: 'PELÍCULA' },
    { key: 'mplay', label: 'M-PLAY' }
];

const CURRENT_STORE_ID = import.meta.env.VITE_STORE_ID || 'uniao_osasco';

export const AreaLojas = ({ globalMonth }) => {
    const [loading, setLoading] = useState(true);
    const [storesData, setStoresData] = useState([]);
    const [globalSellers, setGlobalSellers] = useState([]);
    const [focusedIndicator, setFocusedIndicator] = useState(null);

    useEffect(() => {
        const fetchAllStores = async () => {
            setLoading(true);
            const newStoresData = [];
            const sellerMap = {};
            const API_URL = import.meta.env.VITE_API_URL || 'https://api-painel.137.131.172.16.nip.io';
            const startStr = `${globalMonth}-01`;
            const endStr = `${globalMonth}-31T23:59:59`;

            for (const store of STORES) {
                try {
                    let sales = [];
                    let configData = {};
                    try {
                        const [vendasRes, configRes] = await Promise.all([
                            fetch(`${API_URL}/api/vendas?storeId=${store.id}&start=${startStr}&end=${endStr}&_t=${Date.now()}`),
                            fetch(`${API_URL}/api/config?storeId=${store.id}`)
                        ]);
                        if (vendasRes.ok) sales = await vendasRes.json();
                        if (configRes.ok) configData = await configRes.json();
                    } catch (apiErr) {
                        console.error(`Erro ao buscar dados da API para loja ${store.id}:`, apiErr);
                        continue;
                    }

                    const metasDoc = configData.goalsDB || {};
                    const storeMeta = metasDoc[globalMonth] || {};

                    let receita = 0, gross = 0, posPago = 0, controle = 0, urTotal = 0;
                    let fibraTotal = 0, tvTotal = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0, mplay = 0;

                    sales.forEach(sale => {
                        if (!sale.data || typeof sale.data !== 'string') return;
                        if (!sale.vendedor) return;

                        let isCurrentMonth = false;
                        if (sale.data.includes('/')) {
                            const parts = sale.data.split('/');
                            if (parts.length === 3) {
                                const m = parts[1].padStart(2, '0');
                                if (`${parts[2]}-${m}` === globalMonth) isCurrentMonth = true;
                            }
                        } else if (sale.data.includes('-')) {
                            if (sale.data.slice(0, 7) === globalMonth) isCurrentMonth = true;
                        }
                        if (!isCurrentMonth) return;

                        let valString = sale.receita !== undefined ? sale.receita : sale.valor_total;
                        if (typeof valString === 'string') valString = valString.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
                        let receitaNum = Number(valString || 0);
                        if (isNaN(receitaNum)) receitaNum = 0;
                        receita += receitaNum;

                        let posTt = 0, controleLc = 0, depPg = 0, depBl = 0, depGratis = 0, bl = 0, flex = 0;
                        let migracaoPos = 0, migracaoControle = 0, grossPme = 0, urPme = 0;
                        let fibra = 0, tv = 0, tvBox = 0, fixo = 0, qAparelho = 0, qAcessorio = 0, qPelicula = 0, qSeguro = 0, qMplay = 0;

                        const pBase = String(sale.produto || '').toUpperCase();
                        const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                        const op = String(sale.operacao || '').toUpperCase();
                        const sub = String(sale.subProduto || '').toUpperCase();

                        if (pBase.includes('PME') && !pBase.includes('FIBRA')) { grossPme += q; }
                        else if (pBase.includes('PÓS') || pBase.includes('POS')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q; else posTt += q; }
                        else if (pBase.includes('CONTROLE')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else controleLc += q; }
                        else if (pBase.includes('FLEX')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else flex += q; }
                        else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) { if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q; else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA')) depBl += q; else depPg += q; }
                        else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('CLARO NET VIRTUA')) bl += q;
                        else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
                        else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
                        else if (pBase.includes('TV-BOX')) tvBox += q;
                        else if (pBase.includes('CLARO TV+') || pBase.includes('TV')) tv += q;
                        else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
                        else if (pBase.includes('APARELHO')) { qAparelho += q; }
                        else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { qAcessorio += q; }
                        else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { qPelicula += q; }
                        else if (pBase.includes('SEGURO')) qSeguro += q;

                        if (sale.mplay === 'SIM') qMplay += 1;

                        const saleGross = (posTt + controleLc + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
                        const salePosTotal = (posTt + migracaoPos);
                        const saleControle = (controleLc + migracaoControle);
                        const saleUrTotal = (fibra + tv + tvBox + fixo + urPme);
                        const saleFibra = (fibra + bl);
                        const saleTv = (tv + tvBox);

                        gross += saleGross;
                        posPago += salePosTotal;
                        controle += saleControle;
                        urTotal += saleUrTotal;
                        fibraTotal += saleFibra;
                        tvTotal += saleTv;
                        aparelho += qAparelho;
                        acessorio += qAcessorio;
                        pelicula += qPelicula;
                        seguro += qSeguro;
                        mplay += qMplay;

                        // Add to seller map
                        const v = sale.vendedor;
                        const sellerKey = store.id + '_' + v;
                        if (!sellerMap[sellerKey]) {
                            sellerMap[sellerKey] = {
                                id: sellerKey,
                                nomeCompleto: v,
                                storeName: store.name,
                                receita: 0, gross: 0, posTotal: 0, controleTotal: 0, urTotal: 0,
                                fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
                            };
                        }
                        
                        sellerMap[sellerKey].receita += receitaNum;
                        sellerMap[sellerKey].gross += saleGross;
                        sellerMap[sellerKey].posTotal += salePosTotal;
                        sellerMap[sellerKey].controleTotal += saleControle;
                        sellerMap[sellerKey].urTotal += saleUrTotal;
                        sellerMap[sellerKey].fibra += saleFibra;
                        sellerMap[sellerKey].tv += saleTv;
                        sellerMap[sellerKey].aparelho += qAparelho;
                        sellerMap[sellerKey].acessorio += qAcessorio;
                        sellerMap[sellerKey].pelicula += qPelicula;
                        sellerMap[sellerKey].seguro += qSeguro;
                        sellerMap[sellerKey].mplay += qMplay;
                    });

                    const metaReceita = Number(storeMeta.receita) || 0;
                    const metaGross = Number(storeMeta.posTotal) || 0;
                    const rPct = metaReceita > 0 ? (receita / metaReceita) * 100 : 0;
                    const gPct = metaGross > 0 ? (gross / metaGross) * 100 : 0;

                    newStoresData.push({
                        ...store,
                        receita, gross, posPago, controle, urTotal,
                        fibra: fibraTotal, tv: tvTotal, aparelho, acessorio, pelicula, seguro, mplay,
                        metaReceita, metaGross,
                        metaPosPago: Number(storeMeta.posPago) || 0,
                        metaControle: Number(storeMeta.controle) || 0,
                        metaUrTotal: Number(storeMeta.urTotal) || 0,
                        metaFibra: Number(storeMeta.fibra) || 0,
                        metaTv: Number(storeMeta.tv) || 0,
                        metaAparelho: Number(storeMeta.aparelho) || 0,
                        metaAcessorio: Number(storeMeta.acessorio) || 0,
                        metaPelicula: Number(storeMeta.pelicula) || 0,
                        metaSeguro: Number(storeMeta.seguro) || 0,
                        metaMplay: Number(storeMeta.mplay) || 0,
                        rPct, gPct,
                        totalScore: rPct + gPct
                    });

                } catch (error) {
                    console.error(`Erro ao buscar dados da loja ${store.id}:`, error);
                }
            }

            newStoresData.sort((a, b) => b.totalScore - a.totalScore);
            setStoresData(newStoresData);
            setGlobalSellers(Object.values(sellerMap));
            setLoading(false);
        };

        if (globalMonth) fetchAllStores();
    }, [globalMonth]);

    const getRankedSellers = (key) => {
        return [...globalSellers]
            .filter(v => v[key] > 0)
            .sort((a, b) => b[key] - a[key]);
    };

    const renderIndicatorRow = (label, real, meta, isCurrency = false) => {
        const rVal = Number(real) || 0;
        const mVal = Number(meta) || 0;
        const pct = mVal > 0 ? (rVal / mVal) * 100 : (rVal > 0 ? 100 : 0);
        
        let pctColor = 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
        if (pct >= 100) pctColor = 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        else if (pct >= 80) pctColor = 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        else if (mVal > 0) pctColor = 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    
        const format = (v) => isCurrency ? applyCurrencyMask(v) : v;
    
        return (
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-2 rounded-md transition-colors group">
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{label}</span>
                    <span className="font-black text-[12px] text-neutral-800 dark:text-neutral-200 leading-tight mt-0.5 whitespace-nowrap">{format(rVal)}</span>
                </div>
                
                {mVal > 0 ? (
                    <div className="flex items-center justify-end gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-neutral-400 uppercase tracking-widest">Meta</span>
                            <span className="font-bold text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 whitespace-nowrap">{format(mVal)}</span>
                        </div>
                        <div className="flex flex-col items-end min-w-[42px]">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${pctColor}`}>
                                {pct.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-end shrink-0">
                        <span className="text-[9px] font-bold text-neutral-400 italic bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">S/ meta</span>
                    </div>
                )}
            </div>
        );
    };

    const renderStoreCard = (store, index) => {
        const isCurrentStore = store.id === CURRENT_STORE_ID;

        return (
            <div key={store.id} className={`shrink-0 w-80 relative flex flex-col bg-white dark:bg-neutral-900 rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden snap-start ${isCurrentStore ? 'border-[#E3000F] shadow-md shadow-red-500/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                {isCurrentStore && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#E3000F] text-white text-[9px] font-black tracking-wider px-3 py-0.5 rounded-b-md flex items-center gap-1 z-10">
                        <Target size={10} /> SUA LOJA
                    </div>
                )}
                
                <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-20 ${isCurrentStore ? 'bg-red-50/90 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 backdrop-blur-md' : 'bg-neutral-50/90 dark:bg-neutral-900/90 border-neutral-100 dark:border-neutral-800 backdrop-blur-md'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-inner ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-neutral-200 text-neutral-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}>
                            {index + 1}º
                        </div>
                        <div>
                            <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-[13px] uppercase tracking-tight leading-tight">{store.name}</h3>
                            <p className="text-[9px] text-neutral-400 font-bold tracking-widest">{store.code}</p>
                        </div>
                    </div>
                    {index === 0 && <Crown className="text-yellow-500" size={20} />}
                </div>

                <div className="p-3 px-4 flex flex-col overflow-y-auto max-h-[40vh] custom-scrollbar">
                    {renderIndicatorRow('RECEITA (R$)', store.receita, store.metaReceita, true)}
                    {renderIndicatorRow('GROSS TOTAL', store.gross, store.metaGross)}
                    {renderIndicatorRow('PÓS-PAGO', store.posPago, store.metaPosPago)}
                    {renderIndicatorRow('CONTROLE', store.controle, store.metaControle)}
                    {renderIndicatorRow('UR TOTAL', store.urTotal, store.metaUrTotal)}
                    {renderIndicatorRow('FIBRA', store.fibra, store.metaFibra)}
                    {renderIndicatorRow('TV+', store.tv, store.metaTv)}
                    {renderIndicatorRow('APARELHO', store.aparelho, store.metaAparelho)}
                    {renderIndicatorRow('ACESSÓRIO', store.acessorio, store.metaAcessorio)}
                    {renderIndicatorRow('SEGURO', store.seguro, store.metaSeguro)}
                    {renderIndicatorRow('PELÍCULA', store.pelicula, store.metaPelicula)}
                    {renderIndicatorRow('M-PLAY', store.mplay, store.metaMplay)}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-fade-in bg-neutral-50/50 dark:bg-neutral-950/50">
            {/* Header Fixo */}
            <div className="p-6 md:p-8 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                <div className="max-w-[1400px] mx-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-[#E3000F] rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                        <Map size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">Área Lojas</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Comparativo de performance entre vendedores de todas as lojas. (Mês: {globalMonth?.split('-').reverse().join('/')})</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 mt-20">
                        <Loader2 size={40} className="animate-spin mb-4 text-[#E3000F]" />
                        <p className="font-bold tracking-wide">Cruzando banco de dados de todas as filiais...</p>
                        <p className="text-xs mt-2">Isso pode levar alguns segundos.</p>
                    </div>
                ) : (
                    <div className="pb-10">
                        {/* Carrossel de Lojas */}
                        <div className="bg-neutral-100/50 dark:bg-neutral-950 py-6 border-b border-neutral-200 dark:border-neutral-800">
                            <div className="max-w-[1400px] mx-auto px-6 md:px-8">
                                <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
                                    <Target className="text-[#E3000F]" size={20} />
                                    PLACAR DAS LOJAS
                                </h2>
                                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 custom-scrollbar">
                                    {storesData.map((store, index) => renderStoreCard(store, index))}
                                </div>
                            </div>
                        </div>

                        {/* Seção Inferior: Indicadores e Ranking */}
                        <div className="max-w-[1400px] mx-auto px-6 md:px-8 pt-8">
                            {!focusedIndicator ? (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100">Destaques por Indicador</h2>
                                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                            Veja o Top 3 de vendedores que mais performam entre todas as lojas da rede. Clique num indicador para ver a lista completa.
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
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        {ranking.length === 0 ? (
                                                            <div className="text-sm text-neutral-400 italic">Sem dados.</div>
                                                        ) : (
                                                            ranking.map((seller, idx) => (
                                                                <div key={seller.id} className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                                                                        <span className="font-bold text-neutral-400 w-4 text-xs">{idx + 1}º</span>
                                                                        <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate">
                                                                            {seller.nomeCompleto.split(' ')[0]}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-black text-neutral-900 dark:text-white shrink-0">
                                                                        {ind.isCurrency ? applyCurrencyMask(seller[ind.key]) : seller[ind.key]}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    <button
                                        onClick={() => setFocusedIndicator(null)}
                                        className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800"
                                    >
                                        <ChevronLeft size={18} />
                                        <span className="font-bold text-sm">Voltar aos Indicadores</span>
                                    </button>

                                    <div className="text-center mb-10">
                                        <h2 className="text-3xl font-black text-neutral-800 dark:text-neutral-100 flex items-center justify-center gap-3">
                                            <Trophy className="text-[#E3000F]" size={32} />
                                            DESTAQUES: {focusedIndicator.label}
                                        </h2>
                                        <p className="text-neutral-500 mt-2">Comparativo de performance entre os vendedores de todas as lojas</p>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col gap-4">
                                        {(() => {
                                            const ranking = getRankedSellers(focusedIndicator.key);
                                            if (ranking.length === 0) return <div className="text-center p-8 text-neutral-500">Nenhuma venda registrada.</div>;
                                            
                                            const maxVal = ranking[0][focusedIndicator.key] || 1;

                                            return ranking.map((seller, index) => {
                                                const isTop1 = index === 0;
                                                const isTop2 = index === 1;
                                                const isTop3 = index === 2;
                                                const percentage = Math.max(5, (seller[focusedIndicator.key] / maxVal) * 100);

                                                return (
                                                    <div key={seller.id} className="flex items-center gap-4 group">
                                                        <div className="w-8 shrink-0 font-black text-lg text-right">
                                                            {isTop1 ? <Crown size={24} className="text-yellow-500 ml-auto" /> :
                                                             isTop2 ? <Medal size={24} className="text-gray-400 ml-auto" /> :
                                                             isTop3 ? <Medal size={24} className="text-amber-600 ml-auto" /> :
                                                             <span className="text-neutral-400">{index + 1}º</span>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-bold ${isTop1 ? 'text-yellow-600 dark:text-yellow-500' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                                        {seller.nomeCompleto}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold tracking-widest text-white bg-neutral-800 px-1.5 py-0.5 rounded uppercase">
                                                                        {seller.storeName}
                                                                    </span>
                                                                </div>
                                                                <span className="font-black text-lg text-neutral-800 dark:text-neutral-100">
                                                                    {focusedIndicator.isCurrency ? applyCurrencyMask(seller[focusedIndicator.key]) : seller[focusedIndicator.key]}
                                                                </span>
                                                            </div>
                                                            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${isTop1 ? 'bg-yellow-500' : 'bg-[#E3000F]'}`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
