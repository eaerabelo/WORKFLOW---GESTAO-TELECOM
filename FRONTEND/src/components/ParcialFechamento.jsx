import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, ShieldAlert, MessageCircle, Clock, Hash, Store, Target, CheckCircle2, FileText, Send } from 'lucide-react';
import { getTodaySP, applyCurrencyMask } from '../utils/masks';

export function ParcialFechamento({ hasAccess, salesData = [], goalsDB = {}, globalMonth }) {
    const todayISO = getTodaySP();
    const [yearStr, monthStr, dayStr] = todayISO.split('-');
    const dateBr = `${dayStr}/${monthStr}/${yearStr}`;
    
    // Calcula as métricas de hoje extraídas automaticamente do sistema
    const { totals, dailyGoals } = useMemo(() => {
        const activeMetas = (goalsDB || {})[globalMonth] || {};
        const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
        const calcDailyGoal = (val) => Math.ceil((Number(val) || 0) / daysInMonth);
        
        const dGoals = {
            gross: calcDailyGoal(activeMetas.posTotal),
            grossPme: 0,
            aparelho: calcDailyGoal(activeMetas.aparelho),
            seguro: calcDailyGoal(activeMetas.seguro),
            acessorio: calcDailyGoal(Number(activeMetas.acessorio) + Number(activeMetas.pelicula)),
            virtua: calcDailyGoal(activeMetas.fibra),
            virtuaPme: 0,
            tv: calcDailyGoal(activeMetas.tv),
            mplay: calcDailyGoal(activeMetas.mplay)
        };

        const todaySales = (salesData || []).filter(s => {
            if (typeof s.data !== 'string') return false;
            if (s.data.includes('-')) return s.data === todayISO;
            return s.data === dateBr;
        });

        const sumTotals = { 
            gross: 0, grossPme: 0, aparelho: 0, receitaAparelho: 0, seguro: 0, acessorio: 0, virtua: 0, virtuaPme: 0, tv: 0, mplay: 0, claroUp: 0,
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
            const q = Number(sale.qtda) || 1;
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
            else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('CLARO NET VIRTUA')) sumTotals.bl += q;
            else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) sumTotals.virtuaPme += q;
            else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) sumTotals.fibra += q;
            else if (pBase.includes('TV-BOX')) sumTotals.tvBox += q;
            else if (pBase.includes('CLARO TV+') || pBase.includes('TV') || pBase.includes('PONTO ADICIONAL')) sumTotals.tv += q;
            else if (pBase.includes('FIXO')) sumTotals.fixo += q;
            else if (pBase.includes('MESH')) sumTotals.mesh += q;
            if (pBase.includes('APARELHO')) { sumTotals.aparelho += q; sumTotals.receitaAparelho += rec; }
            if (pBase.includes('SEGURO')) sumTotals.seguro += q;
            if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { sumTotals.acessorio += q; sumTotals.receitaAcessorio += recBruto; sumTotals.qtdaAcessorioFisico += q; }
            if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { sumTotals.pelicula += q; sumTotals.receitaAcessorio += recBruto; sumTotals.qtdaAcessorioFisico += q; }

            if (adds.includes('TROCAFY')) sumTotals.trocafy += 1;
            if (adds.includes('CLARO UP')) sumTotals.claroUp += 1;
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
        hora: '18', area: '3', loja: import.meta.env.VITE_STORE_NAME || 'Shopping União', senhas: '',
        senhasFechamento: '', churnOs: '', acaoBoost: '',
        metaGross: '', feitoGross: '', metaGrossPme: '', feitoGrossPme: '',
        metaAparelho: '', feitoAparelho: '', metaSeguro: '', feitoSeguro: '',
        metaAcessorio: '', feitoAcessorio: '', metaVirtua: '', feitoVirtua: '',
        metaVirtuaPme: '', feitoVirtuaPme: '', metaTv: '', feitoTv: '',
        metaMplay: '', feitoMplay: '', feitoClaroUp: ''
    });

    useEffect(() => {
        const h = new Date().getHours();
        setForm(prev => ({
            ...prev, hora: String(h),
            metaGross: dailyGoals.gross || 0, feitoGross: totals.gross || 0, metaGrossPme: dailyGoals.grossPme || 0, feitoGrossPme: totals.grossPme || 0,
            metaAparelho: dailyGoals.aparelho || 0, feitoAparelho: totals.aparelho || 0, metaSeguro: dailyGoals.seguro || 0, feitoSeguro: totals.seguro || 0,
            metaAcessorio: dailyGoals.acessorio || 0, feitoAcessorio: (totals.acessorio + totals.pelicula) || 0, metaVirtua: dailyGoals.virtua || 0, feitoVirtua: totals.virtua || 0,
            metaVirtuaPme: dailyGoals.virtuaPme || 0, feitoVirtuaPme: totals.virtuaPme || 0, metaTv: dailyGoals.tv || 0, feitoTv: (totals.tv + totals.tvBox) || 0,
            metaMplay: dailyGoals.mplay || 0, feitoMplay: totals.mplay || 0, feitoClaroUp: totals.claroUp || 0
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
        const text = `Parcial ${form.hora}H\nÁrea ${form.area}\nLoja: ${form.loja}\n\nMETA HORA / FEITO\nSenhas: ${form.senhas || '0'}\nGross: ${pad(form.metaGross)}/${pad(form.feitoGross)}\nGross PME: ${pad(form.metaGrossPme)}/${pad(form.feitoGrossPme)}\nAparelho: ${pad(form.metaAparelho)}/${pad(form.feitoAparelho)}\nSeguro: ${pad(form.metaSeguro)}/${pad(form.feitoSeguro)}\nAcessórios: ${pad(form.metaAcessorio)}/${pad(form.feitoAcessorio)}\nVirtua: ${pad(form.metaVirtua)}/${pad(form.feitoVirtua)}\nVirtua PME: ${pad(form.metaVirtuaPme)}/${pad(form.feitoVirtuaPme)}\nTV: ${pad(form.metaTv)}/${pad(form.feitoTv)}\nMplay: ${pad(form.metaMplay)}/${pad(form.feitoMplay)}\nClaro Up: ${pad(form.feitoClaroUp)}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleSendFechamento = () => {
        const pad = (v) => String(v).padStart(2, '0');
        
        const anexacao = totals.aparelho > 0 ? Math.round(((totals.acessorio + totals.pelicula) / totals.aparelho) * 100) : 0;
        const conversao = totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0;
        const ticketMedio = totals.qtdaAcessorioFisico > 0 ? totals.receitaAcessorio / totals.qtdaAcessorioFisico : 0;

        const text = `${import.meta.env.VITE_STORE_NAME || 'Loja União Osasco'} \n\n` +
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
            `Claro UP : ${pad(totals.claroUp)}`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const MetricRow = ({ label, nameMeta, nameFeito, isClaroUp = false }) => (
        <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors px-2 -mx-2 rounded-lg">
            <span className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 w-28 shrink-0">{label}</span>
            <div className="flex items-center gap-1 sm:gap-2">
                {!isClaroUp ? (
                    <div className="flex items-center gap-1.5"><Target size={14} className="text-neutral-400 hidden sm:block" /><input type="number" name={nameMeta} value={form[nameMeta]} onChange={handleChange} className="w-12 sm:w-14 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-1.5 rounded-lg text-center font-bold text-xs outline-none focus:border-[#E3000F] transition-all" /></div>
                ) : (<div className="w-12 sm:w-14"></div>)}
                <span className="text-neutral-300 dark:text-neutral-600 font-bold mx-1">/</span>
                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500 hidden sm:block" /><input type="number" name={nameFeito} value={form[nameFeito]} readOnly className="w-12 sm:w-14 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 px-2 py-1.5 rounded-lg text-center font-black text-xs outline-none cursor-not-allowed" title="Calculado automaticamente" /></div>
            </div>
        </div>
    );

    const StatTextRow = ({ label, value, highlight = false }) => (
        <div className={`flex justify-between items-center py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 ${highlight ? 'font-bold text-[#E3000F]' : 'text-neutral-600 dark:text-neutral-400'}`}>
            <span className="text-[10px] uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black">{value}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-y-auto animate-fade-in transition-colors">
            <div className="p-6 pb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]"><ClipboardCheck size={22} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Parcial & Fechamento</h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Geração automática de relatórios operacionais diários.</p>
                    </div>
                </div>
            </div>
            
            <div className="px-4 md:px-6 pb-8 grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                {/* COLUNA 1: PARCIAL DE VENDAS */}
                <div className="flex flex-col">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden mb-4 flex-1">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wider flex items-center gap-2 mb-4"><Clock size={16} className="text-[#E3000F]" /> Parcial de Vendas (Por hora)</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Hora</label><input type="text" name="hora" value={form.hora} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Área</label><input type="text" name="area" value={form.area} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Loja</label><input type="text" name="loja" value={form.loja} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Senhas</label><input type="number" name="senhas" value={form.senhas} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                            </div>
                        </div>
                        <div className="bg-neutral-100/50 dark:bg-neutral-800/80 px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-neutral-700 dark:text-neutral-200 text-[10px] uppercase tracking-wider">Desempenho: Meta / Realizado</h3>
                            <div className="flex gap-4 sm:gap-8 text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Target size={12} /> Meta</span><span className="flex items-center gap-1 text-green-600 dark:text-green-500"><CheckCircle2 size={12} /> Feito (Auto)</span>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5">
                            <MetricRow label="Gross" nameMeta="metaGross" nameFeito="feitoGross" /><MetricRow label="Gross PME" nameMeta="metaGrossPme" nameFeito="feitoGrossPme" /><MetricRow label="Aparelho" nameMeta="metaAparelho" nameFeito="feitoAparelho" /><MetricRow label="Seguro" nameMeta="metaSeguro" nameFeito="feitoSeguro" /><MetricRow label="Acessórios" nameMeta="metaAcessorio" nameFeito="feitoAcessorio" /><MetricRow label="Virtua" nameMeta="metaVirtua" nameFeito="feitoVirtua" /><MetricRow label="Virtua PME" nameMeta="metaVirtuaPme" nameFeito="feitoVirtuaPme" /><MetricRow label="TV" nameMeta="metaTv" nameFeito="feitoTv" /><MetricRow label="Mplay" nameMeta="metaMplay" nameFeito="feitoMplay" /><MetricRow label="Claro Up" nameMeta="" nameFeito="feitoClaroUp" isClaroUp={true} />
                        </div>
                    </div>
                    <button onClick={handleSendWhatsApp} className="w-full px-8 py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1EBE57] transition-all shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 text-sm sm:text-base hover:-translate-y-0.5">
                        <MessageCircle size={20} /> Compartilhar Parcial
                    </button>
                </div>

                {/* COLUNA 2: FECHAMENTO DE LOJA */}
                <div className="flex flex-col">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden mb-4 flex-1">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wider flex items-center gap-2 mb-4"><FileText size={16} className="text-[#E3000F]" /> Fechamento de Loja (Final do Dia)</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Senhas Totais</label><input type="number" name="senhasFechamento" value={form.senhasFechamento} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Churn / OS</label><input type="number" name="churnOs" value={form.churnOs} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">Ação Boost</label><input type="number" name="acaoBoost" value={form.acaoBoost} onChange={handleChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#E3000F]" placeholder="Qtd..." /></div>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1">Desempenho Móvel</h4>
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
                                <StatTextRow label="Portabilidade" value={String(totals.portabilidade).padStart(2, '0')} highlight={true} />
                                <StatTextRow label="Ativação / Migrações" value={`${String(totals.ativacao).padStart(2, '0')} / ${String(totals.migracao).padStart(2, '0')}`} highlight={true} />
                                <div className="mt-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-2 flex justify-between items-center"><span className="text-[11px] font-bold text-[#E3000F] uppercase tracking-widest">Gross Total</span><span className="text-sm font-black text-[#E3000F]">{String(totals.grossDia).padStart(2, '0')}</span></div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1">Desempenho Residencial</h4>
                                    <StatTextRow label="Net Fone (Fixo)" value={String(totals.fixo).padStart(2, '0')} />
                                    <StatTextRow label="Virtua" value={String(totals.fibra).padStart(2, '0')} />
                                    <StatTextRow label="Virtua PME" value={String(totals.virtuaPme).padStart(2, '0')} />
                                    <StatTextRow label="TV" value={String(totals.tv).padStart(2, '0')} />
                                    <StatTextRow label="TV Box" value={String(totals.tvBox).padStart(2, '0')} />
                                    <StatTextRow label="Mesh" value={String(totals.mesh).padStart(2, '0')} />
                                    <div className="mt-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 flex justify-between items-center"><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">Total Residencial</span><span className="text-sm font-black text-neutral-800 dark:text-neutral-100">{String(totals.totalRes).padStart(2, '0')}</span></div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1">Aparelhos & Acessórios</h4>
                                    <StatTextRow label="Aparelhos" value={String(totals.aparelho).padStart(2, '0')} />
                                    <StatTextRow label="Acessórios / Películas" value={`${String(totals.acessorio).padStart(2, '0')} / ${String(totals.pelicula).padStart(2, '0')}`} />
                                    <StatTextRow label="Ticket Médio" value={applyCurrencyMask(totals.qtdaAcessorioFisico > 0 ? totals.receitaAcessorio / totals.qtdaAcessorioFisico : 0)} />
                                    <StatTextRow label="Receita Acessórios" value={applyCurrencyMask(totals.receitaAcessorio)} highlight={true} />
                                    <StatTextRow label="Anexação" value={`${totals.aparelho > 0 ? Math.round(((totals.acessorio + totals.pelicula) / totals.aparelho) * 100) : 0}%`} highlight={true} />
                                    <StatTextRow label="Seguro / Conversão" value={`${String(totals.seguro).padStart(2, '0')} (${totals.aparelho > 0 ? Math.round((totals.seguro / totals.aparelho) * 100) : 0}%)`} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSendFechamento} className="w-full px-8 py-3.5 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base hover:-translate-y-0.5">
                        <Send size={18} /> Compartilhar Fechamento
                    </button>
                </div>
            </div>
        </div>
    );
} 