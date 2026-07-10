import React, { useState, useEffect } from 'react';
import { Target, Lock, Check, History, MonitorPlay, Smartphone, Home, Watch, ShieldCheck, Save, LineChart, Loader2, ClipboardList, Sparkles, TrendingDown, TrendingUp, Presentation, FileDown } from 'lucide-react';
import { METAS_PADRAO } from '../utils/constants';
import { applyCurrencyMask, parseCurrencyToFloat } from '../utils/masks';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Indicadores } from './Indicadores.jsx';

const STORE_ID = import.meta.env.VITE_STORE_ID || 'uniao_osasco';

const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };

export const Gestao = ({ hasAccess, canEdit, setAuthModal, goalsDB, setGoalsDB, currentYYYYMM, salesData = [], usersDB, globalMonth }) => {
    const [selectedGoalMonth, setSelectedGoalMonth] = useState(currentYYYYMM);
    const [goalForm, setGoalForm] = useState({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    const [showGoalSuccess, setShowGoalSuccess] = useState(false);
    const [metaActiveSubTab, setMetaActiveSubTab] = useState('DEFINIR');
    const [selectedSxsMonth, setSelectedSxsMonth] = useState(globalMonth || currentYYYYMM);
    const [diagnostics, setDiagnostics] = useState({});

    const [allHistoricalSales, setAllHistoricalSales] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        setDiagnostics((goalsDB || {})[selectedSxsMonth]?.diagnosticos || {});
    }, [selectedSxsMonth, goalsDB]);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const data = await fetchSales();
                setAllHistoricalSales(data);
            } catch (error) {
                console.error("Erro ao buscar histórico na Oracle API:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        setSelectedSxsMonth(globalMonth || currentYYYYMM);
    }, [globalMonth, currentYYYYMM]);

    useEffect(() => {
        const data = (goalsDB || {})[selectedGoalMonth] || {
            receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0,
            fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0, desafio: 0, diasUteisMovel: '', diasUteisFibra: ''
        };
        setGoalForm({ ...data, receita: applyCurrencyMask(data.receita), diasUteisMovel: data.diasUteisMovel || '', diasUteisFibra: data.diasUteisFibra || '' });
    }, [selectedGoalMonth, goalsDB]);

    const handleGoalChange = (e) => {
        let { name, value } = e.target;
        if (name === 'receita') value = applyCurrencyMask(value);
        else value = value.replace(/\D/g, '');
        setGoalForm(prev => ({ ...prev, [name]: value }));
    };
    const saveGoals = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        setGoalsDB(prev => ({
            ...prev,
            [selectedGoalMonth]: {
                ...goalForm,
                receita: parseCurrencyToFloat(goalForm.receita),
                posTotal: Number(goalForm.posTotal), posPago: Number(goalForm.posPago), controle: Number(goalForm.controle),
                urTotal: Number(goalForm.urTotal), fibra: Number(goalForm.fibra), tv: Number(goalForm.tv), fixo: Number(goalForm.fixo) || 0,
                aparelho: Number(goalForm.aparelho), acessorio: Number(goalForm.acessorio), pelicula: Number(goalForm.pelicula),
                seguro: Number(goalForm.seguro), mesh: Number(goalForm.mesh), mplay: Number(goalForm.mplay), trocafy: Number(goalForm.trocafy),
                diasUteisMovel: Number(goalForm.diasUteisMovel) || 0, diasUteisFibra: Number(goalForm.diasUteisFibra) || 0,
                lastUpdated: Date.now()
            }
        }));
        setShowGoalSuccess(true);
        setTimeout(() => setShowGoalSuccess(false), 3000);
    };

    const handleCopyFromPreviousMonth = () => {
        const [year, month] = (selectedGoalMonth || '').split('-');
        let prevMonth = parseInt(month, 10) - 1;
        let prevYear = parseInt(year, 10);
        if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
        const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        const prevData = (goalsDB || {})[prevKey];
        if (prevData) setGoalForm({ ...prevData, receita: applyCurrencyMask(prevData.receita) });
        else setGoalForm({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    };

    const handleDiagChange = (weekId, field, value) => {
        setDiagnostics(prev => ({
            ...prev,
            [weekId]: { ...(prev[weekId] || {}), [field]: value }
        }));
    };

    const handleExportDiagnosticsExcel = () => {
        if (weeklyMetrics.length <= 1) {
            toast.error('Não há dados suficientes para gerar o relatório.');
            return;
        }

        const dataToExport = [];
        weeklyMetrics.slice(1).forEach((week, idx) => {
            const prevWeek = weeklyMetrics[idx];
            const weekId = `week_${idx + 1}`;
            const currentDiag = diagnostics[weekId] || { causa: '', acao: '' };

            const drops = Object.entries(week.crescimentos || {}).filter(([, v]) => v < 0).map(([k, v]) => `${k}: ${v.toFixed(1)}%`).join(', ');
            const gains = Object.entries(week.crescimentos || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k}: +${v.toFixed(1)}%`).join(', ');

            dataToExport.push({
                'Semana': `${prevWeek.label.split('(')[0].trim()} vs ${week.label.split('(')[0].trim()}`,
                'Período': `${prevWeek.label.split('(')[1]?.replace(')', '')} vs ${week.label.split('(')[1]?.replace(')', '')}`,
                'Pontos de Atenção (Quedas)': drops || 'Nenhuma queda registrada.',
                'Destaques (Ganhos)': gains || 'Nenhum ganho expressivo.',
                'Causa Raiz': currentDiag.causa || 'Não preenchido.',
                'Plano de Ação': currentDiag.acao || 'Não preenchido.'
            });
        });

        if (dataToExport.length === 0) {
            toast.error('Nenhum diagnóstico para exportar.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Diagnostico Semanal");
        XLSX.writeFile(workbook, `Diagnostico_Semanal_${selectedSxsMonth}.xlsx`);
        toast.success('Diagnóstico exportado para Excel com sucesso!');
    };

    const handleSaveDiagnostics = () => {
        if (!canEdit) return;
        const payload = { ...(goalsDB || {})[selectedSxsMonth] || safeMetasPadrao, diagnosticos: diagnostics, lastUpdated: Date.now() };
        setGoalsDB(prev => ({ ...prev, [selectedSxsMonth]: payload }));
        toast.success('Diagnósticos da semana salvos com sucesso!');
    };

    const handleExportPPTX = () => {
        const toastId = toast.loading('Gerando PowerPoint...');
        // Importação dinâmica para não pesar o carregamento inicial da página
        import('pptxgenjs').then((module) => {
            const PptxGenJS = module.default || module;
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';

            // SLIDE DE CAPA
            let slide = pptx.addSlide();
            slide.background = { color: 'E3000F' };
            slide.addText('DIAGNÓSTICO SEMANAL', { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 44, color: 'FFFFFF', bold: true });
            slide.addText(`Mês Referência: ${selectedSxsMonth}`, { x: 0, y: '55%', w: '100%', align: 'center', fontSize: 24, color: 'FFFFFF' });

            if (weeklyMetrics.length > 1) {
                weeklyMetrics.slice(1).forEach((week, idx) => {
                    const prevWeek = weeklyMetrics[idx];
                    const weekId = `week_${idx + 1}`;
                    const currentDiag = diagnostics[weekId] || { causa: '', acao: '' };

                    const drops = Object.entries(week.crescimentos || {}).filter(([, v]) => v < 0).map(([k, v]) => `${k}: ${v.toFixed(1)}%`);
                    const gains = Object.entries(week.crescimentos || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k}: +${v.toFixed(1)}%`);

                    let slideWeek = pptx.addSlide();
                    
                    slideWeek.addText(`${prevWeek.label.split('(')[0].trim()} vs ${week.label.split('(')[0].trim()}`, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true, color: '333333', border: { type: 'bottom', pt: 2, color: 'E3000F' } });
                    slideWeek.addText(`${prevWeek.label.split('(')[1]?.replace(')', '')} vs ${week.label.split('(')[1]?.replace(')', '')}`, { x: 0.5, y: 1.0, w: '90%', fontSize: 14, color: '666666' });

                    slideWeek.addText('Pontos de Atenção (Quedas):', { x: 0.5, y: 1.5, w: '40%', fontSize: 14, bold: true, color: 'E3000F' });
                    slideWeek.addText(drops.length > 0 ? drops.join(', ') : 'Nenhuma queda registrada.', { x: 0.5, y: 1.9, w: '40%', fontSize: 12, color: '333333' });

                    slideWeek.addText('Destaques (Ganhos):', { x: 0.5, y: 3.0, w: '40%', fontSize: 14, bold: true, color: '107C41' });
                    slideWeek.addText(gains.length > 0 ? gains.slice(0, 5).join(', ') + (gains.length > 5 ? '...' : '') : 'Nenhum ganho expressivo.', { x: 0.5, y: 3.4, w: '40%', fontSize: 12, color: '333333' });

                    slideWeek.addText('Causa Raiz:', { x: 5.0, y: 1.5, w: '45%', fontSize: 14, bold: true, color: '333333' });
                    slideWeek.addText(currentDiag.causa || 'Não preenchido.', { x: 5.0, y: 1.9, w: '45%', h: 1.0, fontSize: 12, color: '666666', valign: 'top' });

                    slideWeek.addText('Plano de Ação / Melhorias:', { x: 5.0, y: 3.0, w: '45%', fontSize: 14, bold: true, color: '333333' });
                    slideWeek.addText(currentDiag.acao || 'Não preenchido.', { x: 5.0, y: 3.4, w: '45%', h: 1.0, fontSize: 12, color: '666666', valign: 'top' });
                });
            } else {
                let slideEmpty = pptx.addSlide();
                slideEmpty.addText('Aguardando o fechamento de mais semanas neste mês para gerar os comparativos.', { x: 0, y: '45%', w: '100%', align: 'center', fontSize: 18, color: '666666' });
            }

            pptx.writeFile({ fileName: `Diagnostico_Semanal_${selectedSxsMonth}.pptx` }).then(() => {
                toast.success('PowerPoint gerado com sucesso!', { id: toastId });
            });
        }).catch(err => {
            console.error(err);
            toast.error('Erro ao gerar PowerPoint. Instale a biblioteca rodando: npm install pptxgenjs', { id: toastId });
        });
    };

    const monthNames = Object.keys(goalsDB || {}).sort((a, b) => b.localeCompare(a));

    const monthlyMetrics = React.useMemo(() => {
        const metricsByMonth = {};
        const sourceData = allHistoricalSales.length > 0 ? allHistoricalSales : salesData;

        (sourceData || []).forEach(sale => {
            if (!sale.data) return;
            
            let saleMonth = '';
            if (typeof sale.data === 'string') {
                if (sale.data.includes('-')) {
                    saleMonth = sale.data.slice(0, 7);
                } else if (sale.data.includes('/')) {
                    const parts = sale.data.split('/');
                    if (parts.length === 3) saleMonth = `${parts[2]}-${parts[1]}`;
                }
            }

            if (!saleMonth) return;

            if (!metricsByMonth[saleMonth]) {
                metricsByMonth[saleMonth] = {
                    receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
                };
            }

            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
            const rec = Number(sale.receita) || 0;
            const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);

            metricsByMonth[saleMonth].receita += rec;

            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
            let bl = 0, flex = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, urPme = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0;

            if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
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

            if (sale.mplay === 'SIM') metricsByMonth[saleMonth].mplay += 1;

            metricsByMonth[saleMonth].posTotal += (posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
            metricsByMonth[saleMonth].posPago += (posTt + migracaoPos + depPg + depBl + depGratis);
            metricsByMonth[saleMonth].controle += (controle + migracaoControle);
            metricsByMonth[saleMonth].urTotal += (fibra + tv + tvBox + fixo + urPme);
            metricsByMonth[saleMonth].fibra += (fibra + bl);
            metricsByMonth[saleMonth].tv += (tv + tvBox);
            metricsByMonth[saleMonth].fixo += fixo;
            metricsByMonth[saleMonth].aparelho += aparelho;
            metricsByMonth[saleMonth].acessorio += acessorio;
            metricsByMonth[saleMonth].pelicula += pelicula;
            metricsByMonth[saleMonth].seguro += seguro;
        });

        return metricsByMonth;
    }, [allHistoricalSales, salesData]);

    const weeklyMetrics = React.useMemo(() => {
        const [yearStr, monthStr] = selectedSxsMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // 0-indexed month

        const toIso = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const firstDay = new Date(year, month, 1);
        const dayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu
        const diffToThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
        
        let currentStart = new Date(year, month, 1 - diffToThursday);
        const weeks = [];
        let weekNum = 1;
        
        const formatDayMonth = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        while (currentStart < new Date(year, month + 1, 1)) {
            const currentEnd = new Date(currentStart);
            currentEnd.setDate(currentStart.getDate() + 6); // + 6 dias (chega na Quarta)
            
            weeks.push({
                isoStart: toIso(currentStart),
                isoEnd: toIso(currentEnd),
                label: `Semana ${weekNum} (${formatDayMonth(currentStart)} a ${formatDayMonth(currentEnd)})`,
                receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
            });
            
            currentStart.setDate(currentStart.getDate() + 7);
            weekNum++;
        }

        const prevWeekStart = new Date(year, month, 1 - diffToThursday - 7);
        const prevWeekEnd = new Date(year, month, 1 - diffToThursday - 1);
        const prevWeekIsoStart = toIso(prevWeekStart);
        const prevWeekIsoEnd = toIso(prevWeekEnd);

        const prevWeekData = {
            receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
        };

        const sourceData = allHistoricalSales.length > 0 ? allHistoricalSales : salesData;

        const accumulateSale = (sale, target) => {
            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
            const rec = Number(sale.receita) || 0;
            const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);

            target.receita += rec;

            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
            let bl = 0, flex = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, urPme = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0, mplay = 0;

            if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
            else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q;
                else posTt += q; 
            }
            else if (pBase.includes('CONTROLE')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                else controle += q; 
            }
            else if (pBase.includes('FLEX')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                else flex += q;
            }
            else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q;
                else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA')) depBl += q;
                else depPg += q;
            }
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

            target.posTotal += (posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
            target.posPago += (posTt + migracaoPos + depPg + depBl + depGratis);
            target.controle += (controle + migracaoControle);
            target.urTotal += (fibra + tv + tvBox + fixo + urPme);
            target.fibra += (fibra + bl);
            target.tv += (tv + tvBox);
            target.aparelho += aparelho;
            target.acessorio += acessorio;
            target.pelicula += pelicula;
            target.seguro += seguro;
            target.mplay += mplay;
        };

        (sourceData || []).forEach(sale => {
            if (!sale.data) return;
            
            // Filtragem idêntica à Seção Resultado
            let saleIsoDate = '';
            if (typeof sale.data === 'string') {
                if (sale.data.includes('-')) {
                    saleIsoDate = sale.data;
                } else if (sale.data.includes('/')) {
                    const parts = sale.data.split('/');
                    if (parts.length === 3) saleIsoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            
            let wIdx = weeks.findIndex(w => saleIsoDate >= w.isoStart && saleIsoDate <= w.isoEnd);

            if (wIdx !== -1) {
                accumulateSale(sale, weeks[wIdx]);
            } else if (saleIsoDate >= prevWeekIsoStart && saleIsoDate <= prevWeekIsoEnd) {
                accumulateSale(sale, prevWeekData);
            }
        });

        // Cálculo Matemático de Crescimento (Semana Contra Semana)
        for (let i = 0; i < weeks.length; i++) {
            weeks[i].crescimentos = {};
            ['receita', 'posTotal', 'posPago', 'controle', 'urTotal', 'fibra', 'tv', 'aparelho', 'acessorio', 'pelicula', 'seguro', 'mplay'].forEach(metric => {
                const prev = i === 0 ? prevWeekData[metric] : weeks[i - 1][metric];
                const curr = weeks[i][metric];
                if (prev > 0) {
                    weeks[i].crescimentos[metric] = ((curr - prev) / prev) * 100;
                } else if (curr > 0) {
                    weeks[i].crescimentos[metric] = 100;
                } else {
                    weeks[i].crescimentos[metric] = 0;
                }
            });
        }

        return weeks;
    }, [salesData, allHistoricalSales, selectedSxsMonth]);

    const renderMxMCell = (realVal, goalVal, isCurrency = false) => {
        const rVal = Number(realVal) || 0;
        const gVal = Number(goalVal) || 0;
        const pct = gVal > 0 ? (rVal / gVal) * 100 : (rVal > 0 ? 100 : 0);
        const formattedReal = isCurrency ? applyCurrencyMask(rVal) : rVal;
        const formattedGoal = isCurrency ? applyCurrencyMask(gVal) : gVal;
        
        let pctColor = 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
        if (pct >= 100) pctColor = 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        else if (pct >= 80) pctColor = 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        else if (gVal > 0) pctColor = 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400';

        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span>{formattedReal}</span>
                    {gVal > 0 && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${pctColor}`}>{pct.toFixed(1)}%</span>}
                </div>
                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {formattedGoal}</span>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            {!hasAccess ? (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                        <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Apenas contas de liderança têm autorização para visualizar o espelho de metas.</p>
                        <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' })} className="px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Autenticar</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 overflow-x-auto scrollbar-hide" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                        <button onClick={() => setMetaActiveSubTab('DEFINIR')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'DEFINIR' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Definir Metas</button>
                        <button onClick={() => setMetaActiveSubTab('COMPARATIVO')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'COMPARATIVO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Histórico MxM</button>
                        <button onClick={() => setMetaActiveSubTab('SEMANAL')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'SEMANAL' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Histórico SXS</button>
                        <button onClick={() => setMetaActiveSubTab('DIAGNOSTICO')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'DIAGNOSTICO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Diagnóstico Semanal</button>
                        <button onClick={() => setMetaActiveSubTab('INDICADORES')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'INDICADORES' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Indicadores</button>
                    </div>

                    {metaActiveSubTab === 'DEFINIR' && (
                        <div className="flex flex-col flex-1 relative overflow-hidden">
                            <div className={`absolute top-4 right-8 z-50 flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 px-6 py-4 rounded-xl shadow-lg transition-all duration-500 ${showGoalSuccess ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                                <Check size={20} />
                                <span className="font-bold text-sm">Metas publicadas com sucesso!</span>
                            </div>

                            <div className="p-6 md:p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-50/50 dark:bg-neutral-800/50 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Target className="text-[#E3000F]" /> Gestão de Metas Mensais</h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Configure a <strong className="text-neutral-700 dark:text-neutral-300">Meta Total da Loja</strong>. O sistema dividirá os valores pela quantidade de vendedores ativos automaticamente.</p>
                                </div>
                                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center gap-2 px-2 text-sm font-bold text-neutral-500"><History size={16} /> Mês:</div>
                                    <input type="month" value={selectedGoalMonth} onChange={(e) => setSelectedGoalMonth(e.target.value)} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-4 py-2 rounded-lg font-bold outline-none cursor-pointer" />
                                    {canEdit && (
                                        <button type="button" onClick={handleCopyFromPreviousMonth} className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Puxar Mês Anterior</button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50/30 dark:bg-neutral-950/50">
                                <form onSubmit={saveGoals} className="max-w-6xl mx-auto space-y-6 pb-12">
                                    <fieldset disabled={!canEdit} className="space-y-6 min-w-0">
                                        <div className="lg:col-span-4 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-800 relative overflow-hidden group shadow-xl">
                                            <Target size={120} className="absolute -right-4 -bottom-4 text-white opacity-5 group-hover:opacity-10 transition-opacity" />
                                            <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><MonitorPlay size={20} /></div><h3 className="font-bold text-white text-lg uppercase tracking-wide">Receita Global (R$)</h3></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2 md:col-span-1"><label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">Receita Total</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white/50">R$</span><input type="text" name="receita" value={goalForm.receita} onChange={handleGoalChange} className="w-full bg-white/10 border border-white/20 text-white pl-12 pr-4 py-3.5 rounded-xl font-black text-2xl outline-none focus:border-green-400 transition-colors" /></div></div>
                                                <div className="space-y-2"><label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">Dias Úteis (Móvel/Devices)</label><input type="number" min="1" max="31" name="diasUteisMovel" value={goalForm.diasUteisMovel} onChange={handleGoalChange} placeholder="Ex: 26" className="w-full bg-white/10 border border-white/20 text-white px-4 py-3.5 rounded-xl font-bold text-lg outline-none focus:border-blue-400 transition-colors" title="Deixe em branco para usar todos os dias do mês" /></div>
                                                <div className="space-y-2"><label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">Dias Úteis (Residencial/Fibra)</label><input type="number" min="1" max="31" name="diasUteisFibra" value={goalForm.diasUteisFibra} onChange={handleGoalChange} placeholder="Ex: 26" className="w-full bg-white/10 border border-white/20 text-white px-4 py-3.5 rounded-xl font-bold text-lg outline-none focus:border-orange-400 transition-colors" title="Deixe em branco para usar todos os dias do mês" /></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-red-50 dark:bg-red-900/20 text-[#E3000F] rounded-lg"><Smartphone size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Móvel</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós Total</label><input type="text" name="posTotal" value={goalForm.posTotal} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-[#E3000F]" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós-Pago</label><input type="text" name="posPago" value={goalForm.posPago} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Controle</label><input type="text" name="controle" value={goalForm.controle} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg"><Home size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Residencial</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">UR Total</label><input type="text" name="urTotal" value={goalForm.urTotal} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-neutral-800" /></div><div className="grid grid-cols-3 gap-3"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Fibra</label><input type="text" name="fibra" value={goalForm.fibra} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">TV</label><input type="text" name="tv" value={goalForm.tv} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Fixo</label><input type="text" name="fixo" value={goalForm.fixo} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg"><Watch size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Aparelhos & Acessórios</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Aparelhos</label><input type="text" name="aparelho" value={goalForm.aparelho} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-orange-500" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Acessórios</label><input type="text" name="acessorio" value={goalForm.acessorio} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Películas</label><input type="text" name="pelicula" value={goalForm.pelicula} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-lg"><ShieldCheck size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Serviços / Adicionais</h4></div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-5"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Seguro</label><input type="text" name="seguro" value={goalForm.seguro} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">M-Play</label><input type="text" name="mplay" value={goalForm.mplay} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Trocafy</label><input type="text" name="trocafy" value={goalForm.trocafy} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">MESH</label><input type="text" name="mesh" value={goalForm.mesh} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    {canEdit && (
                                        <div className="flex justify-end pt-4 sticky bottom-4 z-20"><button type="submit" className="px-10 py-4 bg-[#E3000F] text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-2xl shadow-red-500/40 flex items-center gap-2 hover:-translate-y-1"><Save size={20} /> Atualizar e Publicar Metas</button></div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'COMPARATIVO' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                        <LineChart className="text-[#E3000F]" /> Histórico Comparativo (MxM)
                                        {isLoadingHistory && <Loader2 size={20} className="animate-spin text-neutral-400" />}
                                    </h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Acompanhe a evolução do faturamento e compare os resultados de vendas mês a mês.</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase text-[10px] tracking-wider">
                                            <tr><th className="px-6 py-4 rounded-tl-2xl font-bold sticky left-0 z-10 bg-neutral-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Mês de Ref.</th><th className="px-6 py-4 font-bold text-green-400">Receita (R$)</th><th className="px-6 py-4 font-bold">Pós Total</th><th className="px-6 py-4 font-bold text-neutral-400">Pós Pago</th><th className="px-6 py-4 font-bold text-neutral-400">Controle</th><th className="px-6 py-4 font-bold">UR Total</th><th className="px-6 py-4 font-bold text-neutral-400">Fibra</th><th className="px-6 py-4 font-bold text-neutral-400">TV</th><th className="px-6 py-4 font-bold text-neutral-400">Fixo</th><th className="px-6 py-4 font-bold">Aparelhos</th><th className="px-6 py-4 font-bold">Acessórios</th><th className="px-6 py-4 font-bold">Películas</th><th className="px-6 py-4 font-bold">Seguro</th><th className="px-6 py-4 font-bold rounded-tr-2xl">M-Play</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {monthNames.map(month => {
                                                const m = goalsDB[month];
                                                const real = monthlyMetrics[month] || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 };
                                                const isCurrent = month === currentYYYYMM;
                                                return (
                                                    <tr key={month} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${isCurrent ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                                        <td className={`px-6 py-4 font-bold tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)] ${isCurrent ? 'bg-red-50 dark:bg-neutral-800 text-[#E3000F]' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100'}`}>
                                                            {month.split('-').reverse().join('-')} {isCurrent && <span className="ml-2 text-[9px] bg-[#E3000F] text-white px-2 py-0.5 rounded-full">Atual</span>}
                                                        </td>
                                                        <td className="px-6 py-3 font-black text-green-600 dark:text-green-500 whitespace-nowrap">{renderMxMCell(real.receita, m.receita, true)}</td>
                                                        <td className="px-6 py-3 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{renderMxMCell(real.posTotal, m.posTotal)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.posPago, m.posPago)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.controle, m.controle)}</td>
                                                        <td className="px-6 py-3 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{renderMxMCell(real.urTotal, m.urTotal)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.fibra, m.fibra)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.tv, m.tv)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.fixo, m.fixo || 0)}</td>
                                                        <td className="px-6 py-3 font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">{renderMxMCell(real.aparelho, m.aparelho)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.acessorio, m.acessorio)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.pelicula, m.pelicula)}</td>
                                                        <td className="px-6 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{renderMxMCell(real.seguro, m.seguro)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.mplay, m.mplay)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'SEMANAL' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                            <LineChart className="text-[#E3000F]" /> Histórico Semana x Semana (SxS)
                                            {isLoadingHistory && <Loader2 size={20} className="animate-spin text-neutral-400" />}
                                        </h2>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Acompanhe as vendas faturadas semana a semana referentes ao mês selecionado. Os dados são trazidos de quinta a quarta.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 shrink-0">
                                        <div className="flex items-center gap-2 px-2 text-sm font-bold text-neutral-500"><History size={16} /> Mês:</div>
                                        <input type="month" value={selectedSxsMonth} onChange={(e) => setSelectedSxsMonth(e.target.value)} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-4 py-2 rounded-lg font-bold outline-none cursor-pointer" />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tl-2xl font-bold sticky left-0 z-10 bg-neutral-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Semana</th>
                                                <th className="px-6 py-4 font-bold text-green-400">Receita (R$)</th>
                                                <th className="px-6 py-4 font-bold">Gross Total</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Pós Pago</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Controle</th>
                                                <th className="px-6 py-4 font-bold">UR Total</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Fibra</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">TV</th>
                                                <th className="px-6 py-4 font-bold text-orange-400">Aparelhos</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Acessórios</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Películas</th>
                                                <th className="px-6 py-4 font-bold text-blue-400">Seguro</th>
                                                <th className="px-6 py-4 font-bold rounded-tr-2xl text-purple-400">M-Play</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {weeklyMetrics.map((week, idx) => {
                                                const renderCrescimento = (metric) => {
                                                    if (week.label.includes('N/A')) return null;
                                                    const val = week.crescimentos?.[metric] || 0;
                                                    if (val === 0 && week[metric] === 0) return null;
                                                    const isPos = val > 0;
                                                    const isNeg = val < 0;
                                                    const color = isPos ? 'text-green-500 bg-green-50 dark:bg-green-500/10' : isNeg ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
                                                    return <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${color}`}>{(isPos ? '+' : '') + val.toFixed(1)}%</span>;
                                                };
                                                return (
                                                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                                        <td className="px-6 py-4 font-bold tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)] bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">{week.label}</td>
                                                        <td className="px-6 py-4 font-black text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{applyCurrencyMask(week.receita)}{renderCrescimento('receita')}</td>
                                                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{week.posTotal}{renderCrescimento('posTotal')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.posPago}{renderCrescimento('posPago')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.controle}{renderCrescimento('controle')}</td>
                                                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{week.urTotal}{renderCrescimento('urTotal')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.fibra}{renderCrescimento('fibra')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.tv}{renderCrescimento('tv')}</td>
                                                        <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{week.aparelho}{renderCrescimento('aparelho')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{week.acessorio}{renderCrescimento('acessorio')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{week.pelicula}{renderCrescimento('pelicula')}</td>
                                                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-500 whitespace-nowrap">{week.seguro}{renderCrescimento('seguro')}</td>
                                                        <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-500 whitespace-nowrap">{week.mplay}{renderCrescimento('mplay')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-neutral-50 dark:bg-neutral-900 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                            {(() => {
                                                const currentMonthMeta = (goalsDB || {})[selectedSxsMonth] || safeMetasPadrao;
                                                return (
                                                    <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-4 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-[#E3000F]">Realizado Mês</td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black text-green-600 dark:text-green-500 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span>{applyCurrencyMask(weeklyMetrics.reduce((acc, w) => acc + w.receita, 0))}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {applyCurrencyMask(currentMonthMeta.receita)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.posTotal, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.posTotal}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.posPago, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.posPago}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.controle, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.controle}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.urTotal, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.urTotal}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.fibra, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.fibra}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.tv, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.tv}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black text-orange-600 dark:text-orange-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.aparelho, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.aparelho}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.acessorio, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.acessorio}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.pelicula, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.pelicula}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-blue-600 dark:text-blue-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.seguro, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.seguro}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-purple-600 dark:text-purple-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.mplay, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.mplay}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'INDICADORES' && <Indicadores salesData={salesData} usersDB={usersDB} globalMonth={globalMonth} goalsDB={goalsDB} />}

                    {metaActiveSubTab === 'DIAGNOSTICO' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                            <ClipboardList className="text-[#E3000F]" /> Diagnóstico Semanal
                                        </h2>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                            Avalie as quedas e ganhos entre as semanas e registre planos de ação para a equipe.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                        <div className="flex items-center w-full sm:w-auto gap-2 bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 shrink-0">
                                            <div className="flex items-center gap-2 px-2 text-sm font-bold text-neutral-500"><History size={16} /> Mês:</div>
                                            <input type="month" value={selectedSxsMonth} onChange={(e) => setSelectedSxsMonth(e.target.value)} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-4 py-2 rounded-lg font-bold outline-none cursor-pointer w-full" />
                                        </div>
                                        <button onClick={handleExportPPTX} className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                                            <Presentation size={16} /> Exportar PPTX
                                        </button>
                                        {canEdit && (
                                            <button onClick={handleExportDiagnosticsExcel} className="w-full sm:w-auto px-6 py-2.5 bg-[#107c41] text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                                                <FileDown size={16} /> Exportar Excel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 pb-12">
                                    {weeklyMetrics.length <= 1 ? (
                                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-neutral-500 dark:text-neutral-400 shadow-sm font-medium">
                                            Aguardando o fechamento de mais semanas neste mês para gerar os comparativos.
                                        </div>
                                    ) : (
                                        weeklyMetrics.slice(1).map((week, idx) => {
                                            const prevWeek = weeklyMetrics[idx]; // idx corresponds to the previous week
                                            const weekId = `week_${idx + 1}`;
                                            const currentDiag = diagnostics[weekId] || { causa: '', acao: '' };

                                            const drops = Object.entries(week.crescimentos || {})
                                                .filter(([, v]) => v < 0)
                                                .map(([k, v]) => ({ metric: k, value: v }));
                                            
                                            const gains = Object.entries(week.crescimentos || {})
                                                .filter(([, v]) => v > 0)
                                                .map(([k, v]) => ({ metric: k, value: v }));

                                            return (
                                                <div key={weekId} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row gap-6">
                                                    
                                                    {/* RESUMO DA SEMANA */}
                                                    <div className="w-full lg:w-1/3 space-y-5">
                                                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                                            <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider">
                                                                {prevWeek.label.split('(')[0].trim()} <span className="text-neutral-400 mx-1">vs</span> {week.label.split('(')[0].trim()}
                                                            </h3>
                                                            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                                                                {prevWeek.label.split('(')[1]?.replace(')', '')} <span className="lowercase text-neutral-400 mx-1">vs</span> {week.label.split('(')[1]?.replace(')', '')}
                                                            </p>
                                                        </div>
                                                        
                                                        <div>
                                                            <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingDown size={14} /> Pontos de Atenção (Quedas)</div>
                                                            {drops.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {drops.map(d => (
                                                                        <span key={d.metric} className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                            {d.metric}: {d.value.toFixed(1)}%
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-neutral-500 font-medium">Nenhuma queda registrada. Ótimo trabalho!</span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp size={14} /> Destaques (Ganhos)</div>
                                                            {gains.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {gains.slice(0, 5).map(g => (
                                                                        <span key={g.metric} className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                            {g.metric}: +{g.value.toFixed(1)}%
                                                                        </span>
                                                                    ))}
                                                                    {gains.length > 5 && <span className="text-[10px] text-neutral-400 mt-1 font-bold">+{gains.length - 5} outros...</span>}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-neutral-500 font-medium">Nenhum ganho expressivo na comparação.</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* FORMULÁRIO DE DIAGNÓSTICO */}
                                                    <div className="w-full lg:w-2/3 flex flex-col gap-4">
                                                        <div className="flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30 px-4 py-2 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Análise da Gestão</span>
                                                            <button onClick={() => toast('A integração com Gemini IA para gerar análises será implementada na próxima fase!', { icon: '🤖' })} className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800/30">
                                                                <Sparkles size={12} /> Sugerir com IA
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Causa Raiz (Por que caiu/subiu?)</label>
                                                                <textarea disabled={!canEdit} value={currentDiag.causa || ''} onChange={(e) => handleDiagChange(weekId, 'causa', e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[#E3000F] min-h-[120px] resize-y disabled:opacity-70 font-medium placeholder:font-normal" placeholder="Ex: Tivemos baixo fluxo na loja física no final de semana..." />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Plano de Ação / Melhorias</label>
                                                                <textarea disabled={!canEdit} value={currentDiag.acao || ''} onChange={(e) => handleDiagChange(weekId, 'acao', e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[#E3000F] min-h-[120px] resize-y disabled:opacity-70 font-medium placeholder:font-normal" placeholder="Ex: Focar em captação externa e repassar treinamento de combos na matinal..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
