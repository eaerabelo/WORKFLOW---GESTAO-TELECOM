import React, { useState, useMemo } from 'react';
import {
    BarChart3, Calendar, TrendingUp, TrendingDown, Smartphone, Home, ShieldCheck,
    Watch, Zap, Target, Activity, FileSpreadsheet, LayoutDashboard,
    CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, Sparkles, Percent,
    Radio, Tv, Wifi, ShoppingBag, Boxes, Award, Check, Layers, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getTodaySP, applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';

export function Resultado({ salesData, goalsDB, usersDB = {}, globalMonth, setGlobalMonth }) {
    const monthFilter = globalMonth;
    const setMonthFilter = setGlobalMonth;

    const [activeSubView, setActiveSubView] = useState('DASHBOARD'); // 'DASHBOARD' | 'TABELA'
    const [selectedDayIndex, setSelectedDayIndex] = useState(null);
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
    const [gapCategoryFilter, setGapCategoryFilter] = useState('TODOS'); // 'TODOS' | 'MOVEL' | 'RESIDENCIAL' | 'ANEXACAO' | 'FINANCEIRO'
    const activeMetas = (goalsDB || {})[monthFilter] || METAS_PADRAO || {};
    const safeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => u?.name)
        .filter(Boolean);
    const numSellers = safeVendedores.length || 1;

    const formatMonthBR = (ymStr) => {
        if (!ymStr || !ymStr.includes('-')) return ymStr;
        const [y, m] = ymStr.split('-');
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const mIndex = parseInt(m, 10) - 1;
        const name = monthNames[mIndex] || '';
        return name ? `${m}/${y} • ${name}` : `${m}/${y}`;
    };

    // Cálculos de extração por Dia
    const { rows, totals } = useMemo(() => {
        const [yearStr, monthStr] = (monthFilter || '').split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();
        // Pós Total já representa o Gross da loja, não devemos somar com Controle senão a meta dobra.
        const metaGross = Number(activeMetas.posTotal) || 0;
        const diasUteisMovel = Number(activeMetas.diasUteisMovel) || daysInMonth;

        let remainingMeta = metaGross;
        let remainingDays = diasUteisMovel;

        // Padrão inteligente de dias de funcionamento (Pula domingos primeiro se DU for menor que o mês)
        let workingDaysPattern = new Array(daysInMonth).fill(true);
        if (diasUteisMovel < daysInMonth) {
            let daysToSkip = daysInMonth - diasUteisMovel;
            for (let d = 1; d <= daysInMonth && daysToSkip > 0; d++) {
                const dateObj = new Date(year, month - 1, d);
                if (dateObj.getDay() === 0) { // Domingo
                    workingDaysPattern[d - 1] = false;
                    daysToSkip--;
                }
            }
            for (let d = daysInMonth; d >= 1 && daysToSkip > 0; d--) {
                if (workingDaysPattern[d - 1]) {
                    workingDaysPattern[d - 1] = false;
                    daysToSkip--;
                }
            }
        }

        const generatedRows = [];
        let accumulatedGross = 0;

        const sumTotals = {
            grossDia: 0, metaDia: 0, total: 0, posTt: 0, controle: 0, controleTotal: 0, posPagoTotal: 0, depPg: 0, depBl: 0, depGratis: 0, migracaoPos: 0, migracaoControle: 0, grossPme: 0,
            portabilidade: 0, portabilidadePos: 0, portabilidadeControle: 0, bl: 0, flex: 0, receita: 0, fibra: 0, tv: 0, tvBox: 0, fixo: 0, mplay: 0, mplayPos: 0, mplayControle: 0, mesh: 0, urPme: 0,
            totalRes: 0, aparelho: 0, receitaAparelho: 0, receitaAparelhoBruto: 0, seguro: 0, acessorio: 0, trocafy: 0, pelicula: 0, claroUp: 0, upgrade: 0, upgradeUp: 0, receitaAcessorio: 0, receitaAcessorioBruto: 0,
            receitaPos: 0, receitaControle: 0, receitaFibra: 0, receitaFibraPme: 0, receitaFixo: 0, receitaTvBox: 0, receitaMesh: 0, receitaSeguro: 0
        };

        const today = new Date();
        const currentY = today.getFullYear();
        const currentM = today.getMonth() + 1;
        const currentD = today.getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateIso = `${yearStr}-${monthStr}-${dayStr}`;
            const dateBr = `${dayStr}/${monthStr}/${yearStr}`;

            let metaDia = 0;
            if (workingDaysPattern[d - 1] && remainingDays > 0) {
                metaDia = Math.ceil(remainingMeta / remainingDays);
                remainingMeta -= metaDia;
                remainingDays -= 1;
            }

            const dailySales = (salesData || []).filter(s => {
                if (typeof s.data !== 'string') return false;
                // Aceita ambos os formatos (YYYY-MM-DD ou DD/MM/YYYY)
                if (s.data.includes('-')) return s.data === dateIso;
                return s.data === dateBr;
            });

            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
            let portabilidade = 0, portabilidadePos = 0, portabilidadeControle = 0;
            let bl = 0, flex = 0, receita = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, mplay = 0, mplayPos = 0, mplayControle = 0, mesh = 0, urPme = 0, aparelho = 0;
            let receitaAparelho = 0, receitaAparelhoBruto = 0, seguro = 0, acessorio = 0, trocafy = 0, pelicula = 0, claroUp = 0, upgrade = 0, upgradeUp = 0, receitaAcessorio = 0, receitaAcessorioBruto = 0;
            let receitaPos = 0, receitaControle = 0, receitaFibra = 0, receitaFibraPme = 0, receitaFixo = 0, receitaTvBox = 0, receitaMesh = 0, receitaSeguro = 0;

            dailySales.forEach(sale => {
                const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
                const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
                const port = String(sale.portabilidade || '').toUpperCase();
                const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
                const rec = Number(sale.receita) || 0;
                const recBruto = Number(sale.valorBruto || sale.receita) || 0;
                const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                const adds = sale.adicionais || [];
                const addsStr = Array.isArray(adds) ? adds.join(' ').toUpperCase() : String(adds || '').toUpperCase();

                receita += rec;

                const isPort = port === 'SIM' || port.includes('PORT') || op.includes('PORT');

                if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) {
                    grossPme += q;
                    if (isPort) { portabilidade += q; portabilidadePos += q; }
                }
                else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q;
                    else posTt += q; // Entra apenas Ativação pura como POS TT
                    if (isPort) { portabilidade += q; portabilidadePos += q; }
                }
                else if (pBase.includes('CONTROLE')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                    else controle += q;
                    if (isPort) { portabilidade += q; portabilidadeControle += q; }
                }
                else if (pBase.includes('FLEX')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                    else flex += q;
                    if (isPort) { portabilidade += q; portabilidadeControle += q; }
                }
                else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                    if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || sub.includes('INCLUSA') || pBase.includes('GRÁTIS') || pBase.includes('INCLUSA')) depGratis += q;
                    else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA') || sub.includes('BL') || pBase.includes('BL')) depBl += q;
                    else depPg += q;
                    if (isPort) { portabilidade += q; portabilidadePos += q; }
                }
                else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('NET VIRTUA')) bl += q;
                else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
                else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
                else if (pBase.includes('TV-BOX')) tvBox += q;
                else if (pBase.includes('TV+') || pBase.includes('TV')) tv += q;
                else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
                else if (pBase.includes('MESH')) mesh += q;
                else if (pBase.includes('APARELHO')) { aparelho += q; receitaAparelho += rec; receitaAparelhoBruto += recBruto; }
                else if (pBase.includes('SEGURO')) seguro += q;
                else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; receitaAcessorio += rec; receitaAcessorioBruto += recBruto; }
                else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; }

                // RASTREAMENTO ESPECÍFICO DE RECEITAS DE MÓVEL
                if ((pBase.includes('PÓS') || pBase.includes('POS') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || pBase.includes('PME') || pBase === 'PME') && !pBase.includes('APARELHO') && !pBase.includes('FIBRA')) {
                    receitaPos += rec;
                } else if (pBase.includes('CONTROLE') || pBase.includes('FLEX')) {
                    receitaControle += rec;
                }

                // RASTREAMENTO ESPECÍFICO DE RECEITAS RESIDENCIAIS
                if (pBase.includes('FIBRA PME') || pBase.includes('UR PME') || ((pBase.includes('FIBRA') || pBase.includes('BANDA LARGA')) && (pBase.includes('PME') || op.includes('PME')))) {
                    receitaFibraPme += rec;
                } else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) {
                    receitaFibra += rec;
                }

                if (pBase.includes('FIXO') || pBase.includes('NET FONE')) {
                    receitaFixo += rec;
                }

                if (pBase.includes('TV-BOX') || pBase.includes('TV+') || pBase.includes('TV')) {
                    receitaTvBox += rec;
                }

                if (pBase.includes('MESH')) {
                    receitaMesh += rec;
                }

                // RASTREAMENTO ESPECÍFICO DE RECEITA DE SEGURO
                if (pBase.includes('SEGURO') || sale.seguroOption || addsStr.includes('SEGURO')) {
                    receitaSeguro += rec;
                }

                if (addsStr.includes('TROCAFY') || pBase.includes('TROCAFY')) trocafy += 1;

                // Segregação entre CLARO UP (Programa de Troca Anual de Aparelho) e UPGRADES DE SERVIÇOS (Migrações/Planos)
                const isClaroUp = addsStr.includes('CLARO UP') || addsStr.includes('CLAROUP') || pBase.includes('CLARO UP');
                if (isClaroUp) claroUp += 1;

                const isUpgradeServico = (addsStr.includes('UPGRADE') && !isClaroUp) ||
                    op.includes('UPGRADE') ||
                    sub.includes('UPGRADE') ||
                    pBase.includes('UPGRADE') ||
                    String(sale.tipoOperacao || '').toUpperCase().includes('UPGRADE');
                if (isUpgradeServico) upgrade += 1;

                upgradeUp = claroUp + upgrade;

                if (sale.mplay === 'SIM') {
                    mplay += 1;
                    // Separação do M-Play por tipo de plano móvel
                    if (pBase.includes('CONTROLE') || pBase.includes('FLEX')) mplayControle += 1;
                    else if (pBase.includes('PÓS') || pBase.includes('POS') || pBase.includes('DEPENDENTE') || pBase.includes('DEP')) mplayPos += 1;
                }
            });

            // GROSS DIA consolida Pós, Controle (Ativ+Mig), BL, Flex, PME, Dependentes
            const grossDia = posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex;

            let isFuture = false;
            if (year > currentY || (year === currentY && month > currentM) || (year === currentY && month === currentM && d > currentD)) {
                isFuture = true;
            }
            if (!isFuture) accumulatedGross += grossDia;

            const totalRes = fibra + tv + tvBox + fixo + urPme;

            const posPagoTotal = posTt + migracaoPos + depPg + depBl + depGratis;
            const controleTotal = controle + migracaoControle;

            generatedRows.push({
                data: dayStr, grossDia, metaDia, total: isFuture ? null : accumulatedGross, posTt, controle, controleTotal, posPagoTotal, depPg, depBl, depGratis, migracaoPos,
                migracaoControle, grossPme, portabilidade, portabilidadePos, portabilidadeControle, bl, flex, receita, fibra, tv, tvBox, fixo, mplay, mplayPos, mplayControle, mesh,
                urPme, totalRes, aparelho, receitaAparelho, receitaAparelhoBruto, seguro, acessorio, trocafy, pelicula, claroUp, upgrade, upgradeUp, receitaAcessorio, receitaAcessorioBruto,
                receitaPos, receitaControle, receitaFibra, receitaFibraPme, receitaFixo, receitaTvBox, receitaMesh, receitaSeguro
            });

            sumTotals.grossDia += grossDia; sumTotals.metaDia += metaDia; sumTotals.posTt += posTt; sumTotals.controle += controle; sumTotals.controleTotal += controleTotal; sumTotals.posPagoTotal += posPagoTotal;
            sumTotals.depPg += depPg; sumTotals.depBl += depBl; sumTotals.depGratis += depGratis;
            sumTotals.migracaoPos += migracaoPos; sumTotals.migracaoControle += migracaoControle; sumTotals.grossPme += grossPme;
            sumTotals.portabilidade += portabilidade; sumTotals.portabilidadePos += portabilidadePos; sumTotals.portabilidadeControle += portabilidadeControle;
            sumTotals.bl += bl; sumTotals.flex += flex; sumTotals.receita += receita;
            sumTotals.fibra += fibra; sumTotals.tv += tv; sumTotals.tvBox += tvBox; sumTotals.fixo += fixo; sumTotals.mplay += mplay; sumTotals.mplayPos += mplayPos; sumTotals.mplayControle += mplayControle; sumTotals.mesh += mesh;
            sumTotals.urPme += urPme; sumTotals.totalRes += totalRes; sumTotals.receitaAparelho += receitaAparelho; sumTotals.receitaAparelhoBruto += receitaAparelhoBruto; sumTotals.aparelho += aparelho;
            sumTotals.seguro += seguro; sumTotals.acessorio += acessorio; sumTotals.pelicula += pelicula; sumTotals.trocafy += trocafy; sumTotals.claroUp += claroUp; sumTotals.upgrade += upgrade; sumTotals.upgradeUp += upgradeUp; sumTotals.receitaAcessorio += receitaAcessorio; sumTotals.receitaAcessorioBruto += receitaAcessorioBruto;
            sumTotals.receitaPos += receitaPos; sumTotals.receitaControle += receitaControle; sumTotals.receitaFibra += receitaFibra; sumTotals.receitaFibraPme += receitaFibraPme; sumTotals.receitaFixo += receitaFixo; sumTotals.receitaTvBox += receitaTvBox; sumTotals.receitaMesh += receitaMesh; sumTotals.receitaSeguro += receitaSeguro;
        }

        sumTotals.total = accumulatedGross;

        return { rows: generatedRows, totals: sumTotals };
    }, [salesData, monthFilter, activeMetas, numSellers]);

    const COLUMNS = [
        { key: 'grossDia', label: 'GROSS DIA', highlight: true }, { key: 'metaDia', label: 'META DIA', highlight: true }, { key: 'total', label: 'GROSS ACUM.', highlight: true },
        { key: 'posTt', label: 'POS TT' }, { key: 'controleTotal', label: 'CONTROLE' }, { key: 'posPagoTotal', label: 'PÓS PAGO' }, { key: 'depPg', label: 'DEP PG' }, { key: 'depBl', label: 'DEP BL' }, { key: 'depGratis', label: 'DEP GRÁTIS' },
        { key: 'migracaoPos', label: 'MIGRAÇÃO-PÓS' }, { key: 'migracaoControle', label: 'MIGRAÇÃO-CONTROLE' }, { key: 'grossPme', label: 'GROSS PME' },
        { key: 'portabilidadePos', label: 'PORT-IN PÓS' }, { key: 'portabilidadeControle', label: 'PORT-IN CTRL' }, { key: 'portabilidade', label: 'PORTAB. TOTAL', highlight: true }, { key: 'bl', label: 'BL' }, { key: 'flex', label: 'FLEX' },
        { key: 'receita', label: 'RECEITA (R$)', isCurrency: true, highlight: true }, { key: 'fibra', label: 'FIBRA' }, { key: 'tv', label: 'TV+' }, { key: 'tvBox', label: 'TV BOX' }, { key: 'fixo', label: 'FIXO' },
        { key: 'urPme', label: 'UR PME' }, { key: 'mesh', label: 'MESH' },
        { key: 'totalRes', label: 'TOTAL RES.', highlight: true }, { key: 'mplay', label: 'M-PLAY' }, { key: 'mplayPos', label: 'MPLAY PÓS' }, { key: 'mplayControle', label: 'MPLAY CONTROLE' }, { key: 'aparelho', label: 'APARELHOS (UN)' }, { key: 'receitaAparelho', label: 'REC. APARELHOS (LÍQ)', isCurrency: true }, { key: 'receitaAparelhoBruto', label: 'REC. APARELHOS BRUTO', isCurrency: true },
        { key: 'seguro', label: 'SEGURO' }, { key: 'acessorio', label: 'ACESSÓRIOS (UN)' }, { key: 'receitaAcessorio', label: 'REC. ACESSÓRIOS (LÍQ)', isCurrency: true }, { key: 'receitaAcessorioBruto', label: 'REC. ACESSÓRIOS BRUTO', isCurrency: true },
        { key: 'trocafy', label: 'TROCAFY' }, { key: 'claroUp', label: 'CLARO UP (APARELHO)' }, { key: 'upgrade', label: 'UPGRADE (SERVIÇOS)' }
    ];

    const renderValue = (val, isCurrency) => {
        if (val === null || val === undefined || val === 0) return <span className="text-neutral-400 dark:text-neutral-600">-</span>;
        return isCurrency ? applyCurrencyMask(val) : val;
    };

    const metaGrossTotal = Number(activeMetas.posTotal) || 0;
    const metaLoja = {
        grossDia: metaGrossTotal,
        metaDia: metaGrossTotal,
        total: metaGrossTotal,
        posTt: Number(activeMetas.posPago) || 0,
        posPagoTotal: Number(activeMetas.posPago) || 0,
        controle: Number(activeMetas.controle) || 0,
        controleTotal: Number(activeMetas.controle) || 0,
        portabilidade: Number(activeMetas.portabilidade) || 0,
        portabilidadePos: Number(activeMetas.portabilidadePos) || 0,
        portabilidadeControle: Number(activeMetas.portabilidadeControle) || 0,
        receita: Number(activeMetas.receita) || 0,
        fibra: Number(activeMetas.fibra) || 0,
        tv: Number(activeMetas.tv) || 0,
        fixo: Number(activeMetas.fixo) || 0,
        totalRes: Number(activeMetas.urTotal) || 0,
        aparelho: Number(activeMetas.aparelho) || 0,
        seguro: Number(activeMetas.seguro) || 0,
        acessorio: Number(activeMetas.acessorio) || 0,
        pelicula: Number(activeMetas.pelicula) || 0,
        trocafy: Number(activeMetas.trocafy) || 0,
        claroUp: Number(activeMetas.claroUp) || 0,
        upgrade: Number(activeMetas.upgrade) || 0,
        mplay: Number(activeMetas.mplay) || 0,
        mesh: Number(activeMetas.mesh) || 0,
    };

    // Cálculos de Run Rate, Projeção e Tendência da Loja estilo Power BI
    const todaySP = getTodaySP();
    const [currentYearStr, currentMonthStr, currentDayStr] = todaySP.split('-');
    const isCurrentMonth = monthFilter === `${currentYearStr}-${currentMonthStr}`;
    const daysInMonth = rows.length || new Date(parseInt(monthFilter?.split('-')[0]), parseInt(monthFilter?.split('-')[1]), 0).getDate();
    const elapsedDays = isCurrentMonth ? Math.min(daysInMonth, Math.max(1, parseInt(currentDayStr, 10))) : daysInMonth;
    const remainingDays = isCurrentMonth ? Math.max(0, daysInMonth - elapsedDays) : 0;

    const calcStoreMetric = (real, meta) => {
        const r = Number(real) || 0;
        const m = Number(meta) || 0;
        const ating = m > 0 ? (r / m) * 100 : 0;
        const ritmoDiario = (isCurrentMonth && elapsedDays > 0) ? (r / elapsedDays) : (daysInMonth > 0 ? r / daysInMonth : 0);
        const projecao = isCurrentMonth ? (ritmoDiario * daysInMonth) : r;
        const tendencia = m > 0 ? Math.round((projecao / m) * 100) : 0;
        const falta = Math.max(0, m - r);
        const ritmoNecessario = remainingDays > 0 ? (falta / remainingDays) : 0;
        return { real: r, meta: m, ating, ritmoDiario, projecao, tendencia, falta, ritmoNecessario };
    };

    const metricReceita = calcStoreMetric(totals.receita, metaLoja.receita);
    const metricGross = calcStoreMetric(totals.grossDia, metaLoja.grossDia);
    const metricPos = calcStoreMetric(totals.posPagoTotal, metaLoja.posPagoTotal);
    const metricControle = calcStoreMetric(totals.controleTotal, metaLoja.controleTotal);
    const metricRes = calcStoreMetric(totals.totalRes, metaLoja.totalRes);
    const metricFibra = calcStoreMetric(totals.fibra, metaLoja.fibra);
    const metricTv = calcStoreMetric(totals.tv + totals.tvBox, metaLoja.tv);
    const metricAparelho = calcStoreMetric(totals.aparelho, metaLoja.aparelho);
    const metricAcessorio = calcStoreMetric(totals.acessorio, metaLoja.acessorio);
    const metricPelicula = calcStoreMetric(totals.pelicula, metaLoja.pelicula);
    const metricSeguro = calcStoreMetric(totals.seguro, metaLoja.seguro);
    const metricTrocafy = calcStoreMetric(totals.trocafy, metaLoja.trocafy);
    const metricClaroUp = calcStoreMetric(totals.claroUp, metaLoja.claroUp);
    const metricUpgrade = calcStoreMetric(totals.upgrade, metaLoja.upgrade);
    const metricMPlay = calcStoreMetric(totals.mplay, metaLoja.mplay);
    const metricMesh = calcStoreMetric(totals.mesh, metaLoja.mesh);
    const metricFixo = calcStoreMetric(totals.fixo, metaLoja.fixo);
    const metricPortTotal = calcStoreMetric(totals.portabilidade, metaLoja.portabilidade);
    const metricPortabilidade = metricPortTotal;
    const metricPortPos = calcStoreMetric(totals.portabilidadePos, metaLoja.portabilidadePos);
    const metricPortControle = calcStoreMetric(totals.portabilidadeControle, metaLoja.portabilidadeControle);

    const storeIndicatorsList = [
        { key: 'receita', label: 'Receita Total', group: 'Financeiro', isCurrency: true, metric: metricReceita, icon: TrendingUp },
        { key: 'grossDia', label: 'Gross Total Móvel', group: 'Móvel', unit: 'un', metric: metricGross, icon: Smartphone },
        { key: 'posPagoTotal', label: 'Pós-Pago Total', group: 'Móvel', unit: 'un', metric: metricPos, icon: Radio },
        { key: 'controleTotal', label: 'Controle Total', group: 'Móvel', unit: 'un', metric: metricControle, icon: Smartphone },
        { key: 'portabilidade', label: 'Portabilidade Total', group: 'Móvel', unit: 'un', metric: metricPortTotal, icon: ArrowUpRight },
        { key: 'portabilidadePos', label: 'Port-in Pós-Pago', group: 'Móvel', unit: 'un', metric: metricPortPos, icon: Radio },
        { key: 'portabilidadeControle', label: 'Port-in Controle', group: 'Móvel', unit: 'un', metric: metricPortControle, icon: Smartphone },
        { key: 'totalRes', label: 'UR Residencial Total', group: 'Residencial', unit: 'URs', metric: metricRes, icon: Home },
        { key: 'fibra', label: 'Banda Larga Fibra', group: 'Residencial', unit: 'un', metric: metricFibra, icon: Wifi },
        { key: 'tv', label: 'TV+ & TV Box', group: 'Residencial', unit: 'un', metric: metricTv, icon: Tv },
        { key: 'fixo', label: 'Telefonia Fixa', group: 'Residencial', unit: 'un', metric: metricFixo, icon: Activity },
        { key: 'aparelho', label: 'Aparelhos Vendidos', group: 'Aparelhos', unit: 'un', metric: metricAparelho, icon: ShoppingBag },
        { key: 'seguro', label: 'Proteção Móvel (Seguro)', group: 'Anexação', unit: 'un', metric: metricSeguro, icon: ShieldCheck },
        { key: 'acessorio', label: 'Acessórios + Películas', group: 'Anexação', unit: 'un', metric: calcStoreMetric(totals.acessorio + totals.pelicula, metaLoja.acessorio + metaLoja.pelicula), icon: Boxes },
        { key: 'trocafy', label: 'Trocafy (Trade-in)', group: 'Anexação', unit: 'un', metric: metricTrocafy, icon: Award },
        { key: 'claroUp', label: 'Claro UP (Troca Anual Aparelho)', group: 'Anexação', unit: 'un', metric: metricClaroUp, icon: Award },
        { key: 'upgrade', label: 'Upgrades de Serviços Móveis', group: 'Móvel', unit: 'un', metric: metricUpgrade, icon: ArrowUpRight },
        { key: 'mplay', label: 'M-Play Streaming', group: 'Serviços', unit: 'un', metric: metricMPlay, icon: Zap },
        { key: 'mesh', label: 'Mesh Wi-Fi', group: 'Residencial', unit: 'un', metric: metricMesh, icon: Wifi }
    ];

    // Cálculo do Dia de Análise e Monitor de Gap do Dia Anterior
    const defaultRefIndex = isCurrentMonth ? Math.max(0, elapsedDays - 1) : Math.max(0, rows.length - 1);
    const activeDayIndex = selectedDayIndex !== null ? selectedDayIndex : defaultRefIndex;

    const currentDayRow = rows[activeDayIndex] || rows[0] || {};
    const hasPrevDay = activeDayIndex > 0;
    const prevDayRow = hasPrevDay ? (rows[activeDayIndex - 1] || {}) : {};

    // Gap Geral do Gross Dia Anterior
    const metaOntem = hasPrevDay ? (prevDayRow.metaDia || 0) : 0;
    const realOntem = hasPrevDay ? (prevDayRow.grossDia || 0) : 0;
    const gapOntem = metaOntem - realOntem; // > 0 faltou (déficit), <= 0 bateu ou superou

    // Gap Acumulado até o dia anterior
    let metaAcumAteOntem = 0;
    let realAcumAteOntem = 0;
    for (let i = 0; i < activeDayIndex; i++) {
        metaAcumAteOntem += rows[i]?.metaDia || 0;
        realAcumAteOntem += rows[i]?.grossDia || 0;
    }
    const gapAcumuladoAteOntem = metaAcumAteOntem - realAcumAteOntem;

    // Meta do Dia Ajustada com Gap Deixado Ontem (Gross)
    const metaHojeNormal = currentDayRow.metaDia || 0;
    const metaHojeAjustada = Math.max(0, metaHojeNormal + Math.max(0, gapOntem));
    const realHoje = currentDayRow.grossDia || 0;
    const pctHojeMetaAjustada = metaHojeAjustada > 0 ? Math.round((realHoje / metaHojeAjustada) * 100) : 100;

    // Comparativo Dia contra Dia (DOD Geral)
    const dodGrossDiff = hasPrevDay ? ((currentDayRow.grossDia || 0) - (prevDayRow.grossDia || 0)) : 0;
    const dodGrossPct = hasPrevDay && (prevDayRow.grossDia || 0) > 0
        ? Math.round((dodGrossDiff / prevDayRow.grossDia) * 100)
        : 0;

    const dodRecDiff = hasPrevDay ? ((currentDayRow.receita || 0) - (prevDayRow.receita || 0)) : 0;
    const dodRecPct = hasPrevDay && (prevDayRow.receita || 0) > 0
        ? Math.round((dodRecDiff / prevDayRow.receita) * 100)
        : 0;

    // ANÁLISE DE TODOS OS INDICADORES: GAP DE META DO DIA ANTERIOR E OSCILAÇÃO DIA A DIA
    const diasUteisTotais = Number(activeMetas.diasUteisMovel) || daysInMonth;

    const allIndicatorsGapList = useMemo(() => {
        const rawList = [
            {
                key: 'receita', label: 'Receita Total Loja', group: 'Financeiro', isCurrency: true, unit: 'R$', icon: TrendingUp,
                prevReal: prevDayRow.receita || 0, todayReal: currentDayRow.receita || 0, metaMonthly: metaLoja.receita || 0
            },
            {
                key: 'grossDia', label: 'Gross Total Móvel', group: 'Móvel', unit: 'un', icon: Smartphone,
                prevReal: prevDayRow.grossDia || 0, todayReal: currentDayRow.grossDia || 0, metaMonthly: metaLoja.grossDia || 0,
                prevMetaCustom: prevDayRow.metaDia, todayMetaCustom: currentDayRow.metaDia
            },
            {
                key: 'posPagoTotal', label: 'Pós-Pago Total', group: 'Móvel', unit: 'un', icon: Radio,
                prevReal: prevDayRow.posPagoTotal || 0, todayReal: currentDayRow.posPagoTotal || 0, metaMonthly: metaLoja.posPagoTotal || 0
            },
            {
                key: 'posTt', label: 'Ativação Pós Pura (POS TT)', group: 'Móvel', unit: 'un', icon: Radio,
                prevReal: prevDayRow.posTt || 0, todayReal: currentDayRow.posTt || 0, metaMonthly: 0
            },
            {
                key: 'controleTotal', label: 'Controle Total', group: 'Móvel', unit: 'un', icon: Smartphone,
                prevReal: prevDayRow.controleTotal || 0, todayReal: currentDayRow.controleTotal || 0, metaMonthly: metaLoja.controleTotal || 0
            },
            {
                key: 'controle', label: 'Ativação Controle Pura', group: 'Móvel', unit: 'un', icon: Smartphone,
                prevReal: prevDayRow.controle || 0, todayReal: currentDayRow.controle || 0, metaMonthly: 0
            },
            {
                key: 'flex', label: 'Claro Flex', group: 'Móvel', unit: 'un', icon: Smartphone,
                prevReal: prevDayRow.flex || 0, todayReal: currentDayRow.flex || 0, metaMonthly: 0
            },
            {
                key: 'portabilidade', label: 'Portabilidade Total', group: 'Móvel', unit: 'un', icon: ArrowUpRight,
                prevReal: prevDayRow.portabilidade || 0, todayReal: currentDayRow.portabilidade || 0, metaMonthly: metaLoja.portabilidade || 0
            },
            {
                key: 'portabilidadePos', label: 'Port-in Pós-Pago', group: 'Móvel', unit: 'un', icon: Radio,
                prevReal: prevDayRow.portabilidadePos || 0, todayReal: currentDayRow.portabilidadePos || 0, metaMonthly: metaLoja.portabilidadePos || 0
            },
            {
                key: 'portabilidadeControle', label: 'Port-in Controle', group: 'Móvel', unit: 'un', icon: Smartphone,
                prevReal: prevDayRow.portabilidadeControle || 0, todayReal: currentDayRow.portabilidadeControle || 0, metaMonthly: metaLoja.portabilidadeControle || 0
            },
            {
                key: 'migracoes', label: 'Migrações Móvel Total', group: 'Móvel', unit: 'un', icon: ArrowUpRight,
                prevReal: (prevDayRow.migracaoPos || 0) + (prevDayRow.migracaoControle || 0), todayReal: (currentDayRow.migracaoPos || 0) + (currentDayRow.migracaoControle || 0), metaMonthly: 0
            },
            {
                key: 'dependentes', label: 'Dependentes Total', group: 'Móvel', unit: 'un', icon: Radio,
                prevReal: (prevDayRow.depPg || 0) + (prevDayRow.depBl || 0) + (prevDayRow.depGratis || 0), todayReal: (currentDayRow.depPg || 0) + (currentDayRow.depBl || 0) + (currentDayRow.depGratis || 0), metaMonthly: 0
            },
            {
                key: 'totalRes', label: 'UR Residencial Total', group: 'Residencial', unit: 'URs', icon: Home,
                prevReal: prevDayRow.totalRes || 0, todayReal: currentDayRow.totalRes || 0, metaMonthly: metaLoja.totalRes || 0
            },
            {
                key: 'fibra', label: 'Banda Larga Fibra', group: 'Residencial', unit: 'un', icon: Wifi,
                prevReal: prevDayRow.fibra || 0, todayReal: currentDayRow.fibra || 0, metaMonthly: metaLoja.fibra || 0
            },
            {
                key: 'tv', label: 'TV+ & TV Box', group: 'Residencial', unit: 'un', icon: Tv,
                prevReal: (prevDayRow.tv || 0) + (prevDayRow.tvBox || 0), todayReal: (currentDayRow.tv || 0) + (currentDayRow.tvBox || 0), metaMonthly: metaLoja.tv || 0
            },
            {
                key: 'fixo', label: 'Telefonia Fixa', group: 'Residencial', unit: 'un', icon: Activity,
                prevReal: prevDayRow.fixo || 0, todayReal: currentDayRow.fixo || 0, metaMonthly: metaLoja.fixo || 0
            },
            {
                key: 'mesh', label: 'Mesh Wi-Fi', group: 'Residencial', unit: 'un', icon: Wifi,
                prevReal: prevDayRow.mesh || 0, todayReal: currentDayRow.mesh || 0, metaMonthly: metaLoja.mesh || 0
            },
            {
                key: 'aparelho', label: 'Aparelhos Vendidos', group: 'Aparelhos', unit: 'un', icon: ShoppingBag,
                prevReal: prevDayRow.aparelho || 0, todayReal: currentDayRow.aparelho || 0, metaMonthly: metaLoja.aparelho || 0
            },
            {
                key: 'receitaAparelho', label: 'Rec. Aparelhos (Normal/Líq)', group: 'Financeiro', isCurrency: true, unit: 'R$', icon: ShoppingBag,
                prevReal: prevDayRow.receitaAparelho || 0, todayReal: currentDayRow.receitaAparelho || 0, metaMonthly: 0
            },
            {
                key: 'receitaAparelhoBruto', label: 'Rec. Aparelhos (Bruta)', group: 'Financeiro', isCurrency: true, unit: 'R$', icon: ShoppingBag,
                prevReal: prevDayRow.receitaAparelhoBruto || 0, todayReal: currentDayRow.receitaAparelhoBruto || 0, metaMonthly: 0
            },
            {
                key: 'seguro', label: 'Proteção Móvel (Seguro)', group: 'Anexação', unit: 'un', icon: ShieldCheck,
                prevReal: prevDayRow.seguro || 0, todayReal: currentDayRow.seguro || 0, metaMonthly: metaLoja.seguro || 0
            },
            {
                key: 'acessorios', label: 'Acessórios + Películas', group: 'Anexação', unit: 'un', icon: Boxes,
                prevReal: (prevDayRow.acessorio || 0) + (prevDayRow.pelicula || 0), todayReal: (currentDayRow.acessorio || 0) + (currentDayRow.pelicula || 0), metaMonthly: (metaLoja.acessorio || 0) + (metaLoja.pelicula || 0)
            },
            {
                key: 'receitaAcessorio', label: 'Rec. Acessórios (Normal/Líq)', group: 'Financeiro', isCurrency: true, unit: 'R$', icon: Boxes,
                prevReal: prevDayRow.receitaAcessorio || 0, todayReal: currentDayRow.receitaAcessorio || 0, metaMonthly: metaLoja.acessorio || 0
            },
            {
                key: 'receitaAcessorioBruto', label: 'Rec. Acessórios (Bruta)', group: 'Financeiro', isCurrency: true, unit: 'R$', icon: Boxes,
                prevReal: prevDayRow.receitaAcessorioBruto || 0, todayReal: currentDayRow.receitaAcessorioBruto || 0, metaMonthly: 0
            },
            {
                key: 'trocafy', label: 'Trocafy Trade-in', group: 'Anexação', unit: 'un', icon: Award,
                prevReal: prevDayRow.trocafy || 0, todayReal: currentDayRow.trocafy || 0, metaMonthly: metaLoja.trocafy || 0
            },
            {
                key: 'claroUp', label: 'Claro UP (Troca de Aparelho)', group: 'Anexação', unit: 'un', icon: Award,
                prevReal: prevDayRow.claroUp || 0, todayReal: currentDayRow.claroUp || 0, metaMonthly: metaLoja.claroUp || 0
            },
            {
                key: 'upgrade', label: 'Upgrades de Serviços Móveis', group: 'Móvel', unit: 'un', icon: ArrowUpRight,
                prevReal: prevDayRow.upgrade || 0, todayReal: currentDayRow.upgrade || 0, metaMonthly: metaLoja.upgrade || 0
            },
            {
                key: 'mplay', label: 'M-Play Streaming', group: 'Serviços', unit: 'un', icon: Zap,
                prevReal: prevDayRow.mplay || 0, todayReal: currentDayRow.mplay || 0, metaMonthly: metaLoja.mplay || 0
            }
        ];

        return rawList.map(item => {
            const hasMonthlyMeta = item.metaMonthly > 0;
            const prevMeta = item.prevMetaCustom !== undefined
                ? (item.prevMetaCustom || 0)
                : (hasMonthlyMeta && diasUteisTotais > 0
                    ? (item.isCurrency ? Math.round(item.metaMonthly / diasUteisTotais) : Math.round((item.metaMonthly / diasUteisTotais) * 10) / 10)
                    : 0);

            const todayMeta = item.todayMetaCustom !== undefined
                ? (item.todayMetaCustom || 0)
                : (hasMonthlyMeta && diasUteisTotais > 0
                    ? (item.isCurrency ? Math.round(item.metaMonthly / diasUteisTotais) : Math.round((item.metaMonthly / diasUteisTotais) * 10) / 10)
                    : 0);

            // Gap Ontem = Meta Ontem - Realizado Ontem
            const gapOntem = prevMeta > 0 ? (prevMeta - item.prevReal) : 0;
            // Meta Hoje com Gap = Meta Base de Hoje + Gap Deixado Ontem
            const metaHojeAjustada = todayMeta > 0 ? Math.max(0, todayMeta + Math.max(0, gapOntem)) : 0;
            const pctRecuperacaoHoje = metaHojeAjustada > 0
                ? Math.round((item.todayReal / metaHojeAjustada) * 100)
                : (todayMeta === 0 && item.todayReal > 0 ? 100 : 0);

            // Oscilação Dia a Dia (DOD)
            const diffDOD = item.todayReal - item.prevReal;
            const pctDOD = item.prevReal > 0
                ? Math.round((diffDOD / item.prevReal) * 100)
                : (item.todayReal > 0 ? 100 : 0);

            return {
                ...item,
                hasMeta: hasMonthlyMeta || prevMeta > 0 || todayMeta > 0,
                prevMeta,
                todayMeta,
                gapOntem,
                metaHojeAjustada,
                pctRecuperacaoHoje,
                diffDOD,
                pctDOD,
                statusDOD: diffDOD > 0 ? 'MELHOROU' : (diffDOD < 0 ? 'QUEDA' : 'ESTAVEL')
            };
        });
    }, [prevDayRow, currentDayRow, metaLoja, diasUteisTotais]);

    const improvedProducts = allIndicatorsGapList
        .filter(item => item.statusDOD === 'MELHOROU')
        .sort((a, b) => b.diffDOD - a.diffDOD);

    const declinedProducts = allIndicatorsGapList
        .filter(item => item.statusDOD === 'QUEDA')
        .sort((a, b) => a.diffDOD - b.diffDOD);

    const getTrendBadge = (pct) => {
        if (pct >= 100) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
        if (pct >= 80) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
    };

    const handleExportExcel = () => {
        if (rows.length === 0) {
            toast.error('Nenhum dado para exportar.');
            return;
        }

        const dataToExport = rows.map(row => {
            const rowData = { 'DATA': row.data };
            COLUMNS.forEach(col => { rowData[col.label] = row[col.key]; });
            return rowData;
        });

        const totalsRow = { 'DATA': 'REALIZADO MÊS' };
        COLUMNS.forEach(col => { totalsRow[col.label] = totals[col.key]; });
        dataToExport.push(totalsRow);

        const projRow = { 'DATA': 'PROJEÇÃO MÊS' };
        COLUMNS.forEach(col => {
            const mData = calcStoreMetric(totals[col.key], metaLoja[col.key]);
            projRow[col.label] = col.isCurrency
                ? Number(mData.projecao.toFixed(2))
                : Math.round(mData.projecao);
        });
        dataToExport.push(projRow);

        const tendRow = { 'DATA': 'TENDÊNCIA (%)' };
        COLUMNS.forEach(col => {
            const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
            if (hasMeta) {
                const mData = calcStoreMetric(totals[col.key], metaLoja[col.key]);
                tendRow[col.label] = `${mData.tendencia}%`;
            } else {
                tendRow[col.label] = '-';
            }
        });
        dataToExport.push(tendRow);

        const metaRow = { 'DATA': 'META LOJA' };
        COLUMNS.forEach(col => {
            const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
            metaRow[col.label] = hasMeta ? metaLoja[col.key] : '-';
        });
        dataToExport.push(metaRow);

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");
        XLSX.writeFile(workbook, `Resultado_Consolidado_${monthFilter}.xlsx`);
        toast.success('Relatório gerencial exportado com sucesso!');
    };

    // Maior valor diário para escala do gráfico Power BI
    const maxGrossDia = Math.max(...rows.map(r => r.grossDia || 0), 1);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in transition-colors">
            {/* CABEÇALHO */}
            <div className="p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F] shrink-0">
                            <BarChart3 size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-100">Resultado Consolidado</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
                                <TrendingUp size={12} className="text-[#E3000F]" /> Performance Geral e Run Rate da Loja
                            </p>
                        </div>
                    </div>

                    {/* SELETOR DE VISUALIZAÇÃO: DASHBOARD LOJA vs TABELA ANALÍTICA */}
                    <div className="flex items-center bg-neutral-200/80 dark:bg-neutral-800 p-1 rounded-xl self-start sm:self-auto sm:ml-4 border border-neutral-200 dark:border-neutral-700">
                        <button
                            onClick={() => setActiveSubView('DASHBOARD')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubView === 'DASHBOARD'
                                ? 'bg-white dark:bg-neutral-900 text-[#E3000F] shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                        >
                            <LayoutDashboard size={14} />
                            <span>Dashboard Loja</span>
                        </button>
                        <button
                            onClick={() => setActiveSubView('TABELA')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubView === 'TABELA'
                                ? 'bg-white dark:bg-neutral-900 text-[#E3000F] shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                        >
                            <FileSpreadsheet size={14} />
                            <span>Tabela Analítica</span>
                        </button>
                    </div>
                </div>

                {!isOptionsCollapsed && (
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2 items-stretch sm:items-center">
                        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm justify-between sm:justify-start">
                            <Calendar size={16} className="text-neutral-400 ml-2 shrink-0" />
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 cursor-pointer focus:text-[#E3000F] w-full sm:w-auto text-right sm:text-left"
                            />
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2 bg-[#107c41] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center justify-center gap-2 shrink-0"
                        >
                            <FileSpreadsheet size={16} />
                            <span>Exportar Excel</span>
                        </button>
                    </div>
                )}
            </div>

            {/* CONTEÚDO PRINCIPAL: DASHBOARD LOJA (ESTILO POWER BI / VISÃO 360) */}
            {activeSubView === 'DASHBOARD' ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin bg-neutral-50/40 dark:bg-neutral-950/40">

                    {/* BARRA SUPERIOR DE STATUS DE CALENDÁRIO & RUN RATE */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-xl shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide">
                                        Termômetro do Mês ({formatMonthBR(monthFilter)})
                                    </h3>
                                    {isCurrentMonth ? (
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                            Em Andamento
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                                            Mês Fechado
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {isCurrentMonth
                                        ? `Dia ${elapsedDays} de ${daysInMonth} dias (${Math.round((elapsedDays / daysInMonth) * 100)}% decorrido) • Restam ${remainingDays} dias para o fechamento.`
                                        : `Mês com ${daysInMonth} dias concluído. Todos os números representam o resultado final.`}
                                </p>
                            </div>
                        </div>

                        {isCurrentMonth && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch md:self-auto justify-end">
                                <div className="bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 text-right">
                                    <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Ritmo Receita/Dia</span>
                                    <span className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-100">
                                        {applyCurrencyMask(metricReceita.ritmoDiario)}
                                    </span>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 text-right">
                                    <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Ritmo Gross/Dia</span>
                                    <span className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-100">
                                        {metricGross.ritmoDiario.toFixed(1)} un
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CARDS KPIS PRINCIPAIS (POWER BI EXECUTIVE CARDS) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* KPI 1: RECEITA TOTAL */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#E3000F]/40 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Receita Total</span>
                                <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {applyCurrencyMask(metricReceita.real)}
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mt-1">
                                    <span>Meta: {applyCurrencyMask(metricReceita.meta)}</span>
                                    <span className={`font-black ${metricReceita.ating >= 100 ? 'text-green-600' : 'text-[#E3000F]'}`}>
                                        {metricReceita.ating.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${metricReceita.ating >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#E3000F] to-rose-500'}`}
                                        style={{ width: `${Math.min(100, metricReceita.ating)}%` }}
                                    />
                                </div>
                            </div>
                            {isCurrentMonth && metricReceita.meta > 0 && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                                    <span className="text-neutral-500">Projeção: <strong className="text-neutral-800 dark:text-neutral-200">{applyCurrencyMask(metricReceita.projecao)}</strong></span>
                                    <span className={`px-2 py-0.5 rounded border font-black ${getTrendBadge(metricReceita.tendencia)}`}>
                                        {metricReceita.tendencia}% Tend.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* KPI 2: GROSS TOTAL */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gross Total</span>
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <Smartphone size={18} />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {metricGross.real} <span className="text-sm font-bold text-neutral-400">linhas</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mt-1">
                                    <span>Meta: {metricGross.meta} un</span>
                                    <span className={`font-black ${metricGross.ating >= 100 ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {metricGross.ating.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${metricGross.ating >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(100, metricGross.ating)}%` }}
                                    />
                                </div>
                            </div>
                            {isCurrentMonth && metricGross.meta > 0 && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                                    <span className="text-neutral-500">Projeção: <strong className="text-neutral-800 dark:text-neutral-200">{Math.round(metricGross.projecao)} un</strong></span>
                                    <span className={`px-2 py-0.5 rounded border font-black ${getTrendBadge(metricGross.tendencia)}`}>
                                        {metricGross.tendencia}% Tend.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* KPI 3: UR RESIDENCIAL */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">UR Residencial</span>
                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                    <Home size={18} />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {metricRes.real} <span className="text-sm font-bold text-neutral-400">URs</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mt-1">
                                    <span>Meta: {metricRes.meta} URs</span>
                                    <span className={`font-black ${metricRes.ating >= 100 ? 'text-green-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {metricRes.ating.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${metricRes.ating >= 100 ? 'bg-green-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, metricRes.ating)}%` }}
                                    />
                                </div>
                            </div>
                            {isCurrentMonth && metricRes.meta > 0 && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                                    <span className="text-neutral-500">Projeção: <strong className="text-neutral-800 dark:text-neutral-200">{Math.round(metricRes.projecao)} URs</strong></span>
                                    <span className={`px-2 py-0.5 rounded border font-black ${getTrendBadge(metricRes.tendencia)}`}>
                                        {metricRes.tendencia}% Tend.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* KPI 4: APARELHOS & RENTABILIDADE */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Aparelhos Vendidos</span>
                                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <ShoppingBag size={18} />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                    {metricAparelho.real} <span className="text-sm font-bold text-neutral-400">un</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mt-1">
                                    <span>Meta: {metricAparelho.meta} un</span>
                                    <span className={`font-black ${metricAparelho.ating >= 100 ? 'text-green-600' : 'text-purple-600 dark:text-purple-400'}`}>
                                        {metricAparelho.ating.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${metricAparelho.ating >= 100 ? 'bg-green-500' : 'bg-purple-600'}`}
                                        style={{ width: `${Math.min(100, metricAparelho.ating)}%` }}
                                    />
                                </div>
                            </div>
                            {isCurrentMonth && metricAparelho.meta > 0 && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                                    <span className="text-neutral-500">Projeção: <strong className="text-neutral-800 dark:text-neutral-200">{Math.round(metricAparelho.projecao)} un</strong></span>
                                    <span className={`px-2 py-0.5 rounded border font-black ${getTrendBadge(metricAparelho.tendencia)}`}>
                                        {metricAparelho.tendencia}% Tend.
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* BLOCO CENTRAL: 3 PAINÉIS ANALÍTICOS (MÓVEL, RESIDENCIAL & ANEXAÇÃO) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                        {/* PAINEL 1: GROSS - ONE PAGE */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                            <Radio size={18} className="shrink-0" />
                                        </div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide truncate">
                                            GROSS - ONE PAGE
                                        </h3>
                                    </div>
                                    <span className="text-xs font-black text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded shrink-0">
                                        {totals.grossDia} Gross
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {/* PÓS PAGO (QUALQUER PÓS) */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">Pós-Pago Total (Qualquer Pós)</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.posPagoTotal} / {metaLoja.posPagoTotal} ({metricPos.ating.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, metricPos.ating)}%` }} />
                                        </div>
                                        {/* CAIXA DE RECEITA PÓS-PAGO */}
                                        <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] sm:text-xs bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
                                            <span className="text-[10px] sm:text-xs font-black uppercase text-blue-700 dark:text-blue-300 truncate">Receita Pós-Pago:</span>
                                            <span className="font-black text-blue-700 dark:text-blue-300 text-xs sm:text-sm shrink-0">{applyCurrencyMask(totals.receitaPos)}</span>
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{Math.round(metricPos.projecao)} un</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricPos.tendencia)}`}>
                                                    {metricPos.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-x-2 gap-y-0.5 text-[9.5px] text-neutral-500">
                                            <span>Ativ. Pura (POS TT): <strong className="text-neutral-700 dark:text-neutral-300">{totals.posTt}</strong></span>
                                            <span>•</span>
                                            <span>Migrações: <strong className="text-neutral-700 dark:text-neutral-300">{totals.migracaoPos}</strong></span>
                                            <span>•</span>
                                            <span>Dep: <strong className="text-neutral-700 dark:text-neutral-300">{totals.depPg + totals.depBl + totals.depGratis}</strong> (PG: {totals.depPg} | BL: {totals.depBl} | Grátis: {totals.depGratis})</span>
                                        </div>
                                    </div>

                                    {/* CONTROLE (FLEX E QUALQUER CONTROLE) */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">Controle Total (Flex e Controle)</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.controleTotal} / {metaLoja.controleTotal} ({metricControle.ating.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, metricControle.ating)}%` }} />
                                        </div>
                                        {/* CAIXA DE RECEITA CONTROLE */}
                                        <div className="mt-1.5 flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60">
                                            <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Receita Controle:</span>
                                            <span className="font-black text-purple-700 dark:text-purple-300 text-sm">{applyCurrencyMask(totals.receitaControle)}</span>
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{Math.round(metricControle.projecao)} un</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricControle.tendencia)}`}>
                                                    {metricControle.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-x-2 gap-y-0.5 text-[9.5px] text-neutral-500">
                                            <span>Ativ. Controle: <strong className="text-neutral-700 dark:text-neutral-300">{totals.controle}</strong></span>
                                            <span>•</span>
                                            <span>Migrações: <strong className="text-neutral-700 dark:text-neutral-300">{totals.migracaoControle}</strong></span>
                                            <span>•</span>
                                            <span>Flex: <strong className="text-neutral-700 dark:text-neutral-300">{totals.flex}</strong></span>
                                            <span>•</span>
                                            <span>PME: <strong className="text-neutral-700 dark:text-neutral-300">{totals.grossPme}</strong></span>
                                        </div>
                                    </div>

                                    {/* CARDS MENORES DO MÓVEL RECHEADOS */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 col-span-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wide">
                                                    Portabilidade:
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                                                        Total: {totals.portabilidade} un ({totals.grossDia > 0 ? Math.round((totals.portabilidade / totals.grossDia) * 100) : 0}% Gross)
                                                    </span>
                                                    <span className="text-[9.5px] font-bold text-neutral-400">
                                                        Proj Total: {Math.round(metricPortTotal.projecao)} un
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50">
                                                <div className="bg-white dark:bg-neutral-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 uppercase">Port-in Pós</span>
                                                        <span className="text-[9px] text-neutral-400">{totals.portabilidade > 0 ? Math.round((totals.portabilidadePos / totals.portabilidade) * 100) : 0}% da port.</span>
                                                    </div>
                                                    <div className="flex items-baseline justify-between mt-0.5">
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white">{totals.portabilidadePos} un</span>
                                                        <span className="text-[9.5px] font-semibold text-neutral-500">Proj: {Math.round(metricPortPos.projecao)} un</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-neutral-900/80 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[9.5px] font-bold text-purple-600 dark:text-purple-400 uppercase">Port-in Controle</span>
                                                        <span className="text-[9px] text-neutral-400">{totals.portabilidade > 0 ? Math.round((totals.portabilidadeControle / totals.portabilidade) * 100) : 0}% da port.</span>
                                                    </div>
                                                    <div className="flex items-baseline justify-between mt-0.5">
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white">{totals.portabilidadeControle} un</span>
                                                        <span className="text-[9.5px] font-semibold text-neutral-500">Proj: {Math.round(metricPortControle.projecao)} un</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {totals.portabilidade > 0 && (
                                                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden flex mt-2">
                                                    <div
                                                        className="bg-blue-600 h-full"
                                                        style={{ width: `${(totals.portabilidadePos / totals.portabilidade) * 100}%` }}
                                                        title={`Port-in Pós: ${totals.portabilidadePos} un`}
                                                    />
                                                    <div
                                                        className="bg-purple-600 h-full"
                                                        style={{ width: `${(totals.portabilidadeControle / totals.portabilidade) * 100}%` }}
                                                        title={`Port-in Controle: ${totals.portabilidadeControle} un`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Migrações Total</span>
                                            <span className="text-base font-black text-amber-600 dark:text-amber-400">{totals.migracaoPos + totals.migracaoControle} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Pós: {totals.migracaoPos} • Ctrl: {totals.migracaoControle}</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.migracaoPos + totals.migracaoControle, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Dependentes Total</span>
                                            <span className="text-base font-black text-neutral-800 dark:text-neutral-100">{totals.depPg + totals.depBl + totals.depGratis} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>PG: {totals.depPg} • BL: {totals.depBl}</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.depPg + totals.depBl + totals.depGratis, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">M-Play (Streaming)</span>
                                            <span className="text-base font-black text-[#E3000F]">{totals.mplay} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Pós: {totals.mplayPos} • Ctrl: {totals.mplayControle}</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.mplay, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Claro Flex & BL</span>
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{totals.flex + totals.bl} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Flex: {totals.flex} • BL: {totals.bl}</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.flex + totals.bl, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Gross PME Móvel</span>
                                            <span className="text-base font-black text-blue-600 dark:text-blue-400">{totals.grossPme} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Corporativo</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.grossPme, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAINEL 2: UR - RESIDENCIAL */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                                            <Home size={18} className="shrink-0" />
                                        </div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide truncate">
                                            UR - RESIDENCIAL
                                        </h3>
                                    </div>
                                    <span className="text-xs font-black text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded shrink-0">
                                        {totals.totalRes} URs
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {/* FIBRA */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">Banda Larga Fibra (PF)</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.fibra} / {metaLoja.fibra} ({metricFibra.ating.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, metricFibra.ating)}%` }} />
                                        </div>
                                        {/* CAIXA DE RECEITA FIBRA */}
                                        <div className="mt-1.5 flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Receita Fibra PF:</span>
                                            <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">{applyCurrencyMask(totals.receitaFibra)}</span>
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{Math.round(metricFibra.projecao)} un</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricFibra.tendencia)}`}>
                                                    {metricFibra.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* TV+ & TV BOX */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">TV+ & TV Box</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.tv + totals.tvBox} / {metaLoja.tv} ({metricTv.ating.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, metricTv.ating)}%` }} />
                                        </div>
                                        {/* CAIXA DE RECEITA TV BOX & TV */}
                                        <div className="mt-1.5 flex items-center justify-between text-xs bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800/60">
                                            <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400">Receita TV Box / TV+:</span>
                                            <span className="font-black text-teal-700 dark:text-teal-400 text-sm">{applyCurrencyMask(totals.receitaTvBox)}</span>
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{Math.round(metricTv.projecao)} un</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricTv.tendencia)}`}>
                                                    {metricTv.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CARDS MENORES RESIDENCIAL RECHEADOS COM RECEITA */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Telefonia Fixa</span>
                                                <span className="text-[9px] font-bold text-neutral-500">{totals.fixo} un</span>
                                            </div>
                                            <span className="text-base font-black text-neutral-800 dark:text-neutral-100 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaFixo)}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Meta: {metaLoja.fixo} un</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(metricFixo.projecao)} un</span>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Mesh Wi-Fi</span>
                                                <span className="text-[9px] font-bold text-neutral-500">{totals.mesh} un</span>
                                            </div>
                                            <span className="text-base font-black text-neutral-800 dark:text-neutral-100 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaMesh)}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Meta: {metaLoja.mesh} un</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(metricMesh.projecao)} un</span>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Fibra PME (UR PME)</span>
                                                <span className="text-[9px] font-bold text-indigo-500">{totals.urPme} un</span>
                                            </div>
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaFibraPme)}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Corporativo</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.urPme, 0).projecao)} un</span>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">TV Box Cabo/Stream</span>
                                                <span className="text-[9px] font-bold text-teal-500">{totals.tvBox} un</span>
                                            </div>
                                            <span className="text-base font-black text-teal-600 dark:text-teal-400 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaTvBox)}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>TV+: {totals.tv} un</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.tvBox, 0).projecao)} un</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAINEL 3: DEVICES & SEGURO */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                                            <ShieldCheck size={18} className="shrink-0" />
                                        </div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide truncate">
                                            DEVICES & SEGURO
                                        </h3>
                                    </div>
                                    <span className="text-xs font-black text-purple-700 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded shrink-0">
                                        {totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0}% Seguro/Ap.
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {/* SEGURO APARELHO COM RECEITA INDIVIDUAL */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">Proteção Móvel (Seguro)</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.seguro} / {totals.aparelho} aparelhos ({totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, totals.aparelho > 0 ? (totals.seguro / totals.aparelho) * 100 : 0)}%` }} />
                                        </div>
                                        {/* VALOR DE RECEITA INDIVIDUAL DE SEGURO */}
                                        <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] sm:text-xs bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60">
                                            <span className="text-[10px] sm:text-xs font-black uppercase text-purple-700 dark:text-purple-300 truncate">Receita Individual Seguro:</span>
                                            <span className="font-black text-purple-700 dark:text-purple-300 text-xs sm:text-sm shrink-0">{applyCurrencyMask(totals.receitaSeguro)}</span>
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{Math.round(metricSeguro.projecao)} un</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricSeguro.tendencia)}`}>
                                                    {metricSeguro.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ACESSÓRIOS */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-300">Acessórios + Películas</span>
                                            <span className="text-neutral-900 dark:text-white">{totals.acessorio + totals.pelicula} un ({applyCurrencyMask(totals.receitaAcessorio)})</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-pink-500 h-full rounded-full" style={{ width: `${Math.min(100, metricAcessorio.ating)}%` }} />
                                        </div>
                                        {isCurrentMonth && (
                                            <div className="flex justify-between items-center text-[10.5px] mt-1 text-neutral-400">
                                                <span>Proj: <strong className="text-neutral-700 dark:text-neutral-200">{applyCurrencyMask(metricAcessorio.projecao)}</strong></span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black ${getTrendBadge(metricAcessorio.tendencia)}`}>
                                                    {metricAcessorio.tendencia}% Tend.
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CARDS MENORES ANEXAÇÃO COM CLARO UP E UPGRADE SEGREGADOS */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Ticket Médio Aparelho</span>
                                            <span className="text-base font-black text-neutral-900 dark:text-white">
                                                {totals.aparelho > 0 ? applyCurrencyMask(totals.receitaAparelho / totals.aparelho) : 'R$ 0,00'}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>{totals.aparelho} vendidos</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(metricAparelho.projecao)} un</span>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Ticket Médio Acessório</span>
                                            <span className="text-base font-black text-pink-600 dark:text-pink-400">
                                                {totals.acessorio > 0 ? applyCurrencyMask(totals.receitaAcessorio / totals.acessorio) : 'R$ 0,00'}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>{totals.acessorio} un</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Películas: {totals.pelicula} un</span>
                                            </div>
                                        </div>

                                        {/* CLARO UP QUANTIDADE FEITA */}
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Claro UP Feita</span>
                                                <span className="text-[9px] font-black text-[#E3000F] bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded">PROGRAMA</span>
                                            </div>
                                            <span className="text-base font-black text-[#E3000F] block mt-0.5">{totals.claroUp} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Troca Anual Aparelho</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.claroUp, 0).projecao)} un</span>
                                            </div>
                                        </div>

                                        {/* QUANTIDADE DE UPGRADE FEITA */}
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Upgrade de Serviços</span>
                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded">MIGRAÇÕES</span>
                                            </div>
                                            <span className="text-base font-black text-blue-600 dark:text-blue-400 block mt-0.5">{totals.upgrade} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Migrações / Planos</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(calcStoreMetric(totals.upgrade, 0).projecao)} un</span>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Trocafy (Trade-In)</span>
                                            <span className="text-base font-black text-neutral-800 dark:text-neutral-100">{totals.trocafy} un</span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>Aparelhos Usados</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(metricTrocafy.projecao)} un</span>
                                            </div>
                                        </div>

                                        {/* RECEITA INDIVIDUAL SEGURO EM CARD */}
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase">Receita Seguro</span>
                                            <span className="text-base font-black text-purple-700 dark:text-purple-300">
                                                {applyCurrencyMask(totals.receitaSeguro)}
                                            </span>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-400">
                                                <span>{totals.seguro} apólices</span>
                                                <span className="font-bold text-neutral-600 dark:text-neutral-300">Proj: {Math.round(metricSeguro.projecao)} un</span>
                                            </div>
                                        </div>

                                        {/* ESPAÇOS INDIVIDUAIS PARA RECEITA BRUTA E LÍQUIDA */}
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                                                <span>Aparelhos • Bruta</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black">BRUTA</span>
                                            </div>
                                            <span className="text-base font-black text-neutral-900 dark:text-white block mt-0.5">
                                                {applyCurrencyMask(totals.receitaAparelhoBruto)}
                                            </span>
                                            <span className="text-[9px] text-neutral-400 block mt-1">Valor de nota fiscal</span>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                                                <span>Aparelhos • Líquida</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black">LÍQUIDA</span>
                                            </div>
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaAparelho)}
                                            </span>
                                            <span className="text-[9px] text-neutral-400 block mt-1">Receita comissionável</span>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                                                <span>Acessórios • Bruta</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black">BRUTA</span>
                                            </div>
                                            <span className="text-base font-black text-neutral-900 dark:text-white block mt-0.5">
                                                {applyCurrencyMask(totals.receitaAcessorioBruto)}
                                            </span>
                                            <span className="text-[9px] text-neutral-400 block mt-1">Total bruto faturado</span>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
                                                <span>Acessórios • Líquida</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 font-black">LÍQUIDA</span>
                                            </div>
                                            <span className="text-base font-black text-pink-600 dark:text-pink-400 block mt-0.5">
                                                {applyCurrencyMask(totals.receitaAcessorio)}
                                            </span>
                                            <span className="text-[9px] text-neutral-400 block mt-1">Margem líquida loja</span>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 col-span-2 flex items-center justify-between text-[10px] text-neutral-500 font-bold">
                                            <span>Proteção & Seguro:</span>
                                            <span className="text-[#E3000F] font-black">{totals.seguro} c/ Seguro • {Math.max(0, totals.aparelho - totals.seguro)} s/ Seguro</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* TABELA EXECUTIVA: PROJEÇÃO & TENDENCIAMENTO DE FECHAMENTO (ESTILO POWER BI) */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <Target size={18} className="text-[#E3000F]" /> Projeção & Tendenciamento de Fechamento da Loja
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Visão consolidada estilo Power BI com Ritmo Diário, Projeção de Fechamento do Mês ({formatMonthBR(monthFilter)}), Tendência % e Gap para a Meta.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl self-start sm:self-auto">
                                {isCurrentMonth ? `${remainingDays} dias restantes` : 'Mês finalizado'}
                            </span>
                        </div>

                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px]">
                                        <th className="py-2.5 px-3">Indicador</th>
                                        <th className="py-2.5 px-3 text-right">Realizado</th>
                                        <th className="py-2.5 px-3 text-right">Meta Loja</th>
                                        <th className="py-2.5 px-3 text-center min-w-[120px]">Atingimento Atual</th>
                                        <th className="py-2.5 px-3 text-right">Ritmo/Dia Atual</th>
                                        <th className="py-2.5 px-3 text-right bg-red-50/50 dark:bg-[#E3000F]/5 text-[#E3000F]">Projeção Fechamento</th>
                                        <th className="py-2.5 px-3 text-center bg-red-50/50 dark:bg-[#E3000F]/5">Tendência Final</th>
                                        <th className="py-2.5 px-3 text-right">Falta p/ Meta (Gap)</th>
                                        <th className="py-2.5 px-3 text-right">Ritmo Necessário/Dia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                    {storeIndicatorsList.map((item, idx) => {
                                        const m = item.metric;
                                        const hasMeta = m.meta > 0;
                                        return (
                                            <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <item.icon size={15} className="text-[#E3000F] shrink-0" />
                                                    <span>{item.label}</span>
                                                    <span className="text-[9px] font-semibold text-neutral-400 uppercase bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded ml-1">{item.group}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-neutral-900 dark:text-white">
                                                    {item.isCurrency ? applyCurrencyMask(m.real) : `${m.real} ${item.unit || ''}`}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-neutral-500">
                                                    {hasMeta ? (item.isCurrency ? applyCurrencyMask(m.meta) : `${m.meta} ${item.unit || ''}`) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    {hasMeta ? (
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${m.ating >= 100 ? 'bg-green-500' : 'bg-[#E3000F]'}`}
                                                                    style={{ width: `${Math.min(100, m.ating)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-[11px] font-black ${m.ating >= 100 ? 'text-green-600' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                                {m.ating.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400">
                                                    {isCurrentMonth ? (item.isCurrency ? applyCurrencyMask(m.ritmoDiario) : `${m.ritmoDiario.toFixed(1)}/dia`) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-[#E3000F] bg-red-50/30 dark:bg-[#E3000F]/5">
                                                    {isCurrentMonth
                                                        ? (item.isCurrency ? applyCurrencyMask(m.projecao) : `${Math.round(m.projecao)} ${item.unit || ''}`)
                                                        : (item.isCurrency ? applyCurrencyMask(m.real) : `${m.real} ${item.unit || ''}`)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center bg-red-50/30 dark:bg-[#E3000F]/5">
                                                    {hasMeta ? (
                                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${getTrendBadge(m.tendencia)}`}>
                                                            {m.tendencia}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-neutral-600 dark:text-neutral-300">
                                                    {hasMeta ? (
                                                        m.falta === 0 ? (
                                                            <span className="text-green-600 font-black flex items-center justify-end gap-1"><Check size={12} /> Batida</span>
                                                        ) : (
                                                            item.isCurrency ? applyCurrencyMask(m.falta) : `${m.falta} ${item.unit || ''}`
                                                        )
                                                    ) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold">
                                                    {hasMeta && isCurrentMonth ? (
                                                        m.falta === 0 ? (
                                                            <span className="text-green-600 text-[11px] font-bold">0/dia</span>
                                                        ) : (
                                                            <span className="text-[#E3000F] font-black">
                                                                {item.isCurrency ? `${applyCurrencyMask(m.ritmoNecessario)}/dia` : `${m.ritmoNecessario.toFixed(1)}/dia`}
                                                            </span>
                                                        )
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* GRÁFICO DIÁRIO & ANÁLISE DIA A DIA / GAP DE META DO DIA ANTERIOR */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">

                        {/* CABEÇALHO DO BLOCO */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <BarChart3 size={18} className="text-[#E3000F]" /> Curva de Vendas Diária, Análise Dia a Dia & Gap Anterior
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Acompanhamento da evolução diária com diagnóstico de variações dia contra dia e saldo de metas pendentes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl">
                                    Dia em Análise: <strong className="text-[#E3000F] font-black">Dia {currentDayRow.data || '-'}</strong> {hasPrevDay && <span>(vs Dia {prevDayRow.data})</span>}
                                </span>
                            </div>
                        </div>

                        {/* BARRAS DO GRÁFICO INTERATIVO */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
                                <span className="text-[11px]">💡 Clique em qualquer dia para inspecionar o Gap e a Variação Dia a Dia</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E3000F]"></span> Realizado</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span> Meta Dia</span>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 sm:gap-1.5 h-44 sm:h-52 pt-4 px-1 overflow-x-auto scrollbar-thin">
                                {rows.map((r, idx) => {
                                    const heightPct = maxGrossDia > 0 ? (r.grossDia / maxGrossDia) * 100 : 0;
                                    const isToday = isCurrentMonth && parseInt(r.data, 10) === elapsedDays;
                                    const isSelected = activeDayIndex === idx;
                                    const hasPassed = !isCurrentMonth || parseInt(r.data, 10) <= elapsedDays;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedDayIndex(idx)}
                                            className={`flex-1 min-w-[22px] sm:min-w-[26px] flex flex-col items-center h-full justify-end group relative transition-all outline-none rounded-t-lg p-0.5 ${isSelected ? 'bg-red-50/80 dark:bg-[#E3000F]/15 ring-2 ring-[#E3000F]' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                                                }`}
                                        >
                                            {/* Tooltip ao passar o mouse */}
                                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[9.5px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                                Dia {r.data}: {r.grossDia} Gross (Meta {r.metaDia}) • {applyCurrencyMask(r.receita)}
                                            </div>

                                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                                {/* Barra Meta Dia */}
                                                <div
                                                    className="w-1.5 sm:w-2 bg-neutral-200 dark:bg-neutral-800 rounded-t-sm"
                                                    style={{ height: `${Math.min(100, (r.metaDia / maxGrossDia) * 100)}%` }}
                                                />
                                                {/* Barra Gross Realizado */}
                                                <div
                                                    className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-500 ${r.grossDia >= r.metaDia && r.grossDia > 0
                                                        ? 'bg-emerald-500'
                                                        : r.grossDia > 0
                                                            ? 'bg-[#E3000F]'
                                                            : 'bg-neutral-200 dark:bg-neutral-800'
                                                        } ${isToday ? 'ring-1 ring-yellow-400' : ''}`}
                                                    style={{ height: `${Math.max(4, heightPct)}%` }}
                                                />
                                            </div>

                                            <span className={`text-[8.5px] sm:text-[9.5px] font-bold mt-2 ${isSelected ? 'text-[#E3000F] font-black' : isToday ? 'text-neutral-900 dark:text-white font-black' : hasPassed ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-300 dark:text-neutral-700'
                                                }`}>
                                                {r.data}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* DUAS ÁREAS ESTRATÉGICAS: GAP DE META DO DIA ANTERIOR & ANÁLISE DIA A DIA */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">

                            {/* PARTE EXCLUSIVA: MONITOR DE GAP DE META DEIXADA DO DIA ANTERIOR */}
                            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/60 dark:from-neutral-850 dark:to-neutral-900/80 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-750">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-red-100 dark:bg-[#E3000F]/20 text-[#E3000F] rounded-xl">
                                                <Target size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-neutral-900 dark:text-white uppercase tracking-wide">
                                                    Gap de Meta do Dia Anterior
                                                </h4>
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    Carry-Over de Meta e Saldo Deixado para o Dia Atual
                                                </span>
                                            </div>
                                        </div>
                                        {hasPrevDay ? (
                                            <span className="text-[10px] font-bold bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                                                Dia Anterior: {prevDayRow.data}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-neutral-400 font-bold">1º Dia do Mês</span>
                                        )}
                                    </div>

                                    {hasPrevDay ? (
                                        <div className="space-y-3">
                                            {/* METAS E REALIZADO DE ONTEM */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                                                    <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Meta de Ontem</span>
                                                    <span className="text-base font-black text-neutral-800 dark:text-neutral-100">{metaOntem} un</span>
                                                </div>
                                                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                                                    <span className="text-[9.5px] uppercase font-bold text-neutral-400 block">Realizado Ontem</span>
                                                    <span className="text-base font-black text-neutral-800 dark:text-neutral-100">{realOntem} un</span>
                                                </div>
                                                <div className={`p-2.5 rounded-xl border ${gapOntem > 0
                                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                                                    }`}>
                                                    <span className="text-[9.5px] uppercase font-bold block opacity-75">
                                                        {gapOntem > 0 ? 'Déficit Deixado' : 'Superávit'}
                                                    </span>
                                                    <span className="text-base font-black flex items-center justify-center gap-1">
                                                        {gapOntem > 0 ? `-${gapOntem} un` : `+${Math.abs(gapOntem)} un`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* RESUMO DO IMPACTO NO DIA ATUAL */}
                                            <div className="bg-white dark:bg-neutral-800/80 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-700 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-neutral-500 font-semibold">Meta Normal de Hoje (Dia {currentDayRow.data}):</span>
                                                    <strong className="text-neutral-800 dark:text-neutral-200">{metaHojeNormal} un</strong>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-neutral-500 font-semibold">Gap Herdeiro de Ontem:</span>
                                                    <strong className={gapOntem > 0 ? 'text-[#E3000F]' : 'text-emerald-600'}>
                                                        {gapOntem > 0 ? `+${gapOntem} un a recuperar` : '0 un (Zerado)'}
                                                    </strong>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 dark:border-neutral-700 font-black">
                                                    <span className="text-neutral-700 dark:text-neutral-300">Meta Rebalanceada para Hoje:</span>
                                                    <span className="text-sm text-[#E3000F] bg-red-50 dark:bg-[#E3000F]/10 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/40">
                                                        {metaHojeAjustada} un
                                                    </span>
                                                </div>
                                            </div>

                                            {/* BARRA DE PROGRESSO DO DIA ATUAL FRENTE À META AJUSTADA */}
                                            <div>
                                                <div className="flex justify-between text-xs font-bold mb-1">
                                                    <span className="text-neutral-600 dark:text-neutral-300">Progresso de Hoje com Gap Compensado:</span>
                                                    <span className="text-neutral-900 dark:text-white">{realHoje} / {metaHojeAjustada} ({pctHojeMetaAjustada}%)</span>
                                                </div>
                                                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${pctHojeMetaAjustada >= 100 ? 'bg-emerald-500' : 'bg-[#E3000F]'}`}
                                                        style={{ width: `${Math.min(100, pctHojeMetaAjustada)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-neutral-400 mt-1 block">
                                                    {gapAcumuladoAteOntem > 0
                                                        ? `⚠️ Saldo Acumulado até ontem: -${gapAcumuladoAteOntem} un no acumulado do mês.`
                                                        : `✅ Saldo Acumulado até ontem: +${Math.abs(gapAcumuladoAteOntem)} un acima da meta.`}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-neutral-400 text-xs">
                                            Primeiro dia do mês selecionado. Não há histórico de dia anterior nesta data.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ANÁLISE DIA CONTRA DIA (DOD - HOJE VS ONTEM: O QUE MELHOROU E O QUE CAIU) */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                                <Activity size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-neutral-900 dark:text-white uppercase tracking-wide">
                                                    Análise Dia a Dia (D vs D-1)
                                                </h4>
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    Diagnóstico de oscilação: O que melhoramos e pontos de atenção
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-black flex items-center justify-end gap-1 ${dodGrossDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {dodGrossDiff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {dodGrossDiff >= 0 ? `+${dodGrossDiff}` : dodGrossDiff} Gross ({dodGrossPct >= 0 ? `+${dodGrossPct}%` : `${dodGrossPct}%`})
                                            </span>
                                            <span className="text-[9.5px] text-neutral-400 block">
                                                Receita: {dodRecDiff >= 0 ? `+${applyCurrencyMask(dodRecDiff)}` : `-${applyCurrencyMask(Math.abs(dodRecDiff))}`}
                                            </span>
                                        </div>
                                    </div>

                                    {hasPrevDay ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                            {/* COLUNA 1: NO QUE MELHORAMOS */}
                                            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                                                    <TrendingUp size={14} />
                                                    <span>No que Melhoramos</span>
                                                </div>
                                                {improvedProducts.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {improvedProducts.map((p, pIdx) => (
                                                            <div key={pIdx} className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900/80 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                                                <span className="font-bold text-neutral-700 dark:text-neutral-300">{p.label}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-neutral-400">{p.prev} ➔ {p.today}</span>
                                                                    <span className="px-1.5 py-0.2 rounded font-black text-[10.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                                        +{p.diff} {p.unit}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 italic block py-2">
                                                        Nenhum produto teve ganho de volume vs o dia anterior.
                                                    </span>
                                                )}
                                            </div>

                                            {/* COLUNA 2: ONDE HOUVE QUEDA / PONTO DE ATENÇÃO */}
                                            <div className="bg-rose-50/40 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">
                                                    <TrendingDown size={14} />
                                                    <span>Onde Houve Queda (Atenção)</span>
                                                </div>
                                                {declinedProducts.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {declinedProducts.map((p, pIdx) => (
                                                            <div key={pIdx} className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900/80 p-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                                                                <span className="font-bold text-neutral-700 dark:text-neutral-300">{p.label}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-neutral-400">{p.prev} ➔ {p.today}</span>
                                                                    <span className="px-1.5 py-0.2 rounded font-black text-[10.5px] bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                                                                        -{p.diff} {p.unit}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block py-2">
                                                        ✨ Nenhuma queda registrada! Todos os produtos mantiveram ou superaram o dia anterior.
                                                    </span>
                                                )}
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-neutral-400 text-xs">
                                            Selecione um dia a partir do dia 2 para comparar com o dia imediatamente anterior.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            ) : (
                /* TABELA ESTILO EXCEL (TABELA ANALÍTICA ORIGINAL COMPLETA) */
                <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 scrollbar-thin">
                    <table className="w-full text-center border-collapse text-[10px] whitespace-nowrap min-w-max">
                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase tracking-wider sticky top-0 z-20">
                            <tr>
                                <th className="border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold sticky left-0 bg-neutral-900 dark:bg-neutral-950 shadow-[2px_0_5px_rgba(0,0,0,0.2)] z-30">DATA</th>
                                {COLUMNS.map(col => (
                                    <th key={col.key} className={`border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold ${col.highlight ? 'bg-neutral-900 dark:bg-black text-yellow-500' : ''}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                            {rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    <td className="border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 sticky left-0 bg-white dark:bg-neutral-900 font-bold text-neutral-900 dark:text-neutral-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">{row.data}</td>
                                    {COLUMNS.map(col => (
                                        <td key={col.key} className={`border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 ${col.highlight ? 'bg-yellow-50/30 dark:bg-yellow-900/10 font-bold' : ''}`}>
                                            {renderValue(row[col.key], col.isCurrency)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-neutral-50 dark:bg-neutral-900 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                            {/* LINHA DE TOTAIS REALIZADOS */}
                            <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-[#E3000F]">REALIZADO MÊS</td>
                                {COLUMNS.map(col => (
                                    <td key={col.key} className={`border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 ${col.highlight ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                        {renderValue(totals[col.key], col.isCurrency)}
                                    </td>
                                ))}
                            </tr>
                            {/* LINHA DE PROJEÇÃO MÊS */}
                            <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                <td className="border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-purple-600 dark:text-purple-400">PROJEÇÃO MÊS</td>
                                {COLUMNS.map(col => {
                                    const mData = calcStoreMetric(totals[col.key], metaLoja[col.key]);
                                    const val = isCurrentMonth
                                        ? (col.isCurrency ? mData.projecao : Math.round(mData.projecao))
                                        : totals[col.key];
                                    return (
                                        <td key={`proj-${col.key}`} className={`border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 ${col.highlight ? 'bg-yellow-100/30 dark:bg-yellow-900/10 font-bold' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                            {renderValue(val, col.isCurrency)}
                                        </td>
                                    );
                                })}
                            </tr>
                            {/* LINHA DE TENDÊNCIA (%) */}
                            <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                <td className="border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-emerald-600 dark:text-emerald-400">TENDÊNCIA (%)</td>
                                {COLUMNS.map(col => {
                                    const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
                                    if (!hasMeta) {
                                        return (
                                            <td key={`tend-${col.key}`} className={`border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 ${col.highlight ? 'bg-yellow-100/30 dark:bg-yellow-900/10' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                                <span className="text-neutral-400 dark:text-neutral-600">-</span>
                                            </td>
                                        );
                                    }
                                    const mData = calcStoreMetric(totals[col.key], metaLoja[col.key]);
                                    return (
                                        <td key={`tend-${col.key}`} className={`border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 ${col.highlight ? 'bg-yellow-100/30 dark:bg-yellow-900/10 font-bold' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${getTrendBadge(mData.tendencia)}`}>
                                                {mData.tendencia}%
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                            {/* LINHA DE METAS LOJA */}
                            <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                <td className="border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-blue-600">META LOJA</td>
                                {COLUMNS.map(col => {
                                    const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
                                    return (
                                        <td key={`meta-${col.key}`} className={`border-b border-neutral-300 dark:border-neutral-700 px-3 py-2.5 ${col.highlight ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                            {hasMeta ? renderValue(metaLoja[col.key], col.isCurrency) : <span className="text-neutral-400 dark:text-neutral-600">-</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}