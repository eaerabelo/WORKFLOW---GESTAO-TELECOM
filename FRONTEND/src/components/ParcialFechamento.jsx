import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, ShieldAlert, MessageCircle, Clock, Hash, Store, Target, CheckCircle2, FileText, Send } from 'lucide-react';
import { getTodaySP, applyCurrencyMask } from '../utils/masks';
import { getCurrentStoreName } from '../utils/stores';

export function ParcialFechamento({ hasAccess, salesData = [], goalsDB = {}, globalMonth }) {
    const todayISO = getTodaySP();
    const [yearStr, monthStr, dayStr] = todayISO.split('-');
    const dateBr = `${dayStr}/${monthStr}/${yearStr}`;
    
    // Calcula as métricas de hoje extraídas automaticamente do sistema
    const { totals, dailyGoals } = useMemo(() => {
        const activeMetas = (goalsDB || {})[globalMonth] || {};
        const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
        
        const duMovel = Number(activeMetas.diasUteisMovel) || daysInMonth;
        const duFibra = Number(activeMetas.diasUteisFibra) || daysInMonth;

        const calcDailyGoalMovel = (val) => Math.ceil((Number(val) || 0) / duMovel);
        const calcDailyGoalFibra = (val) => Math.ceil((Number(val) || 0) / duFibra);
        
        const dGoals = {
            gross: calcDailyGoalMovel(activeMetas.posTotal),
            grossPme: 0,
            aparelho: calcDailyGoalMovel(activeMetas.aparelho),
            seguro: calcDailyGoalMovel(activeMetas.seguro),
            acessorio: calcDailyGoalMovel(Number(activeMetas.acessorio) + Number(activeMetas.pelicula)),
            virtua: calcDailyGoalFibra(activeMetas.fibra),
            virtuaPme: 0,
            tv: calcDailyGoalFibra(activeMetas.tv),
            mplay: calcDailyGoalMovel(activeMetas.mplay)
        };

        const todaySales = (salesData || []).filter(s => {
            if (typeof s.data !== 'string') return false;
            if (s.data.includes('-')) return s.data === todayISO;
            return s.data === dateBr;
        });

        const sumTotals = { 
            gross: 0, grossPme: 0, aparelho: 0, receitaAparelho: 0, seguro: 0, acessorio: 0, virtua: 0, virtuaPme: 0, tv: 0, mplay: 0, upgradeUp: 0,
            posTt: 0, depPg: 0, depBl: 0, depGratis: 0, migraPos: 0, controle: 0, migraControle: 0, bl: 0, flex: 0,
            portabilidade: 0, ativacao: 0, migracao: 0, fixo: 0, fibra: 0, tvBox: 0, mesh: 0, pelicula: 0, receitaAcessorio: 0, trocafy: 0,
            grossDia: 0, totalRes: 0, contaTotal: 0, qtdaAcessorioFisico: 0
        };

        todaySales.forEach(sale => {
            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
            const port = String(sale.portabilidade || '').toUpperCase();
            const rec = Number(sale.receita) || 0;
            const recBruto = Number(sale.valorBruto || sale.receita) || 0;
            const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
            const adds = sale.adicionais || [];

            if (port === 'SIM') sumTotals.portabilidade += q;

            // CÁLCULOS DETALHADOS PARA FECHAMENTO
            if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { sumTotals.grossPme += q; }
            else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) sumTotals.migraPos += q;
                else sumTotals.posTt += q; 
            }
            else if (pBase.includes('CONTROLE')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) sumTotals.migraControle += q;
                else sumTotals.controle += q; 
            }
            else if (pBase.includes('FLEX')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) sumTotals.migraControle += q;
                else sumTotals.flex += q;
            }
            else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || sub.includes('INCLUSA') || pBase.includes('GRÁTIS') || pBase.includes('INCLUSA')) sumTotals.depGratis += q;
                else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA') || sub.includes('BL') || pBase.includes('BL')) sumTotals.depBl += q;
                else sumTotals.depPg += q;
            }
            else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('NET VIRTUA')) sumTotals.bl += q;
            else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) sumTotals.virtuaPme += q;
            else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) sumTotals.fibra += q;
            else if (pBase.includes('TV-BOX')) sumTotals.tvBox += q;
            else if (pBase.includes('TV+') || pBase.includes('TV') || pBase.includes('PONTO ADICIONAL')) sumTotals.tv += q;
            else if (pBase.includes('FIXO')) sumTotals.fixo += q;
            else if (pBase.includes('MESH')) sumTotals.mesh += q;
            if (pBase.includes('APARELHO')) { sumTotals.aparelho += q; sumTotals.receitaAparelho += rec; }
            if (pBase.includes('SEGURO')) sumTotals.seguro += q;
            if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { sumTotals.acessorio += q; sumTotals.receitaAcessorio += recBruto; sumTotals.qtdaAcessorioFisico += q; }
            if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { sumTotals.pelicula += q; sumTotals.receitaAcessorio += recBruto; sumTotals.qtdaAcessorioFisico += q; }

            const addsUpper = Array.isArray(adds) ? adds.map(a => String(a || '').toUpperCase()) : [];
            if (addsUpper.includes('TROCAFY')) sumTotals.trocafy += 1;
            if (addsUpper.includes('CLARO UP') || addsUpper.includes('UPGRADE') || pBase.includes('CLARO UP')) sumTotals.upgradeUp += 1;
            if (sale.mplay === 'SIM') sumTotals.mplay += 1;

            if (op === 'ATIVAÇÃO' && port !== 'SIM') sumTotals.ativacao += q;
            if (op === 'MIGRAÇÃO' || op === 'MIGRA') sumTotals.migracao += q;
        });

        // Consolidações Globais
        sumTotals.grossDia = sumTotals.posTt + sumTotals.controle + sumTotals.depPg + sumTotals.depBl + sumTotals.depGratis + sumTotals.migraPos + sumTotals.migraControle + sumTotals.grossPme + sumTotals.bl + sumTotals.flex;
        sumTotals.totalRes = sumTotals.fibra + sumTotals.virtuaPme + sumTotals.tv + sumTotals.tvBox + sumTotals.fixo + sumTotals.mesh;
        sumTotals.contaTotal = sumTotals.posTt + sumTotals.depPg + sumTotals.depBl + sumTotals.depGratis + sumTotals.migraPos;

        // Mapeamento compatível para a Parcial Antiga
        sumTotals.gross = sumTotals.grossDia;
        sumTotals.virtua = sumTotals.fibra + sumTotals.bl;

        return { totals: sumTotals, dailyGoals: dGoals };
    }, [salesData, globalMonth, goalsDB, todayISO, dateBr, yearStr, monthStr]);

    const [form, setForm] = useState({
        hora: '18', area: '3', loja: getCurrentStoreName(), senhas: '',
        senhasFechamento: '', churnOs: '', acaoBoost: '',
        metaGross: '', feitoGross: '', metaGrossPme: '', feitoGrossPme: '',
        metaAparelho: '', feitoAparelho: '', metaSeguro: '', feitoSeguro: '',
        metaAcessorio: '', feitoAcessorio: '', metaVirtua: '', feitoVirtua: '',
        metaVirtuaPme: '', feitoVirtuaPme: '', metaTv: '', feitoTv: '',
        metaMplay: '', feitoMplay: '', feitoUpgradeUp: ''
    });

    useEffect(() => {
        const h = new Date().getHours();
        setForm(prev => ({
            ...prev, hora: String(h),
            metaGross: dailyGoals.gross || 0, feitoGross: totals.gross || 0, metaGrossPme: dailyGoals.grossPme || 0, feitoGrossPme: totals.grossPme || 0,
            metaAparelho: dailyGoals.aparelho || 0, feitoAparelho: totals.aparelho || 0, metaSeguro: dailyGoals.seguro || 0, feitoSeguro: totals.seguro || 0,
            metaAcessorio: dailyGoals.acessorio || 0, feitoAcessorio: (totals.acessorio + totals.pelicula) || 0, metaVirtua: dailyGoals.virtua || 0, feitoVirtua: totals.virtua || 0,
            metaVirtuaPme: dailyGoals.virtuaPme || 0, feitoVirtuaPme: totals.virtuaPme || 0, metaTv: dailyGoals.tv || 0, feitoTv: (totals.tv + totals.tvBox) || 0,
            metaMplay: dailyGoals.mplay || 0, feitoMplay: totals.mplay || 0, feitoUpgradeUp: totals.upgradeUp || 0
        }));
    }, [totals, dailyGoals]);

    // Barreira de Segurança (Route Guard): Bloqueia acesso caso não tenha permissão
    if (!hasAccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-[#E3000F] mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">Esta área é restrita para controle de Parciais e Fechamentos.</p>
            </div>
        );
    }

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSendWhatsApp = () => {
        const pad = (v) => String(v).padStart(2, '0');
        const lojaFormatted = String(form.loja || '').replace(/SHOPPING/gi, 'LP');
        const text = `Parcial ${form.hora}H\nÁrea ${form.area}\nLoja: ${lojaFormatted}\n\nMETA HORA / FEITO\nSenhas: ${form.senhas || '0'}\nGross: ${pad(form.metaGross)}/${pad(form.feitoGross)}\nGross PME: ${pad(form.metaGrossPme)}/${pad(form.feitoGrossPme)}\nAparelho: ${pad(form.metaAparelho)}/${pad(form.feitoAparelho)}\nSeguro: ${pad(form.metaSeguro)}/${pad(form.feitoSeguro)}\nAcessórios: ${pad(form.metaAcessorio)}/${pad(form.feitoAcessorio)}\nVirtua: ${pad(form.metaVirtua)}/${pad(form.feitoVirtua)}\nVirtua PME: ${pad(form.metaVirtuaPme)}/${pad(form.feitoVirtuaPme)}\nTV: ${pad(form.metaTv)}/${pad(form.feitoTv)}\nMplay: ${pad(form.metaMplay)}/${pad(form.feitoMplay)}\nClaro Up: ${pad(form.feitoUpgradeUp)}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleSendFechamento = () => {
        const pad = (v) => String(v).padStart(2, '0');
        
        const anexacao = totals.aparelho > 0 ? Math.round(((totals.acessorio + totals.pelicula) / totals.aparelho) * 100) : 0;
        const conversao = totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0;
        const ticketMedio = totals.qtdaAcessorioFisico > 0 ? totals.receitaAcessorio / totals.qtdaAcessorioFisico : 0;

        const text = `${getCurrentStoreName()} \n\n` +
            `Data: ${dateBr}\n\n` +
            `Senhas: ${pad(form.senhasFechamento)}\n\n` +
            `Conta Total: ${pad(totals.contaTotal)}\n` +
            `Titular: ${pad(totals.posTt)}\n` +
            `Dependente: ${pad(totals.depPg)}\n` +
            `Dependente Bl: ${pad(totals.depBl)}\n` +
            `Dep grátis: ${pad(totals.depGratis)}\n` +
            `Migra pré-conta: ${pad(totals.migraPos)}\n` +
            `Controle: ${pad(totals.controle)}\n` +
            `Migra pré-controle: ${pad(totals.migraControle)}\n` +
            `Banda larga: ${pad(totals.bl)}\n` +
            `Flex: ${pad(totals.flex)}\n` +
            `Gross PME: ${pad(totals.grossPme)}\n\n\n` +
            `Portabilidade: ${pad(totals.portabilidade)}\n` +
            `Ativação/Migrações: ${pad(totals.ativacao)}/${pad(totals.migracao)}\n\n` +
            `GROSS TOTAL: ${pad(totals.grossDia)}\n\n\n` +
            `Net fone: ${pad(totals.fixo)}\n` +
            `Virtua: ${pad(totals.fibra)}\n` +
            `Virtua PME: ${pad(totals.virtuaPme)}\n` +
            `TV: ${pad(totals.tv)}\n` +
            `TV Box: ${pad(totals.tvBox)}\n` +
            `Mesh: ${pad(totals.mesh)}\n\n` +
            `Total: ${pad(totals.totalRes)}\n\n` +
            `Churn/OS: ${form.churnOs || '00'}\n` +
            `MPLAY: ${pad(totals.mplay)}\n\n` +
            `Acessórios: ${pad(totals.acessorio)}\n` +
            `Películas: ${pad(totals.pelicula)}\n` +
            `Anexação: ${anexacao}%\n` +
            `*Receita Total de Acessórios ${applyCurrencyMask(totals.receitaAcessorio)}\n` +
            `Ticket médio: ${applyCurrencyMask(ticketMedio)}\n` +
            `Aparelho: ${pad(totals.aparelho)}\n` +
            `Seguro: ${pad(totals.seguro)}\n` +
            `Conversão: ${conversao}%\n` +
            `*Trocafy: ${pad(totals.trocafy)}\n` +
            `Ação Boost: ${form.acaoBoost || '00'}\n` +
            `Claro Up: ${pad(totals.upgradeUp)}`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const MetricRow = ({ label, nameMeta, nameFeito, isUpgradeUp = false }) => (
        <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors px-1 sm:px-2 rounded-lg gap-2 min-w-0">
            <span className="text-[11px] sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap truncate min-w-0 flex-1">{label}</span>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {!isUpgradeUp ? (
                    <div className="flex items-center gap-1"><Target size={14} className="text-neutral-400 hidden sm:block" /><input type="number" name={nameMeta} value={form[nameMeta]} onChange={handleChange} className="w-11 sm:w-14 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-center font-bold text-[11px] sm:text-xs outline-none focus:border-[#E3000F] transition-all" /></div>
                ) : (<div className="w-11 sm:w-14"></div>)}
                <span className="text-neutral-300 dark:text-neutral-600 font-bold mx-0.5">/</span>
                <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500 hidden sm:block" /><input type="number" name={nameFeito} value={form[nameFeito]} readOnly className="w-11 sm:w-14 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-center font-black text-[11px] sm:text-xs outline-none cursor-not-allowed" title="Calculado automaticamente" /></div>
            </div>
        </div>
    );

    const StatTextRow = ({ label, value, highlight = false }) => (
        <div className={`flex justify-between items-center gap-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 min-w-0 ${highlight ? 'font-bold text-[#E3000F]' : 'text-neutral-600 dark:text-neutral-400'}`}>
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-tight sm:tracking-wider whitespace-nowrap truncate min-w-0 flex-1">{label}</span>
            <span className="text-[11px] sm:text-xs font-black shrink-0 whitespace-nowrap">{value}</span>
        </div>
    );

    return (
        <div className="h-full w-full max-w-full min-w-0 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-y-auto overflow-x-hidden animate-fade-in transition-colors">
            <div className="p-3 sm:p-6 pb-2.5 sm:pb-4 flex flex-col md:flex-row gap-2 sm:gap-4 justify-between items-start md:items-center shrink-0 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F] shrink-0"><ClipboardCheck size={20} /></div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap truncate">Parcial & Fechamento</h2>
                        <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap truncate">Geração automática de relatórios operacionais diários.</p>
                    </div>
                </div>
            </div>
            
            <div className="px-2.5 sm:px-4 md:px-6 pb-8 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full min-w-0">
                {/* COLUNA 1: PARCIAL DE VENDAS */}
                <div className="flex flex-col min-w-0">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden mb-3 sm:mb-4 flex-1 min-w-0">
                        <div className="p-3 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-[11px] sm:text-sm uppercase tracking-tight sm:tracking-wider flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 whitespace-nowrap truncate"><Clock size={15} className="text-[#E3000F] shrink-0" /> <span className="whitespace-nowrap truncate">Parcial de Vendas (Por hora)</span></h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                <div className="space-y-1 min-w-0"><label className="text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Hora</label><input type="text" name="hora" value={form.hora} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1 min-w-0"><label className="text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Área</label><input type="text" name="area" value={form.area} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1 min-w-0"><label className="text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Loja</label><input type="text" name="loja" value={form.loja} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1 min-w-0"><label className="text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Senhas</label><input type="number" name="senhas" value={form.senhas} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                            </div>
                        </div>
                        <div className="bg-neutral-100/50 dark:bg-neutral-800/80 px-3 sm:px-5 py-2 sm:py-2.5 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center gap-2 shrink-0 min-w-0">
                            <h3 className="font-bold text-neutral-700 dark:text-neutral-200 text-[9px] sm:text-[10px] uppercase tracking-tight sm:tracking-wider whitespace-nowrap truncate min-w-0">Meta / Realizado</h3>
                            <div className="flex gap-2.5 sm:gap-6 text-[8.5px] sm:text-[10px] font-bold text-neutral-500 uppercase tracking-tight sm:tracking-widest shrink-0 whitespace-nowrap">
                                <span className="flex items-center gap-1 whitespace-nowrap"><Target size={11} /> Meta</span><span className="flex items-center gap-1 text-green-600 dark:text-green-500 whitespace-nowrap"><CheckCircle2 size={11} /> Feito</span>
                            </div>
                        </div>
                        <div className="p-3 sm:p-5">
                            <MetricRow label="Gross" nameMeta="metaGross" nameFeito="feitoGross" /><MetricRow label="Gross PME" nameMeta="metaGrossPme" nameFeito="feitoGrossPme" /><MetricRow label="Aparelho" nameMeta="metaAparelho" nameFeito="feitoAparelho" /><MetricRow label="Seguro" nameMeta="metaSeguro" nameFeito="feitoSeguro" /><MetricRow label="Acessórios" nameMeta="metaAcessorio" nameFeito="feitoAcessorio" /><MetricRow label="Virtua" nameMeta="metaVirtua" nameFeito="feitoVirtua" /><MetricRow label="Virtua PME" nameMeta="metaVirtuaPme" nameFeito="feitoVirtuaPme" /><MetricRow label="TV" nameMeta="metaTv" nameFeito="feitoTv" /><MetricRow label="Mplay" nameMeta="metaMplay" nameFeito="feitoMplay" /><MetricRow label="Claro Up" nameMeta="" nameFeito="feitoUpgradeUp" isUpgradeUp={true} />
                        </div>
                    </div>
                    <button onClick={handleSendWhatsApp} className="w-full px-6 py-3 sm:py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1EBE57] transition-all shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 text-xs sm:text-base whitespace-nowrap hover:-translate-y-0.5">
                        <MessageCircle size={18} /> Compartilhar Parcial
                    </button>
                </div>

                {/* COLUNA 2: FECHAMENTO DE LOJA */}
                <div className="flex flex-col min-w-0">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden mb-3 sm:mb-4 flex-1 min-w-0">
                        <div className="p-3 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-[11px] sm:text-sm uppercase tracking-tight sm:tracking-wider flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 whitespace-nowrap truncate"><FileText size={15} className="text-[#E3000F] shrink-0" /> <span className="whitespace-nowrap truncate">Fechamento de Loja (Final do Dia)</span></h3>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="space-y-1 min-w-0"><label className="text-[8.5px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Senhas Totais</label><input type="number" name="senhasFechamento" value={form.senhasFechamento} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                                <div className="space-y-1 min-w-0"><label className="text-[8.5px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Churn / OS</label><input type="number" name="churnOs" value={form.churnOs} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                                <div className="space-y-1 min-w-0"><label className="text-[8.5px] sm:text-[10px] font-bold text-neutral-500 uppercase block whitespace-nowrap truncate">Ação Boost</label><input type="number" name="acaoBoost" value={form.acaoBoost} onChange={handleChange} className="w-full min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                            </div>
                        </div>
                        
                        <div className="p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                            <div className="min-w-0">
                                <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider sm:tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1 whitespace-nowrap truncate">Desempenho Móvel</h4>
                                <StatTextRow label="Conta Total" value={String(totals.contaTotal).padStart(2, '0')} />
                                <StatTextRow label="Titular" value={String(totals.posTt).padStart(2, '0')} />
                                <StatTextRow label="Dependente Pago" value={String(totals.depPg).padStart(2, '0')} />
                                <StatTextRow label="Dependente BL" value={String(totals.depBl).padStart(2, '0')} />
                                <StatTextRow label="Dep. Grátis" value={String(totals.depGratis).padStart(2, '0')} />
                                <StatTextRow label="Migra Pré-Conta" value={String(totals.migraPos).padStart(2, '0')} />
                                <StatTextRow label="Controle" value={String(totals.controle).padStart(2, '0')} />
                                <StatTextRow label="Migra Pré-Controle" value={String(totals.migraControle).padStart(2, '0')} />
                                <StatTextRow label="Banda Larga" value={String(totals.bl).padStart(2, '0')} />
                                <StatTextRow label="Flex" value={String(totals.flex).padStart(2, '0')} />
                                <StatTextRow label="Gross PME" value={String(totals.grossPme).padStart(2, '0')} />
                                <StatTextRow label="M-PLAY" value={String(totals.mplay).padStart(2, '0')} highlight={true} />
                                <StatTextRow label="Portabilidade" value={String(totals.portabilidade).padStart(2, '0')} highlight={true} />
                                <StatTextRow label="Ativação / Migrações" value={`${String(totals.ativacao).padStart(2, '0')} / ${String(totals.migracao).padStart(2, '0')}`} highlight={true} />
                                <div className="mt-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-2 flex justify-between items-center gap-2 min-w-0"><span className="text-[10.5px] sm:text-[11px] font-bold text-[#E3000F] uppercase tracking-wider sm:tracking-widest whitespace-nowrap truncate">Gross Total</span><span className="text-xs sm:text-sm font-black text-[#E3000F] shrink-0 whitespace-nowrap">{String(totals.grossDia).padStart(2, '0')}</span></div>
                            </div>
                            <div className="flex flex-col gap-5 sm:gap-6 min-w-0">
                                <div className="min-w-0">
                                    <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider sm:tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1 whitespace-nowrap truncate">Desempenho Residencial</h4>
                                    <StatTextRow label="Net Fone (Fixo)" value={String(totals.fixo).padStart(2, '0')} />
                                    <StatTextRow label="Virtua" value={String(totals.fibra).padStart(2, '0')} />
                                    <StatTextRow label="Virtua PME" value={String(totals.virtuaPme).padStart(2, '0')} />
                                    <StatTextRow label="TV" value={String(totals.tv).padStart(2, '0')} />
                                    <StatTextRow label="TV Box" value={String(totals.tvBox).padStart(2, '0')} />
                                    <StatTextRow label="Mesh" value={String(totals.mesh).padStart(2, '0')} />
                                    <div className="mt-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 flex justify-between items-center gap-2 min-w-0"><span className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider sm:tracking-widest whitespace-nowrap truncate">Total Residencial</span><span className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-100 shrink-0 whitespace-nowrap">{String(totals.totalRes).padStart(2, '0')}</span></div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider sm:tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1 whitespace-nowrap truncate">Aparelhos & Acessórios</h4>
                                    <StatTextRow label="Aparelhos" value={String(totals.aparelho).padStart(2, '0')} />
                                    <StatTextRow label="Acessórios / Películas" value={`${String(totals.acessorio).padStart(2, '0')} / ${String(totals.pelicula).padStart(2, '0')}`} />
                                    <StatTextRow label="Ticket Médio" value={applyCurrencyMask(totals.qtdaAcessorioFisico > 0 ? totals.receitaAcessorio / totals.qtdaAcessorioFisico : 0)} />
                                    <StatTextRow label="Receita Acessórios" value={applyCurrencyMask(totals.receitaAcessorio)} highlight={true} />
                                    <StatTextRow label="Anexação" value={`${totals.aparelho > 0 ? Math.round(((totals.acessorio + totals.pelicula) / totals.aparelho) * 100) : 0}%`} highlight={true} />
                                    <StatTextRow label="Seguro / Conversão" value={`${String(totals.seguro).padStart(2, '0')} (${totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0}%)`} />
                                    <StatTextRow label="Trocafy" value={String(totals.trocafy).padStart(2, '0')} />
                                    <StatTextRow label="Claro Up" value={String(totals.upgradeUp).padStart(2, '0')} highlight={true} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSendFechamento} className="w-full px-6 py-3 sm:py-3.5 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-base whitespace-nowrap hover:-translate-y-0.5">
                        <Send size={16} /> Compartilhar Fechamento
                    </button>
                </div>
            </div>
        </div>
    );
} 