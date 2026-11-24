import React, { useState, useMemo } from 'react';
import {
    CalendarDays, Lock, Printer, Sparkles, RefreshCw, CheckCircle2,
    ShieldCheck, Sun, Sunset, Clock, Users, Check, AlertCircle, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getFirstName } from '../utils/nameFormatter.js';

const DIAS_SEMANA = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const DIAS_SEMANA_CURTO = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const HORARIOS_ESCALA = [
    '09:40 - 18:00',
    '10:40 - 19:00',
    '11:40 - 20:00',
    '13:40 - 22:00',
    'FOLGA',
    'FERIADO',
    'FÉRIAS',
    'ATESTADO'
];

// Classifica o turno principal a partir do horário
const getShiftCategory = (shiftStr) => {
    const s = String(shiftStr || '').trim();
    if (s.startsWith('09:40') || s.startsWith('09:00') || s.startsWith('10:40') || s.startsWith('10:00')) return 'MANHA';
    if (s.startsWith('11:40')) return 'INTERMEDIARIO';
    if (s.startsWith('13:40') || s.startsWith('13:00') || s.startsWith('14:00')) return 'TARDE';
    return 'OUTRO';
};

// Retorna o rótulo amigável do turno
const getShiftLabel = (horario) => {
    if (horario === '09:40 - 18:00') return 'Manhã (Abertura)';
    if (horario === '10:40 - 19:00') return 'Manhã / Interm. 1';
    if (horario === '11:40 - 20:00') return 'Intermediário 2';
    if (horario === '13:40 - 22:00') return 'Tarde (Fechamento)';
    return horario;
};

// Detecta o grupo funcional do cargo para aplicar as regras de negócio da escala
const getRoleRuleGroup = (roleRaw) => {
    const r = String(roleRaw || 'VENDEDOR').trim().toUpperCase();
    if (r.includes('GERENTE') || r.includes('COORDENADOR') || r.includes('ESPECIALISTA')) return 'GERENTE';
    if (r.includes('SENIOR') || r.includes('SÊNIOR')) return 'SENIOR';
    if (r.includes('GEEK')) return 'GEEK';
    if (r.includes('ADMIN') || r === 'ADM') return 'ADM';
    if (r.includes('ASSISTENTE') || r.includes('RELA')) return 'ASSISTENTE_RELA';
    return 'VENDEDOR';
};

export const EscalaTrabalho = ({
    canEditSchedule,
    scheduleData = {},
    setScheduleData,
    monthlyOverrides = {},
    setMonthlyOverrides,
    hasAccess,
    setAuthModal,
    usersDB = {}
}) => {
    const [scheduleSubTab, setScheduleSubTab] = useState('SEMANAL');
    const [selectedScheduleMonth, setSelectedScheduleMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Estados do Gerador Inteligente de Escala (6x1 e 5x2 em Loop)
    const [escalaModel, setEscalaModel] = useState('6X1'); // '6X1' | '5X2'
    const [ideaLoopIndex, setIdeaLoopIndex] = useState(0);
    const [lastIdeaSummary, setLastIdeaSummary] = useState(null);

    // Colaboradores ativos ordenados por Hierarquia (Gestão -> Adm/Rela -> Vendedores)
    const activeEmployees = useMemo(() => {
        const rolePriority = {
            GERENTE: 1,
            SENIOR: 2,
            GEEK: 3,
            ADM: 4,
            ASSISTENTE_RELA: 5,
            VENDEDOR: 6
        };

        return Object.values(usersDB || {})
            .filter((u) => u && u.role !== 'SUSPENDER' && !u.onVacation && u.name)
            .map((u) => {
                const group = getRoleRuleGroup(u.role);
                return {
                    name: String(u.name),
                    role: String(u.role || 'VENDEDOR').toUpperCase(),
                    group,
                    priority: rolePriority[group] || 9
                };
            })
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return a.name.localeCompare(b.name);
            });
    }, [usersDB]);

    // Descobre o turno base atual de um colaborador na tabela semanal (ou define um padrão equilibrado)
    const getEmployeeBaseShift = (emp, idxInList = 0) => {
        const savedBase = scheduleData?._baseShifts?.[emp.name];
        if (savedBase && HORARIOS_ESCALA.slice(0, 4).includes(savedBase)) return savedBase;

        const empDays = scheduleData?.[emp.name] || {};
        for (const d of DIAS_SEMANA) {
            const val = empDays[d];
            if (val && val !== 'FOLGA' && val !== 'FERIADO' && val !== 'FÉRIAS' && val !== 'ATESTADO') {
                return val;
            }
        }

        // Padrão inteligente por função se ainda não preenchido
        if (emp.group === 'GERENTE' || emp.group === 'ADM' || emp.group === 'ASSISTENTE_RELA') {
            return '09:40 - 18:00';
        }
        if (emp.group === 'GEEK') {
            return '10:40 - 19:00';
        }
        if (emp.group === 'SENIOR') {
            return '13:40 - 22:00';
        }
        // Vendedores divididos entre Manhã e Tarde
        return idxInList % 2 === 0 ? '09:40 - 18:00' : '13:40 - 22:00';
    };

    // Método rápido para alterar o horário de trabalho base de um colaborador (preenche todos os dias de trabalho dele)
    const handleSetBaseShiftForEmployee = (empName, newBaseShift) => {
        if (!canEditSchedule) return;
        setScheduleData((prev) => {
            const currentEmp = prev[empName] || {};
            const updatedEmp = { ...currentEmp };
            DIAS_SEMANA.forEach((dia) => {
                const curr = updatedEmp[dia];
                if (!curr || curr !== 'FOLGA') {
                    updatedEmp[dia] = newBaseShift;
                }
            });
            return {
                ...prev,
                _baseShifts: { ...(prev._baseShifts || {}), [empName]: newBaseShift },
                [empName]: updatedEmp
            };
        });
        toast.success(`Turno base de ${getFirstName(empName)} atualizado para ${newBaseShift}!`);
    };

    const handleScheduleChange = (colaborador, dia, novoHorario) => {
        if (!canEditSchedule) return;
        setScheduleData((prev) => ({
            ...prev,
            [colaborador]: { ...(prev[colaborador] || {}), [dia]: novoHorario }
        }));
    };

    const handleMonthlyOverrideChange = (colaborador, dateKey, value) => {
        if (!canEditSchedule) return;
        setMonthlyOverrides((prev) => ({
            ...prev,
            [colaborador]: { ...(prev[colaborador] || {}), [dateKey]: value }
        }));
    };

    // =========================================================================
    // MOTOR INTELIGENTE DE SUGESTÃO DE ESCALAS (6X1 E 5X2) EM LOOP COM REGRAS:
    // 1. Vendedor da Tarde: NÃO podem folgar 2 no mesmo dia (Idem Vendedor da Manhã)
    // 2. Gestores (GEEK, GERENTE e SENIOR): NÃO podem ter folgas juntas no mesmo dia
    // 3. ADM e ASSISTENTE RELACIONAMENTO: Folga sempre DOMINGO (adaptável na 5x2 para 2º dia sem coincidirem)
    // 4. GERENTE: Folga fixa no DOMINGO (adaptável na 5x2 para 2º dia conjunto sem coincidir com GEEK e SENIOR)
    // =========================================================================
    const generateSmartScheduleSuggestion = (modeParam, customLoopStep = null) => {
        if (!canEditSchedule) {
            toast.error('Apenas a Gerência pode aplicar sugestões automáticas de escala.');
            return;
        }

        const mode = modeParam || escalaModel;
        const step = customLoopStep !== null ? customLoopStep : ideaLoopIndex;

        // Variações de ideias (Loop) para rotacionar os dias mantendo 100% das regras
        const IDEA_VARIATIONS = [
            {
                title: 'Ideia #1 — Equilíbrio Clássico & Cobertura Máxima no Fim de Semana',
                gerenteExtra5x2: 'SÁBADO',
                admExtra5x2: 'SÁBADO',
                relaExtra5x2: 'SEXTA',
                seniorDays6x1: ['SEGUNDA'],
                seniorDays5x2: ['SEGUNDA', 'TERÇA'],
                geekDays6x1: ['QUARTA'],
                geekDays5x2: ['QUARTA', 'QUINTA'],
                sellerRotationOffset: 0
            },
            {
                title: 'Ideia #2 — Foco Meio de Semana & Gestão Alternada',
                gerenteExtra5x2: 'SEGUNDA',
                admExtra5x2: 'SEXTA',
                relaExtra5x2: 'SÁBADO',
                seniorDays6x1: ['TERÇA'],
                seniorDays5x2: ['TERÇA', 'QUARTA'],
                geekDays6x1: ['QUINTA'],
                geekDays5x2: ['QUINTA', 'SEXTA'],
                sellerRotationOffset: 1
            },
            {
                title: 'Ideia #3 — Fim de Semana Blindado para Vendas',
                gerenteExtra5x2: 'QUARTA',
                admExtra5x2: 'SÁBADO',
                relaExtra5x2: 'SEGUNDA',
                seniorDays6x1: ['QUINTA'],
                seniorDays5x2: ['SEGUNDA', 'QUINTA'],
                geekDays6x1: ['TERÇA'],
                geekDays5x2: ['TERÇA', 'SEXTA'],
                sellerRotationOffset: 2
            },
            {
                title: 'Ideia #4 — Rotação Espelhada de Turnos (Manhã/Tarde)',
                gerenteExtra5x2: 'SEXTA',
                admExtra5x2: 'SEGUNDA',
                relaExtra5x2: 'SÁBADO',
                seniorDays6x1: ['QUARTA'],
                seniorDays5x2: ['Terça'.toUpperCase(), 'QUARTA'],
                geekDays6x1: ['SEGUNDA'],
                geekDays5x2: ['SEGUNDA', 'QUINTA'],
                sellerRotationOffset: 3
            },
            {
                title: 'Ideia #5 — Ciclo Dinâmico Anti-Gargalo',
                gerenteExtra5x2: 'TERÇA',
                admExtra5x2: 'SÁBADO',
                relaExtra5x2: 'QUINTA',
                seniorDays6x1: ['SEXTA'],
                seniorDays5x2: ['QUARTA', 'SEXTA'],
                geekDays6x1: ['SEGUNDA'],
                geekDays5x2: ['SEGUNDA', 'QUINTA'],
                sellerRotationOffset: 4
            }
        ];

        const variation = IDEA_VARIATIONS[step % IDEA_VARIATIONS.length];
        const nextSchedule = {
            _baseShifts: { ...(scheduleData?._baseShifts || {}) }
        };

        // Controle de dias já ocupados por Gestores (GERENTE, SENIOR, GEEK) para NUNCA folgarem juntos
        const usedManagerOffDays = new Set();

        // 1. Escalar GERENTE (Folga fixa DOMINGO; na 5x2 adiciona 2º dia conjunto)
        const gerentes = activeEmployees.filter((e) => e.group === 'GERENTE');
        gerentes.forEach((emp, idx) => {
            const baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const offDays = new Set(['DOMINGO']);
            if (mode === '5X2') {
                offDays.add(variation.gerenteExtra5x2);
            }
            offDays.forEach((d) => usedManagerOffDays.add(d));

            nextSchedule[emp.name] = {};
            DIAS_SEMANA.forEach((dia) => {
                nextSchedule[emp.name][dia] = offDays.has(dia) ? 'FOLGA' : baseShift;
            });
        });

        // 2. Escalar SENIOR (Não pode folgar junto com GERENTE nem GEEK)
        const seniors = activeEmployees.filter((e) => e.group === 'SENIOR');
        seniors.forEach((emp, idx) => {
            const baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const targetCount = mode === '5X2' ? 2 : 1;
            const preferred = mode === '5X2' ? variation.seniorDays5x2 : variation.seniorDays6x1;
            const offDays = new Set();

            preferred.forEach((d) => {
                if (offDays.size < targetCount && !usedManagerOffDays.has(d)) {
                    offDays.add(d);
                    usedManagerOffDays.add(d);
                }
            });

            // Fallback caso algum dia preferencial já esteja ocupado
            DIAS_SEMANA.forEach((d) => {
                if (offDays.size < targetCount && !usedManagerOffDays.has(d)) {
                    offDays.add(d);
                    usedManagerOffDays.add(d);
                }
            });

            nextSchedule[emp.name] = {};
            DIAS_SEMANA.forEach((dia) => {
                nextSchedule[emp.name][dia] = offDays.has(dia) ? 'FOLGA' : baseShift;
            });
        });

        // 3. Escalar GEEK (Não pode folgar junto com GERENTE nem SENIOR)
        const geeks = activeEmployees.filter((e) => e.group === 'GEEK');
        geeks.forEach((emp, idx) => {
            const baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const targetCount = mode === '5X2' ? 2 : 1;
            const preferred = mode === '5X2' ? variation.geekDays5x2 : variation.geekDays6x1;
            const offDays = new Set();

            preferred.forEach((d) => {
                if (offDays.size < targetCount && !usedManagerOffDays.has(d)) {
                    offDays.add(d);
                    usedManagerOffDays.add(d);
                }
            });

            DIAS_SEMANA.forEach((d) => {
                if (offDays.size < targetCount && !usedManagerOffDays.has(d)) {
                    offDays.add(d);
                    usedManagerOffDays.add(d);
                }
            });

            nextSchedule[emp.name] = {};
            DIAS_SEMANA.forEach((dia) => {
                nextSchedule[emp.name][dia] = offDays.has(dia) ? 'FOLGA' : baseShift;
            });
        });

        // 4. Escalar ADM e ASSISTENTE RELACIONAMENTO (Sempre DOMINGO, e na 5x2 adapta 2º dia sem deixar ambos fora no mesmo dia útil)
        const adms = activeEmployees.filter((e) => e.group === 'ADM');
        adms.forEach((emp, idx) => {
            const baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const offDays = new Set(['DOMINGO']);
            if (mode === '5X2') {
                offDays.add(variation.admExtra5x2);
            }
            nextSchedule[emp.name] = {};
            DIAS_SEMANA.forEach((dia) => {
                nextSchedule[emp.name][dia] = offDays.has(dia) ? 'FOLGA' : baseShift;
            });
        });

        const relas = activeEmployees.filter((e) => e.group === 'ASSISTENTE_RELA');
        relas.forEach((emp, idx) => {
            const baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const offDays = new Set(['DOMINGO']);
            if (mode === '5X2') {
                offDays.add(variation.relaExtra5x2);
            }
            nextSchedule[emp.name] = {};
            DIAS_SEMANA.forEach((dia) => {
                nextSchedule[emp.name][dia] = offDays.has(dia) ? 'FOLGA' : baseShift;
            });
        });

        // 5. Escalar VENDEDORES separando ESTRITAMENTE por Turno (MANHÃ vs TARDE)
        // Regra: Vendedor da Tarde NÃO pode folgar 2 no mesmo dia; Vendedor da Manhã NÃO pode folgar 2 no mesmo dia.
        const sellers = activeEmployees.filter((e) => e.group === 'VENDEDOR');

        // Garante equilíbrio de horários entre vendedores (metade Manhã, metade Tarde caso não configurado)
        const morningSellers = [];
        const afternoonSellers = [];

        sellers.forEach((emp, idx) => {
            let baseShift = getEmployeeBaseShift(emp, idx);
            nextSchedule._baseShifts[emp.name] = baseShift;
            const cat = getShiftCategory(baseShift);
            if (cat === 'TARDE') {
                afternoonSellers.push({ ...emp, baseShift });
            } else {
                morningSellers.push({ ...emp, baseShift });
            }
        });

        // Ordem de dias preferenciais de folga para distribuir vendedores sem colisão no mesmo turno
        const candidateDaysOrder = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

        const assignShiftGroupOffDays = (groupList, offsetSeed) => {
            // Rastreia quantos vendedores DESTE turno folgam em cada dia (meta: máximo 1 por dia!)
            const offCountByDay = {};
            DIAS_SEMANA.forEach((d) => {
                offCountByDay[d] = 0;
            });

            const targetOffPerSeller = mode === '5X2' ? 2 : 1;

            groupList.forEach((emp, sIdx) => {
                const empOffDays = new Set();

                // Passada 1: Escolhe dias com 0 folgas neste turno (regra estrita: nunca 2 do mesmo turno folgando juntos)
                for (let k = 0; k < candidateDaysOrder.length && empOffDays.size < targetOffPerSeller; k++) {
                    const dayIndex = (sIdx * 2 + k + offsetSeed) % candidateDaysOrder.length;
                    const candidateDay = candidateDaysOrder[dayIndex];
                    if (offCountByDay[candidateDay] === 0 && !empOffDays.has(candidateDay)) {
                        empOffDays.add(candidateDay);
                        offCountByDay[candidateDay] += 1;
                    }
                }

                // Passada 2: Se a loja tiver mais de 4 vendedores no mesmo turno na 5x2 (ex: 5 vendedores x 2 folgas = 10 folgas em 7 dias),
                // escolhe o dia com menor número de folgas para minimizar qualquer impacto
                while (empOffDays.size < targetOffPerSeller) {
                    const availableDays = candidateDaysOrder
                        .filter((d) => !empOffDays.has(d))
                        .sort((a, b) => offCountByDay[a] - offCountByDay[b]);
                    if (availableDays.length === 0) break;
                    const chosen = availableDays[0];
                    empOffDays.add(chosen);
                    offCountByDay[chosen] += 1;
                }

                nextSchedule[emp.name] = {};
                DIAS_SEMANA.forEach((dia) => {
                    nextSchedule[emp.name][dia] = empOffDays.has(dia) ? 'FOLGA' : emp.baseShift;
                });
            });
        };

        assignShiftGroupOffDays(morningSellers, variation.sellerRotationOffset);
        assignShiftGroupOffDays(afternoonSellers, variation.sellerRotationOffset + 2);

        setScheduleData(nextSchedule);
        // Limpa overrides manuais conflitantes se estiver na aba mensal e desejar sincronizar
        setIdeaLoopIndex((prev) => prev + 1);
        setLastIdeaSummary({
            mode,
            ideaNumber: (step % IDEA_VARIATIONS.length) + 1,
            totalIdeas: IDEA_VARIATIONS.length,
            title: variation.title
        });

        toast.success(
            `Escala ${mode} gerada (${variation.title.split('—')[0].trim()})! Clique novamente para testar outra ideia do loop.`,
            { icon: '✨', duration: 4000 }
        );
    };

    // Verifica em tempo real o status de conformidade das regras na escala atual
    const ruleDiagnostics = useMemo(() => {
        const managerAlerts = [];
        const morningAlerts = [];
        const afternoonAlerts = [];

        DIAS_SEMANA.forEach((dia) => {
            const managersOff = [];
            const morningSellersOff = [];
            const afternoonSellersOff = [];

            activeEmployees.forEach((emp, idx) => {
                const shift = scheduleData?.[emp.name]?.[dia] || '09:40 - 18:00';
                if (shift !== 'FOLGA') return;

                if (['GERENTE', 'SENIOR', 'GEEK'].includes(emp.group)) {
                    managersOff.push(`${getFirstName(emp.name)} (${emp.group})`);
                } else if (emp.group === 'VENDEDOR') {
                    const base = getEmployeeBaseShift(emp, idx);
                    const cat = getShiftCategory(base);
                    if (cat === 'TARDE') afternoonSellersOff.push(getFirstName(emp.name));
                    else morningSellersOff.push(getFirstName(emp.name));
                }
            });

            if (managersOff.length > 1) {
                managerAlerts.push(`${dia}: ${managersOff.join(' + ')}`);
            }
            if (morningSellersOff.length > 1) {
                morningAlerts.push(`${dia}: ${morningSellersOff.join(' + ')}`);
            }
            if (afternoonSellersOff.length > 1) {
                afternoonAlerts.push(`${dia}: ${afternoonSellersOff.join(' + ')}`);
            }
        });

        return {
            managerAlerts,
            morningAlerts,
            afternoonAlerts,
            allValid: managerAlerts.length === 0 && morningAlerts.length === 0 && afternoonAlerts.length === 0
        };
    }, [scheduleData, activeEmployees]);

    // Contagem diária de quantos colaboradores estão trabalhando por turno em cada dia da semana
    const dailyCoverage = useMemo(() => {
        const map = {};
        DIAS_SEMANA.forEach((dia) => {
            let manha = 0;
            let tarde = 0;
            let folga = 0;
            activeEmployees.forEach((emp) => {
                const val = scheduleData?.[emp.name]?.[dia] || '09:40 - 18:00';
                if (val === 'FOLGA' || val === 'FERIADO' || val === 'FÉRIAS' || val === 'ATESTADO') {
                    folga++;
                } else if (getShiftCategory(val) === 'TARDE') {
                    tarde++;
                } else {
                    manha++;
                }
            });
            map[dia] = { manha, tarde, folga, totalAtivos: manha + tarde };
        });
        return map;
    }, [scheduleData, activeEmployees]);

    const getDaysInMonth = (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const days = [];
        const weekMap = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
        const shortWeekMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        while (date.getMonth() === month - 1) {
            days.push({
                dateStr: `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                dayNumber: String(date.getDate()).padStart(2, '0'),
                dayNameFull: weekMap[date.getDay()],
                dayNameShort: shortWeekMap[date.getDay()],
                isWeekend: date.getDay() === 0 || date.getDay() === 6
            });
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const monthDaysList = getDaysInMonth(selectedScheduleMonth);

    // Cores confortáveis e legíveis para os badges de horário e cargo
    const getRoleBadgeStyle = (group) => {
        switch (group) {
            case 'GERENTE':
                return 'bg-red-100 text-[#E3000F] border-red-200 dark:bg-[#E3000F]/20 dark:text-red-300 dark:border-red-800/50';
            case 'SENIOR':
                return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50';
            case 'GEEK':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50';
            case 'ADM':
            case 'ASSISTENTE_RELA':
                return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800/50';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
        }
    };

    const getShiftCellStyle = (currentShift) => {
        if (currentShift === 'FOLGA') {
            return 'bg-emerald-100/90 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold';
        }
        if (currentShift === 'FÉRIAS' || currentShift === 'FERIADO') {
            return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-bold';
        }
        if (currentShift === 'ATESTADO') {
            return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-bold';
        }
        if (currentShift.startsWith('13:40')) {
            return 'bg-indigo-50/80 text-indigo-900 border-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-800/60 font-semibold';
        }
        if (currentShift.startsWith('10:40') || currentShift.startsWith('11:40')) {
            return 'bg-amber-50/70 text-amber-900 border-amber-200/80 dark:bg-amber-950/25 dark:text-amber-200 dark:border-amber-800/50 font-semibold';
        }
        return 'bg-sky-50/70 text-sky-900 border-sky-200/80 dark:bg-sky-950/25 dark:text-sky-200 dark:border-sky-800/50 font-semibold';
    };

    return (
        <div
            className="h-full flex flex-col animate-fade-in print:block print:h-auto print:bg-white antialiased"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
            <style>{`
                @media print {
                    @page { size: landscape; margin: 4mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; }
                }
            `}</style>

            {!hasAccess ? (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl no-print">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                        <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                            Apenas a Gerência tem autorização para visualizar e editar a escala de horários.
                        </p>
                        <button
                            onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'GERENTE' })}
                            className="px-6 py-2.5 bg-[#E3000F] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
                        >
                            Autenticar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden print-container transition-colors">
                    {/* BARRA DE NAVEGAÇÃO SUPERIOR */}
                    <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 no-print px-2 sm:px-4">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            <button
                                type="button"
                                onClick={() => setScheduleSubTab('SEMANAL')}
                                className={`px-5 sm:px-7 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                                    scheduleSubTab === 'SEMANAL'
                                        ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900'
                                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                <CalendarDays size={16} />
                                <span>Escala Semanal & Gerador</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScheduleSubTab('MENSAL')}
                                className={`px-5 sm:px-7 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                                    scheduleSubTab === 'MENSAL'
                                        ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900'
                                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                <Layers size={16} />
                                <span>Escala Completa do Mês</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-800 text-white font-semibold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-sm flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                            >
                                <Printer size={15} />
                                <span>Imprimir Escala</span>
                            </button>
                        </div>
                    </div>

                    {/* CONTEÚDO PRINCIPAL */}
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-5 print-container">
                        {/* PAINEL INTELIGENTE DE SUGESTÃO DE ESCALA (6X1 E 5X2 EM LOOP COM REGRAS) */}
                        <div className="no-print bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-[#E3000F]/10 text-[#E3000F] flex items-center justify-center shrink-0 mt-0.5">
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">
                                                Sugestor Inteligente de Escala (6x1 e 5x2 em Loop)
                                            </h2>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#E3000F] dark:bg-[#E3000F]/15">
                                                Regras Automáticas Ativas
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            Escolha o modelo <strong>6x1</strong> ou <strong>5x2</strong> e clique em <strong>Sugerir / Próxima Ideia</strong> para girar novas combinações respeitando turnos e cargos.
                                        </p>
                                    </div>
                                </div>

                                {/* CONTROLES DO GERADOR: SELETOR 6X1 | 5X2 + BOTÃO LOOP */}
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        {['6X1', '5X2'].map((mod) => (
                                            <button
                                                key={mod}
                                                type="button"
                                                onClick={() => {
                                                    setEscalaModel(mod);
                                                    generateSmartScheduleSuggestion(mod, 0);
                                                }}
                                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    escalaModel === mod
                                                        ? 'bg-[#E3000F] text-white shadow-sm'
                                                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <span>Escala {mod}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => generateSmartScheduleSuggestion(escalaModel)}
                                        className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                                        title="Clique repetidamente para testar novas ideias de escala em loop"
                                    >
                                        <RefreshCw size={15} />
                                        <span>Sugerir Próxima Ideia ({escalaModel})</span>
                                    </button>
                                </div>
                            </div>

                            {/* CARDS DE REGRAS ATIVAS E DIAGNÓSTICO EM TEMPO REAL */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-2.5">
                                    <Sunset size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
                                            Vendedores (Manhã e Tarde)
                                        </span>
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                            Nunca folgam 2 do mesmo turno no mesmo dia.
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-2.5">
                                    <ShieldCheck size={16} className="text-[#E3000F] shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
                                            Gestores (Gerente, Senior e Geek)
                                        </span>
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                            Folgas escalonadas: nunca folgam juntos no mesmo dia.
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-2.5">
                                    <Users size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
                                            ADM & Assistente Relacionamento
                                        </span>
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                            Sempre Domingo (na 5x2 adiciona 2º dia alternado).
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-2.5">
                                    <Clock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
                                            Gerente (Folga Fixa)
                                        </span>
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                            Domingo fixo e adaptável a folga conjunta na 5x2.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* BARRA DE STATUS DA IDEIA ATUAL E VALIDAÇÃO DE CONFLITOS */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                {lastIdeaSummary ? (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-red-50/70 dark:bg-[#E3000F]/10 border border-red-200/80 dark:border-red-900/40 px-3 py-1.5 rounded-xl">
                                        <Sparkles size={14} className="text-[#E3000F] shrink-0" />
                                        <span>
                                            Aplicada ({lastIdeaSummary.mode} • {lastIdeaSummary.ideaNumber}/{lastIdeaSummary.totalIdeas}): <strong>{lastIdeaSummary.title}</strong>
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Dica: Você também pode definir o <strong>Turno Base</strong> de cada colaborador na coluna ao lado do nome para preencher toda a semana rapidamente.
                                    </div>
                                )}

                                {ruleDiagnostics.allValid ? (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl shrink-0">
                                        <CheckCircle2 size={14} />
                                        <span>Todas as regras de turnos e gestores 100% respeitadas</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-xl">
                                        <AlertCircle size={14} className="shrink-0 text-amber-600" />
                                        <span>
                                            Atenção na edição manual:{' '}
                                            {[
                                                ruleDiagnostics.managerAlerts.length > 0 && `Gestores juntos (${ruleDiagnostics.managerAlerts.join('; ')})`,
                                                ruleDiagnostics.morningAlerts.length > 0 && `2+ Manhã (${ruleDiagnostics.morningAlerts.join('; ')})`,
                                                ruleDiagnostics.afternoonAlerts.length > 0 && `2+ Tarde (${ruleDiagnostics.afternoonAlerts.join('; ')})`
                                            ]
                                                .filter(Boolean)
                                                .join(' | ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ABA 1: ESCALA SEMANAL PADRÃO */}
                        {scheduleSubTab === 'SEMANAL' && (
                            <div className="space-y-4">
                                {/* RESUMO DE COBERTURA POR DIA DA SEMANA */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 no-print">
                                    {DIAS_SEMANA.map((dia, idx) => {
                                        const cov = dailyCoverage[dia] || { manha: 0, tarde: 0, folga: 0, totalAtivos: 0 };
                                        return (
                                            <div
                                                key={dia}
                                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm flex flex-col justify-between gap-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                                                        {DIAS_SEMANA_CURTO[idx]}
                                                    </span>
                                                    <span className="text-xs font-bold text-[#E3000F] bg-red-50 dark:bg-[#E3000F]/15 px-2 py-0.5 rounded-md">
                                                        {cov.totalAtivos} na loja
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                                    <span title="Colaboradores no turno da Manhã/Intermediário">☀️ M: <strong>{cov.manha}</strong></span>
                                                    <span title="Colaboradores no turno da Tarde/Fechamento">🌙 T: <strong>{cov.tarde}</strong></span>
                                                    <span className="text-emerald-600 dark:text-emerald-400" title="Colaboradores de Folga">🏖️ F: <strong>{cov.folga}</strong></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* TABELA SEMANAL COM FONTES LIMPAS E SELETOR DE TURNO BASE */}
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-neutral-900 dark:bg-neutral-950 text-white text-xs uppercase tracking-wider">
                                                    <th className="py-3.5 px-4 font-bold sticky left-0 bg-neutral-900 dark:bg-neutral-950 z-10 border-r border-neutral-800">
                                                        Colaborador / Função
                                                    </th>
                                                    <th className="py-3.5 px-3 font-bold border-r border-neutral-800 no-print text-center">
                                                        Turno Base (Preencher)
                                                    </th>
                                                    {DIAS_SEMANA.map((dia) => (
                                                        <th key={dia} className="py-3.5 px-3 font-bold text-center border-r border-neutral-800 last:border-r-0">
                                                            {dia}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs sm:text-sm">
                                                {activeEmployees.map((emp, empIdx) => {
                                                    const baseShift = getEmployeeBaseShift(emp, empIdx);
                                                    const folgasCount = DIAS_SEMANA.filter(
                                                        (d) => (scheduleData?.[emp.name]?.[d] || baseShift) === 'FOLGA'
                                                    ).length;

                                                    return (
                                                        <tr
                                                            key={emp.name}
                                                            className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                                                        >
                                                            {/* COLABORADOR + CARGO */}
                                                            <td className="py-3 px-4 sticky left-0 bg-white dark:bg-neutral-900 z-10 border-r border-neutral-200 dark:border-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div>
                                                                        <div className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                                                            {getFirstName(emp.name)}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadgeStyle(emp.group)}`}>
                                                                                {emp.role}
                                                                            </span>
                                                                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                                                • {folgasCount} {folgasCount === 1 ? 'folga' : 'folgas'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* SELETOR RÁPIDO DE TURNO BASE */}
                                                            <td className="py-2.5 px-3 border-r border-neutral-100 dark:border-neutral-800 no-print text-center bg-neutral-50/50 dark:bg-neutral-900/50">
                                                                <select
                                                                    value={baseShift}
                                                                    disabled={!canEditSchedule}
                                                                    onChange={(e) => handleSetBaseShiftForEmployee(emp.name, e.target.value)}
                                                                    className="w-full min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 outline-none focus:border-[#E3000F] cursor-pointer"
                                                                    title="Altera o horário padrão de todos os dias de trabalho deste colaborador"
                                                                >
                                                                    {HORARIOS_ESCALA.slice(0, 4).map((h) => (
                                                                        <option key={h} value={h}>
                                                                            {getShiftLabel(h)} ({h.split(' - ')[0]})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            {/* DIAS DA SEMANA */}
                                                            {DIAS_SEMANA.map((dia) => {
                                                                const currentShift = scheduleData?.[emp.name]?.[dia] || baseShift;
                                                                return (
                                                                    <td
                                                                        key={dia}
                                                                        className="p-2 border-r border-neutral-100 dark:border-neutral-800 last:border-r-0 text-center"
                                                                    >
                                                                        {canEditSchedule ? (
                                                                            <select
                                                                                value={currentShift}
                                                                                onChange={(e) => handleScheduleChange(emp.name, dia, e.target.value)}
                                                                                className={`w-full min-w-[128px] px-2.5 py-2 rounded-xl text-xs border outline-none cursor-pointer transition-all text-center ${getShiftCellStyle(currentShift)}`}
                                                                            >
                                                                                {HORARIOS_ESCALA.map((h) => (
                                                                                    <option
                                                                                        key={h}
                                                                                        value={h}
                                                                                        className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 font-semibold"
                                                                                    >
                                                                                        {h}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <span className={`inline-block w-full px-2.5 py-2 rounded-xl text-xs border ${getShiftCellStyle(currentShift)}`}>
                                                                                {currentShift}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA 2: ESCALA COMPLETA DO MÊS */}
                        {scheduleSubTab === 'MENSAL' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm no-print">
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                            <CalendarDays size={18} className="text-[#E3000F]" />
                                            Espelho Mensal Consolidado ({selectedScheduleMonth.split('-').reverse().join('/')})
                                        </h3>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            O calendário do mês herda automaticamente a sugestão da Escala Semanal ({escalaModel}), permitindo ajustes pontuais por dia.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="month"
                                            value={selectedScheduleMonth}
                                            onChange={(e) => setSelectedScheduleMonth(e.target.value)}
                                            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold outline-none cursor-pointer"
                                        />
                                        {canEditSchedule && Object.keys(monthlyOverrides || {}).length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMonthlyOverrides({});
                                                    toast.success('Ajustes manuais do mês limpos! Sincronizado com a Escala Semanal.');
                                                }}
                                                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                Sincronizar com Semanal
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-neutral-900 dark:bg-neutral-950 text-white text-xs uppercase">
                                                    <th className="py-3 px-4 font-bold sticky left-0 bg-neutral-900 dark:bg-neutral-950 z-20 border-r border-neutral-800">
                                                        Colaborador
                                                    </th>
                                                    {monthDaysList.map((d) => (
                                                        <th
                                                            key={d.dateStr}
                                                            className={`py-2.5 px-2 text-center border-r border-neutral-800 min-w-[68px] ${
                                                                d.isWeekend ? 'bg-[#E3000F] text-white' : ''
                                                            }`}
                                                        >
                                                            <div className="text-[10px] font-medium opacity-85">{d.dayNameShort}</div>
                                                            <div className="text-xs font-bold">{d.dayNumber}</div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                                                {activeEmployees.map((emp, empIdx) => {
                                                    const baseShift = getEmployeeBaseShift(emp, empIdx);
                                                    return (
                                                        <tr key={emp.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                                            <td className="py-2.5 px-4 font-bold text-neutral-900 dark:text-neutral-100 sticky left-0 bg-white dark:bg-neutral-900 z-10 border-r border-neutral-200 dark:border-neutral-800">
                                                                <div>{getFirstName(emp.name)}</div>
                                                                <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                                                                    {emp.role}
                                                                </div>
                                                            </td>
                                                            {monthDaysList.map((d) => {
                                                                const baseWeeklyShift = scheduleData?.[emp.name]?.[d.dayNameFull] || baseShift;
                                                                const overrideShift = monthlyOverrides?.[emp.name]?.[d.dateStr];
                                                                const finalShift = overrideShift || baseWeeklyShift;
                                                                const isFolga = finalShift === 'FOLGA';
                                                                const isFeriado = finalShift === 'FERIADO' || finalShift === 'FÉRIAS';
                                                                const isAtestado = finalShift === 'ATESTADO';

                                                                let cellClass = 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-semibold';
                                                                if (isFolga) cellClass = 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold';
                                                                else if (isFeriado) cellClass = 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold';
                                                                else if (isAtestado) cellClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold';
                                                                else if (d.isWeekend) cellClass = 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 font-semibold';

                                                                return (
                                                                    <td key={d.dateStr} className={`p-1 border-r border-neutral-200 dark:border-neutral-800 text-center ${cellClass}`}>
                                                                        {canEditSchedule ? (
                                                                            <select
                                                                                value={finalShift}
                                                                                onChange={(e) => handleMonthlyOverrideChange(emp.name, d.dateStr, e.target.value)}
                                                                                className="w-full bg-transparent text-center text-[11px] outline-none cursor-pointer appearance-none py-1.5 px-1 font-inherit"
                                                                                title={`${emp.name} — Dia ${d.dayNumber} (${d.dayNameFull}): ${finalShift}`}
                                                                            >
                                                                                {HORARIOS_ESCALA.map((h) => (
                                                                                    <option
                                                                                        key={h}
                                                                                        value={h}
                                                                                        className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                                                                    >
                                                                                        {h.includes(' - ') ? h.replace(' - ', ' às ') : h}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <div className="py-1.5 px-1 text-[11px]">
                                                                                {finalShift.includes(' - ') ? finalShift.split(' - ')[0] : finalShift}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
