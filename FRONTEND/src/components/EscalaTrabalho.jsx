import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    CalendarDays, Lock, Printer, Sparkles, RefreshCw, FileSpreadsheet,
    Sun, Sunset, Moon, ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { getFirstName } from '../utils/nameFormatter.js';
import { getCurrentStoreName } from '../utils/stores.js';

const DIAS_SEMANA_FULL = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const DIAS_SEMANA_LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES_NOMES = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

// Tabela de Horários e Carga Horária Semanal por Modelo de Escala (6X1 vs 5X2 — 42h semanais divididas em 5 dias)
export const SHIFT_SCHEDULES_BY_MODEL = {
    '6X1': {
        weeklyTotal: '44h Semanais • 7h20/dia (6 dias)',
        MANHA: {
            range: '09:40 às 18:00',
            carga: '7h20/dia + 1h Int. • 44h Sem.',
            fullLabel: '09:40 às 18:00 (7h20/dia • 44h/sem)'
        },
        INTERMEDIARIO: {
            range: '11:40 às 20:00',
            carga: '7h20/dia + 1h Int. • 44h Sem.',
            fullLabel: '11:40 às 20:00 (7h20/dia • 44h/sem)'
        },
        TARDE: {
            range: '13:40 às 22:00',
            carga: '7h20/dia + 1h Int. • 44h Sem.',
            fullLabel: '13:40 às 22:00 (7h20/dia • 44h/sem)'
        }
    },
    '5X2': {
        weeklyTotal: '42h Semanais • 8h24/dia (5 dias)',
        MANHA: {
            range: '09:36 às 19:00',
            carga: '8h24/dia + 1h Int. • 42h Sem.',
            fullLabel: '09:36 às 19:00 (8h24/dia • 42h/sem)'
        },
        INTERMEDIARIO: {
            range: '11:00 às 20:24',
            carga: '8h24/dia + 1h Int. • 42h Sem.',
            fullLabel: '11:00 às 20:24 (8h24/dia • 42h/sem)'
        },
        TARDE: {
            range: '12:36 às 22:00',
            carga: '8h24/dia + 1h Int. • 42h Sem.',
            fullLabel: '12:36 às 22:00 (8h24/dia • 42h/sem)'
        }
    }
};

// Siglas oficiais da Escala (Idênticas e expandidas a partir da planilha padrão da loja)
export const SIGLAS_ESCALA = [
    { code: 'T', label: 'TRABALHA', horario: 'Turno Padrão' },
    { code: 'M', label: 'MANHÃ', horario: '09:40 às 18:00 (6x1) / 09:36 às 19:00 (5x2 - 42h)' },
    { code: 'I', label: 'INTERMEDIÁRIO', horario: '11:40 às 20:00 (6x1) / 11:00 às 20:24 (5x2 - 42h)' },
    { code: 'N', label: 'NOITE / TARDE', horario: '13:40 às 22:00 (6x1) / 12:36 às 22:00 (5x2 - 42h)' },
    { code: 'F', label: 'FOLGA', horario: 'FOLGA' },
    { code: 'FB', label: 'FOLGA BANCO', horario: 'FOLGA BANCO' },
    { code: 'FP', label: 'FOLGA PRÊMIO', horario: 'FOLGA PRÊMIO' },
    { code: 'AT', label: 'ATESTADO', horario: 'ATESTADO' },
    { code: 'TR', label: 'TREINAMENTO', horario: 'TREINAMENTO' },
    { code: 'FE', label: 'FÉRIAS', horario: 'FÉRIAS' },
    { code: 'AF', label: 'AFASTADA(O)', horario: 'AFASTADA' }
];

// Converte qualquer valor antigo para a Sigla Oficial limpa
const normalizeToSigla = (val, sectionShift = 'MANHA') => {
    const raw = String(val || '').trim().toUpperCase();
    const v = raw.includes('—')
        ? raw.split('—')[0].trim()
        : raw.includes('-') && !raw.includes(':')
            ? raw.split('-')[0].trim()
            : raw;

    if (!v) {
        if (sectionShift === 'MANHA') return 'M';
        if (sectionShift === 'INTERMEDIARIO') return 'I';
        if (sectionShift === 'TARDE') return 'N';
        return 'T';
    }
    if (SIGLAS_ESCALA.some((s) => s.code === v)) return v;
    if (v === 'FOLGA') return 'F';
    if (v === 'ATESTADO') return 'AT';
    if (v === 'FÉRIAS' || v === 'FERIAS') return 'FE';
    if (v === 'FERIADO') return 'F';
    if (v.startsWith('09:') || v.startsWith('10:00')) return 'M';
    if (v.startsWith('10:40') || v.startsWith('11:')) return 'I';
    if (v.startsWith('13:') || v.startsWith('14:')) return 'N';
    return 'T';
};

// Feriados nacionais fixos (MM-DD) para pré-destacar automaticamente
const FERIADOS_FIXOS_MM_DD = new Set([
    '01-01',
    '04-21',
    '05-01',
    '09-07',
    '10-12',
    '11-02',
    '11-15',
    '11-20',
    '12-25'
]);

const getRoleRuleGroup = (roleRaw) => {
    const r = String(roleRaw || 'VENDEDOR').trim().toUpperCase();
    if (r.includes('GERENTE') || r.includes('COORDENADOR') || r.includes('ESPECIALISTA')) return 'GERENTE';
    if (r.includes('SENIOR') || r.includes('SÊNIOR')) return 'SENIOR';
    if (r.includes('GEEK') || r.includes('TECNOL')) return 'GEEK';
    if (r.includes('ADMIN') || r === 'ADM') return 'ADM';
    if (r.includes('ASSISTENTE') || r.includes('RELA')) return 'ASSISTENTE_RELA';
    return 'VENDEDOR';
};

const formatFriendlyRole = (roleRaw) => {
    const r = String(roleRaw || 'VENDEDOR').trim().toUpperCase();
    if (r.includes('GERENTE')) return 'Gerente Loja';
    if (r.includes('SENIOR') || r.includes('SÊNIOR')) return 'Vendedor(a) Sênior';
    if (r.includes('GEEK')) return 'Assistente Tecnológico';
    if (r.includes('ADMIN') || r === 'ADM') return 'Assistente Adm';
    if (r.includes('ASSISTENTE') || r.includes('RELA')) return 'Assis. Relacionamento';
    if (r.includes('APRENDIZ')) return 'Jovem Aprendiz';
    return 'Vendedor(a) Loja';
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
    const [selectedScheduleMonth, setSelectedScheduleMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [escalaModel, setEscalaModel] = useState(() => {
        return scheduleData?._escalaModel === '5X2' ? '5X2' : '6X1';
    });
    const [ideaLoopIndex, setIdeaLoopIndex] = useState(0);

    const storeDisplayName = useMemo(() => {
        const raw = String(getCurrentStoreName() || 'LOJA RAPOSO').trim().toUpperCase();
        return raw.startsWith('LP ') ? raw.replace(/^LP\s+/, 'LOJA ') : raw;
    }, []);

    const currentMonthLabel = useMemo(() => {
        const parts = (selectedScheduleMonth || '').split('-');
        const mIdx = parseInt(parts[1], 10) - 1;
        return MESES_NOMES[mIdx] || 'MÊS';
    }, [selectedScheduleMonth]);

    const currentYearLabel = useMemo(() => {
        return (selectedScheduleMonth || '').split('-')[0] || '2026';
    }, [selectedScheduleMonth]);

    const activeEmployees = useMemo(() => {
        const rolePriority = {
            GERENTE: 1,
            SENIOR: 2,
            ADM: 3,
            ASSISTENTE_RELA: 4,
            GEEK: 5,
            VENDEDOR: 6
        };

        return Object.values(usersDB || {})
            .filter((u) => u && u.role !== 'SUSPENDER' && !u.onVacation && u.name)
            .map((u) => {
                const group = getRoleRuleGroup(u.role);
                return {
                    name: String(u.name),
                    role: String(u.role || 'VENDEDOR').toUpperCase(),
                    friendlyRole: formatFriendlyRole(u.role),
                    group,
                    priority: rolePriority[group] || 9
                };
            })
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return a.name.localeCompare(b.name);
            });
    }, [usersDB]);

    const getEmployeeSection = (emp, idxInAll = 0) => {
        const savedSec = scheduleData?._sections?.[emp.name];
        if (savedSec && ['MANHA', 'INTERMEDIARIO', 'TARDE'].includes(savedSec)) {
            return savedSec;
        }

        const savedBase = String(scheduleData?._baseShifts?.[emp.name] || '');
        if (savedBase.startsWith('13:') || savedBase.startsWith('14:')) return 'TARDE';
        if (savedBase.startsWith('10:40') || savedBase.startsWith('11:')) return 'INTERMEDIARIO';
        if (savedBase.startsWith('09:')) return 'MANHA';

        if (emp.group === 'GERENTE' || emp.group === 'ADM' || emp.group === 'ASSISTENTE_RELA') return 'MANHA';
        if (emp.group === 'GEEK') return 'INTERMEDIARIO';
        if (emp.group === 'SENIOR') {
            return idxInAll % 2 === 0 ? 'MANHA' : 'TARDE';
        }
        const mod = idxInAll % 5;
        if (mod === 0 || mod === 1) return 'MANHA';
        if (mod === 2) return 'INTERMEDIARIO';
        return 'TARDE';
    };

    const handleChangeEmployeeSection = (empName, newSection) => {
        if (!canEditSchedule) return;
        const defaultSigla = newSection === 'MANHA' ? 'M' : newSection === 'INTERMEDIARIO' ? 'I' : 'N';

        setScheduleData((prev) => {
            const currentDays = prev?.[empName] || {};
            const nextDays = {};
            DIAS_SEMANA_FULL.forEach((d) => {
                const oldSigla = normalizeToSigla(currentDays[d], newSection);
                nextDays[d] = oldSigla === 'F' ? 'F' : defaultSigla;
            });
            return {
                ...prev,
                _sections: { ...(prev?._sections || {}), [empName]: newSection },
                [empName]: nextDays
            };
        });
    };

    const monthDaysList = useMemo(() => {
        const [year, month] = selectedScheduleMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const days = [];
        const customHolidays = monthlyOverrides?._holidays || {};

        while (date.getMonth() === month - 1) {
            const dNum = date.getDate();
            const mmdd = `${String(month).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
            const dateStr = `${year}-${mmdd}`;
            const dow = date.getDay();
            const isWeekend = dow === 0 || dow === 6;
            const isAutoHoliday = FERIADOS_FIXOS_MM_DD.has(mmdd);
            const isHoliday = customHolidays[dateStr] !== undefined ? Boolean(customHolidays[dateStr]) : isAutoHoliday;

            days.push({
                dateStr,
                dayNumber: dNum,
                dow,
                dayLetter: DIAS_SEMANA_LETRA[dow],
                dayNameFull: DIAS_SEMANA_FULL[dow],
                isWeekend,
                isHoliday
            });
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [selectedScheduleMonth, monthlyOverrides]);

    const handleToggleHolidayColumn = (dayObj) => {
        if (!canEditSchedule) return;
        setMonthlyOverrides((prev) => {
            const currentHols = prev?._holidays || {};
            const nextVal = !dayObj.isHoliday;
            return {
                ...prev,
                _holidays: {
                    ...currentHols,
                    [dayObj.dateStr]: nextVal
                }
            };
        });
        toast.success(
            dayObj.isHoliday
                ? `Dia ${dayObj.dayNumber} removido como feriado.`
                : `Dia ${dayObj.dayNumber} marcado como Feriado!`
        );
    };

    const getCellSigla = (emp, dayObj, section) => {
        const override = monthlyOverrides?.[emp.name]?.[dayObj.dateStr];
        if (override !== undefined && override !== '') {
            return normalizeToSigla(override, section);
        }
        const weeklyVal = scheduleData?.[emp.name]?.[dayObj.dayNameFull];
        if (weeklyVal !== undefined && weeklyVal !== '') {
            return normalizeToSigla(weeklyVal, section);
        }
        if (dayObj.dow === 0 && ['GERENTE', 'ADM', 'ASSISTENTE_RELA'].includes(emp.group)) {
            return 'F';
        }
        if (dayObj.isHoliday || dayObj.dow === 0) return 'T';
        if (section === 'MANHA') return 'M';
        if (section === 'INTERMEDIARIO') return 'I';
        return 'N';
    };

    const handleCellSiglaChange = (empName, dateStr, newSigla) => {
        if (!canEditSchedule) return;
        setMonthlyOverrides((prev) => ({
            ...prev,
            [empName]: {
                ...(prev?.[empName] || {}),
                [dateStr]: newSigla
            }
        }));
    };

    // Gerador de Sugestão Automática (6x1 e 5x2) em Loop de Ideias
    const handleGenerateSuggestionLoop = (targetMode = null) => {
        if (!canEditSchedule) return;
        const mode = targetMode || escalaModel;
        const step = targetMode && targetMode !== escalaModel ? 0 : ideaLoopIndex;

        const VARIATIONS = [
            {
                gerenteExtra5x2: 6,
                admExtra5x2: 6,
                relaExtra5x2: 5,
                seniorOff6x1: [1],
                seniorOff5x2: [1, 2],
                geekOff6x1: [3],
                geekOff5x2: [3, 4],
                sellerOffset: 0
            },
            {
                gerenteExtra5x2: 1,
                admExtra5x2: 5,
                relaExtra5x2: 6,
                seniorOff6x1: [2],
                seniorOff5x2: [2, 3],
                geekOff6x1: [4],
                geekOff5x2: [4, 5],
                sellerOffset: 1
            },
            {
                gerenteExtra5x2: 3,
                admExtra5x2: 6,
                relaExtra5x2: 1,
                seniorOff6x1: [4],
                seniorOff5x2: [1, 4],
                geekOff6x1: [2],
                geekOff5x2: [2, 5],
                sellerOffset: 2
            },
            {
                gerenteExtra5x2: 5,
                admExtra5x2: 1,
                relaExtra5x2: 6,
                seniorOff6x1: [3],
                seniorOff5x2: [2, 3],
                geekOff6x1: [1],
                geekOff5x2: [1, 4],
                sellerOffset: 3
            },
            {
                gerenteExtra5x2: 2,
                admExtra5x2: 6,
                relaExtra5x2: 4,
                seniorOff6x1: [5],
                seniorOff5x2: [3, 5],
                geekOff6x1: [1],
                geekOff5x2: [1, 4],
                sellerOffset: 4
            }
        ];

        const v = VARIATIONS[step % VARIATIONS.length];
        const nextSections = { ...(scheduleData?._sections || {}) };
        const nextSchedule = { _sections: nextSections, _escalaModel: mode };
        const nextMonthlyForMonth = { ...(monthlyOverrides || {}) };

        activeEmployees.forEach((emp, idx) => {
            nextSections[emp.name] = getEmployeeSection(emp, idx);
        });

        const workSiglaForSection = (sec, dow, isHol) => {
            if (isHol || dow === 0) return 'T';
            if (sec === 'MANHA') return 'M';
            if (sec === 'INTERMEDIARIO') return 'I';
            return 'N';
        };

        const weeklyOffDaysMap = {};
        const usedManagerOffDows = new Set();

        // GERENTE: Domingo fixo + conjunta na 5x2
        activeEmployees
            .filter((e) => e.group === 'GERENTE')
            .forEach((emp) => {
                const offs = new Set([0]);
                if (mode === '5X2') offs.add(v.gerenteExtra5x2);
                offs.forEach((d) => usedManagerOffDows.add(d));
                weeklyOffDaysMap[emp.name] = offs;
            });

        // SENIOR: Nunca folga junto com GERENTE nem GEEK
        activeEmployees
            .filter((e) => e.group === 'SENIOR')
            .forEach((emp, sIdx) => {
                const targetCount = mode === '5X2' ? 2 : 1;
                const pref = mode === '5X2' ? v.seniorOff5x2 : v.seniorOff6x1;
                const offs = new Set();
                pref.forEach((d) => {
                    const candidate = (d + sIdx) % 7;
                    if (offs.size < targetCount && !usedManagerOffDows.has(candidate)) {
                        offs.add(candidate);
                        usedManagerOffDows.add(candidate);
                    }
                });
                for (let d = 1; d <= 6 && offs.size < targetCount; d++) {
                    if (!usedManagerOffDows.has(d)) {
                        offs.add(d);
                        usedManagerOffDows.add(d);
                    }
                }
                weeklyOffDaysMap[emp.name] = offs;
            });

        // GEEK: Nunca folga junto com GERENTE nem SENIOR
        activeEmployees
            .filter((e) => e.group === 'GEEK')
            .forEach((emp, gIdx) => {
                const targetCount = mode === '5X2' ? 2 : 1;
                const pref = mode === '5X2' ? v.geekOff5x2 : v.geekOff6x1;
                const offs = new Set();
                pref.forEach((d) => {
                    const candidate = (d + gIdx) % 7;
                    if (offs.size < targetCount && !usedManagerOffDows.has(candidate)) {
                        offs.add(candidate);
                        usedManagerOffDows.add(candidate);
                    }
                });
                for (let d = 1; d <= 6 && offs.size < targetCount; d++) {
                    if (!usedManagerOffDows.has(d)) {
                        offs.add(d);
                        usedManagerOffDows.add(d);
                    }
                }
                weeklyOffDaysMap[emp.name] = offs;
            });

        // ADM e ASSISTENTE RELACIONAMENTO: Sempre Domingo + adaptável na 5x2
        activeEmployees
            .filter((e) => e.group === 'ADM')
            .forEach((emp) => {
                const offs = new Set([0]);
                if (mode === '5X2') offs.add(v.admExtra5x2);
                weeklyOffDaysMap[emp.name] = offs;
            });

        activeEmployees
            .filter((e) => e.group === 'ASSISTENTE_RELA')
            .forEach((emp) => {
                const offs = new Set([0]);
                if (mode === '5X2') offs.add(v.relaExtra5x2);
                weeklyOffDaysMap[emp.name] = offs;
            });

        // VENDEDORES: Separados por turno -> Não folgam 2 do mesmo turno no mesmo dia
        ['MANHA', 'INTERMEDIARIO', 'TARDE'].forEach((secKey, secIdx) => {
            const sellersInSec = activeEmployees.filter(
                (e) => e.group === 'VENDEDOR' && nextSections[e.name] === secKey
            );
            const offCountByDow = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            const targetOff = mode === '5X2' ? 2 : 1;

            sellersInSec.forEach((emp, idxInSec) => {
                const offs = new Set();
                for (let k = 0; k < 7 && offs.size < targetOff; k++) {
                    const candidateDow = (idxInSec * 2 + k + v.sellerOffset + secIdx) % 7;
                    if (offCountByDow[candidateDow] === 0 && !offs.has(candidateDow)) {
                        offs.add(candidateDow);
                        offCountByDow[candidateDow] += 1;
                    }
                }
                while (offs.size < targetOff) {
                    const avail = [0, 1, 2, 3, 4, 5, 6]
                        .filter((d) => !offs.has(d))
                        .sort((a, b) => offCountByDow[a] - offCountByDow[b]);
                    if (avail.length === 0) break;
                    offs.add(avail[0]);
                    offCountByDow[avail[0]] += 1;
                }
                weeklyOffDaysMap[emp.name] = offs;
            });
        });

        activeEmployees.forEach((emp) => {
            const sec = nextSections[emp.name];
            const offs = weeklyOffDaysMap[emp.name] || new Set([0]);
            nextSchedule[emp.name] = {};

            DIAS_SEMANA_FULL.forEach((dName, dow) => {
                nextSchedule[emp.name][dName] = offs.has(dow) ? 'F' : workSiglaForSection(sec, dow, false);
            });

            const empMonthOverrides = { ...(nextMonthlyForMonth[emp.name] || {}) };
            monthDaysList.forEach((dayObj) => {
                const isOff = offs.has(dayObj.dow);
                empMonthOverrides[dayObj.dateStr] = isOff
                    ? 'F'
                    : workSiglaForSection(sec, dayObj.dow, dayObj.isHoliday);
            });
            nextMonthlyForMonth[emp.name] = empMonthOverrides;
        });

        setScheduleData(nextSchedule);
        setMonthlyOverrides(nextMonthlyForMonth);
        setIdeaLoopIndex(step + 1);

        toast.success(`Sugestão ${mode} #${(step % VARIATIONS.length) + 1} aplicada!`, {
            icon: '✨',
            duration: 2200
        });
    };

    const currentModelSpecs = SHIFT_SCHEDULES_BY_MODEL[escalaModel] || SHIFT_SCHEDULES_BY_MODEL['6X1'];

    const groupedSections = useMemo(() => {
        const groups = {
            MANHA: [],
            INTERMEDIARIO: [],
            TARDE: []
        };
        activeEmployees.forEach((emp, idx) => {
            const sec = getEmployeeSection(emp, idx);
            groups[sec].push(emp);
        });
        const specs = SHIFT_SCHEDULES_BY_MODEL[escalaModel] || SHIFT_SCHEDULES_BY_MODEL['6X1'];
        return [
            {
                id: 'MANHA',
                title: 'MANHÃ',
                subtitle: specs.MANHA.range,
                cargaHoraria: specs.MANHA.carga,
                fullLabel: specs.MANHA.fullLabel,
                icon: <Sun size={13} className="text-sky-400" />,
                barGradient: 'from-slate-900 via-slate-800 to-sky-950 border-sky-500/30',
                badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
                employees: groups.MANHA
            },
            {
                id: 'INTERMEDIARIO',
                title: 'INTERMEDIÁRIO',
                subtitle: specs.INTERMEDIARIO.range,
                cargaHoraria: specs.INTERMEDIARIO.carga,
                fullLabel: specs.INTERMEDIARIO.fullLabel,
                icon: <Sunset size={13} className="text-amber-400" />,
                barGradient: 'from-slate-900 via-slate-800 to-amber-950 border-amber-500/30',
                badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
                employees: groups.INTERMEDIARIO
            },
            {
                id: 'TARDE',
                title: 'TARDE / NOITE',
                subtitle: specs.TARDE.range,
                cargaHoraria: specs.TARDE.carga,
                fullLabel: specs.TARDE.fullLabel,
                icon: <Moon size={13} className="text-indigo-400" />,
                barGradient: 'from-slate-900 via-slate-800 to-indigo-950 border-indigo-500/30',
                badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
                employees: groups.TARDE
            }
        ];
    }, [activeEmployees, scheduleData, escalaModel]);

    // Exportação Excel (.xlsx) no modelo da planilha com a carga horária exata do turno (6x1 ou 5x2 - 42h)
    const handleExportExcel = () => {
        if (activeEmployees.length === 0) {
            toast.error('Nenhum colaborador ativo para exportar.');
            return;
        }

        const aoa = [];
        const row1 = [`${storeDisplayName} (${escalaModel})`, `${currentMonthLabel} - ${currentModelSpecs.weeklyTotal}`, ...monthDaysList.map((d) => d.dayLetter)];
        const row2 = ['', '', ...monthDaysList.map((d) => d.dayNumber)];
        aoa.push(row1, row2);

        groupedSections.forEach((sec) => {
            const headerRow = [
                'Nome',
                'CARGO',
                `${sec.title} — ${sec.subtitle} (${sec.cargaHoraria})`,
                ...new Array(Math.max(0, monthDaysList.length - 1)).fill('')
            ];
            aoa.push(headerRow);

            sec.employees.forEach((emp) => {
                const empRow = [
                    getFirstName(emp.name).toUpperCase(),
                    emp.friendlyRole,
                    ...monthDaysList.map((d) => getCellSigla(emp, d, sec.id))
                ];
                aoa.push(empRow);
            });
        });

        aoa.push([]);
        const legendRows = [
            ['FOLGA', 'F', `ESCALA ${escalaModel} (${currentModelSpecs.weeklyTotal}) — SUJEITA A ALTERAÇÕES`],
            ['ATESTADO', 'AT', ''],
            ['FOLGA BANCO', 'FB', ''],
            ['FOLGA PREMIO', 'FP', ''],
            ['TREINAMENTO', 'TR', ''],
            [`INTERMEDIARIO (${currentModelSpecs.INTERMEDIARIO.range} • ${currentModelSpecs.INTERMEDIARIO.carga})`, 'I', ''],
            [`MANHA (${currentModelSpecs.MANHA.range} • ${currentModelSpecs.MANHA.carga})`, 'M', ''],
            [`TARDE / NOITE (${currentModelSpecs.TARDE.range} • ${currentModelSpecs.TARDE.carga})`, 'N / T', ''],
            ['AFASTADA / FERIAS', 'AF / FE', '']
        ];
        legendRows.forEach((lr) => aoa.push(lr));

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [
            { wch: 18 },
            { wch: 22 },
            ...monthDaysList.map(() => ({ wch: 4.5 }))
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Escala_${currentMonthLabel}`);
        XLSX.writeFile(wb, `Escala_${storeDisplayName.replace(/\s+/g, '_')}_${selectedScheduleMonth}.xlsx`);
        toast.success('Planilha de Escala exportada em Excel com sucesso!');
    };

    // Impressão dedicada em Iframe isolado A4 Paisagem (Garante 0% de chance de página em branco ou corte de colunas)
    const handlePrintSchedule = useCallback(() => {
        if (typeof document === 'undefined') return;

        const escapeHtml = (str) =>
            String(str ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

        const headerLettersHtml = monthDaysList
            .map((d) => {
                const cls = d.isHoliday
                    ? 'th-holiday'
                    : d.isWeekend
                        ? (d.dow === 0 ? 'th-sunday' : 'th-saturday')
                        : 'th-weekday-letter';
                return `<th class="${cls}">${escapeHtml(d.dayLetter)}</th>`;
            })
            .join('');

        const headerNumsHtml = monthDaysList
            .map((d) => {
                const cls = d.isHoliday
                    ? 'th-holiday'
                    : d.isWeekend
                        ? (d.dow === 0 ? 'th-sunday-num' : 'th-saturday-num')
                        : 'th-weekday-num';
                return `<th class="${cls}">${String(d.dayNumber).padStart(2, '0')}</th>`;
            })
            .join('');

        const sectionsHtml = groupedSections
            .map((sec) => {
                const sectionClass =
                    sec.id === 'MANHA'
                        ? 'sec-manha'
                        : sec.id === 'INTERMEDIARIO'
                            ? 'sec-inter'
                            : 'sec-tarde';

                const rowsHtml =
                    sec.employees.length === 0
                        ? `<tr><td colspan="${2 + monthDaysList.length}" class="empty-row">Nenhum colaborador alocado em ${escapeHtml(sec.title)}</td></tr>`
                        : sec.employees
                              .map((emp) => {
                                  const isHigh = emp.group !== 'VENDEDOR';
                                  const rowTypeClass = isHigh ? 'emp-high' : 'emp-norm';
                                  const dotColor = isHigh ? '#E3000F' : '#0284c7';

                                  const dayCells = monthDaysList
                                      .map((d) => {
                                          const sigla = getCellSigla(emp, d, sec.id);
                                          const isFolga = sigla === 'F' || sigla === 'FB' || sigla === 'FP';
                                          let bg = '#ffffff';
                                          let color = '#111827';

                                          if (d.isHoliday) {
                                              bg = '#facc15';
                                              color = isFolga ? '#E3000F' : '#09090b';
                                          } else if (d.dow === 0) {
                                              bg = '#dc2626';
                                              color = '#ffffff'; // No domingo, inclusive o F de folga é branco sobre fundo vermelho
                                          } else if (d.dow === 6) {
                                              bg = '#0284c7';
                                              color = isFolga ? '#E3000F' : '#ffffff';
                                          } else {
                                              bg = '#ffffff';
                                              if (isFolga) color = '#E3000F';
                                              else if (sigla === 'AT' || sigla === 'AF' || sigla === 'FE') {
                                                  bg = '#fef3c7';
                                                  color = '#92400e';
                                              } else if (sigla === 'M') color = '#0369a1';
                                              else if (sigla === 'I') color = '#b45309';
                                              else if (sigla === 'N') color = '#4338ca';
                                              else color = '#111827';
                                          }

                                          return `<td style="background:${bg};color:${color};font-weight:900;">${escapeHtml(sigla)}</td>`;
                                      })
                                      .join('');

                                  return `<tr class="${rowTypeClass}">
                                      <td class="col-nome"><span class="dot" style="background:${dotColor};"></span>${escapeHtml(getFirstName(emp.name))}</td>
                                      <td class="col-cargo">${escapeHtml(emp.friendlyRole)}</td>
                                      ${dayCells}
                                  </tr>`;
                              })
                              .join('');

                return `
                    <tr class="sec-bar ${sectionClass}">
                        <td class="sec-label">Nome</td>
                        <td class="sec-label">Cargo</td>
                        <td colspan="${monthDaysList.length}" class="sec-title">
                            <span>${escapeHtml(sec.title)}</span>
                            <span class="sec-pill">${escapeHtml(sec.subtitle)} • ${escapeHtml(sec.cargaHoraria)}</span>
                        </td>
                    </tr>
                    ${rowsHtml}
                `;
            })
            .join('');

        const legendItems = [
            { label: `MANHÃ (${currentModelSpecs.MANHA.range} • ${currentModelSpecs.MANHA.carga})`, code: 'M', color: '#0369a1' },
            { label: `INTERMEDIÁRIO (${currentModelSpecs.INTERMEDIARIO.range} • ${currentModelSpecs.INTERMEDIARIO.carga})`, code: 'I', color: '#b45309' },
            { label: `TARDE / NOITE (${currentModelSpecs.TARDE.range} • ${currentModelSpecs.TARDE.carga})`, code: 'N / T', color: '#4338ca' },
            { label: 'FOLGA', code: 'F', color: '#E3000F' },
            { label: 'FOLGA BANCO / FOLGA PRÊMIO', code: 'FB / FP', color: '#E3000F' },
            { label: 'ATESTADO', code: 'AT', color: '#b45309' },
            { label: 'TREINAMENTO', code: 'TR', color: '#0284c7' },
            { label: 'AFASTADA / FÉRIAS', code: 'AF / FE', color: '#334155' }
        ];

        const legendHtml = legendItems
            .map(
                (it) => `<div class="leg-row">
                    <span class="leg-lbl">${escapeHtml(it.label)}</span>
                    <span class="leg-code" style="color:${it.color};">${escapeHtml(it.code)}</span>
                </div>`
            )
            .join('');

        const printHtml = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Escala_${escapeHtml(storeDisplayName)}_${escapeHtml(selectedScheduleMonth)}</title>
<style>
  @page { size: A4 landscape; margin: 5mm; }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #09090b;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }
  .sheet-wrap {
    width: 100%;
    border: 1.5px solid #1e293b;
    background: #ffffff;
  }
  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 7.5pt;
  }
  th, td {
    border: 1px solid #334155;
    padding: 2.5px 1px;
    text-align: center;
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .th-unidade {
    width: 102px;
    background: #0f172a;
    color: #ffffff;
    font-weight: 900;
    font-size: 6.8pt;
    line-height: 1.15;
    white-space: normal;
    word-break: break-word;
    padding: 4px 3px;
  }
  .th-unidade small {
    display: block;
    font-size: 5.8pt;
    color: #ef4444;
    letter-spacing: 0.08em;
    margin-bottom: 1px;
  }
  .th-mes {
    width: 114px;
    background: #1e293b;
    color: #ffffff;
    font-weight: 900;
    font-size: 7pt;
    line-height: 1.15;
    white-space: normal;
    padding: 4px 3px;
  }
  .th-mes small {
    display: block;
    font-size: 6pt;
    color: #38bdf8;
    letter-spacing: 0.08em;
  }
  .th-weekday-letter { background: #0f172a; color: #e2e8f0; font-weight: 800; }
  .th-weekday-num { background: #1e293b; color: #ffffff; font-weight: 900; }
  .th-sunday, .th-sunday-num { background: #dc2626; color: #ffffff; font-weight: 900; }
  .th-saturday, .th-saturday-num { background: #0284c7; color: #ffffff; font-weight: 900; }
  .th-holiday { background: #facc15; color: #09090b; font-weight: 900; }
  .sec-bar td {
    color: #ffffff;
    font-weight: 900;
    text-transform: uppercase;
    padding: 3px 4px;
    font-size: 7.2pt;
  }
  .sec-manha td { background: #0c4a6e; }
  .sec-inter td { background: #78350f; }
  .sec-tarde td { background: #1e1b4b; }
  .sec-bar td.sec-label { background: #0f172a; text-align: left; color: #cbd5e1; }
  .sec-pill {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.16);
    font-size: 6.5pt;
    font-weight: 800;
  }
  .emp-high td.col-nome, .emp-high td.col-cargo { background: #e5e7eb; color: #09090b; }
  .emp-norm td.col-nome, .emp-norm td.col-cargo { background: #f8fafc; color: #09090b; }
  td.col-nome {
    text-align: left;
    padding-left: 4px;
    font-weight: 900;
    text-transform: uppercase;
  }
  td.col-cargo {
    text-align: left;
    padding-left: 4px;
    font-weight: 700;
    font-size: 7pt;
  }
  .dot {
    display: inline-block;
    width: 3px;
    height: 9px;
    border-radius: 2px;
    margin-right: 4px;
    vertical-align: middle;
  }
  .empty-row { color: #64748b; font-style: italic; padding: 4px; }
  .footer-grid {
    display: grid;
    grid-template-columns: 46% 54%;
    border-top: 2px solid #0f172a;
    page-break-inside: avoid;
  }
  .leg-box {
    border-right: 1.5px solid #334155;
    font-size: 6.6pt;
    font-weight: 800;
    text-transform: uppercase;
  }
  .leg-row {
    display: grid;
    grid-template-columns: 78% 22%;
    border-bottom: 1px solid #cbd5e1;
  }
  .leg-row:last-child { border-bottom: none; }
  .leg-lbl {
    padding: 2px 5px;
    border-right: 1px solid #cbd5e1;
    color: #1e293b;
  }
  .leg-code {
    padding: 2px 4px;
    text-align: center;
    font-weight: 900;
  }
  .banner-box {
    background: linear-gradient(90deg, #0369a1, #0284c7, #075985);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8px;
  }
  .banner-title {
    font-size: 8.5pt;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .banner-sub {
    margin-top: 4px;
    font-size: 6.8pt;
    font-weight: 700;
    color: #e0f2fe;
  }
</style>
</head>
<body>
  <div class="sheet-wrap">
    <table>
      <thead>
        <tr>
          <th rowspan="2" class="th-unidade"><small>UNIDADE</small>${escapeHtml(storeDisplayName)}</th>
          <th rowspan="2" class="th-mes"><small>${escapeHtml(currentYearLabel)}</small>${escapeHtml(currentMonthLabel)}</th>
          ${headerLettersHtml}
        </tr>
        <tr>
          ${headerNumsHtml}
        </tr>
      </thead>
      <tbody>
        ${sectionsHtml}
      </tbody>
    </table>
    <div class="footer-grid">
      <div class="leg-box">${legendHtml}</div>
      <div class="banner-box">
        <div class="banner-title">ESCALA ${escapeHtml(escalaModel)} (${escapeHtml(currentModelSpecs.weeklyTotal)}) — SUJEITA A ALTERAÇÕES</div>
        <div class="banner-sub">Sábado (Azul) • Domingo (Vermelho) • Feriado (Amarelo)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

        const existingFrame = document.getElementById('escala-print-iframe');
        if (existingFrame) existingFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'escala-print-iframe';
        iframe.className = 'no-print';
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '1123px';
        iframe.style.height = '794px';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
            window.print();
            return;
        }
        doc.open();
        doc.write(printHtml);
        doc.close();

        const triggerIframePrint = () => {
            try {
                const win = iframe.contentWindow;
                if (!win) {
                    window.print();
                    return;
                }
                win.onafterprint = () => {
                    setTimeout(() => {
                        iframe.remove();
                    }, 500);
                };
                win.focus();
                win.print();
            } catch (err) {
                window.print();
            }
        };

        if (doc.readyState === 'complete') {
            setTimeout(triggerIframePrint, 120);
        } else {
            iframe.onload = () => setTimeout(triggerIframePrint, 120);
        }
    }, [monthDaysList, groupedSections, storeDisplayName, currentYearLabel, currentMonthLabel, escalaModel, currentModelSpecs, scheduleData, monthlyOverrides]);

    // Captura Ctrl+P / Cmd+P quando estiver na Escala de Trabalho para usar a impressão dedicada
    useEffect(() => {
        if (!hasAccess) return;
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'p') {
                e.preventDefault();
                handlePrintSchedule();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [hasAccess, handlePrintSchedule]);

    // Estilização Tecnológica & Elegante das células da matriz (mantendo a semântica: Domingo Vermelho, Sábado Azul, Feriado Amarelo, Folga em destaque)
    const getTechCellClasses = (dayObj, sigla) => {
        if (dayObj.isHoliday) {
            return 'print-cell-holiday bg-gradient-to-b from-amber-300 to-yellow-400 text-neutral-950 font-black border-amber-500/60 shadow-inner';
        }
        if (dayObj.isWeekend) {
            if (sigla === 'F' || sigla === 'FB' || sigla === 'FP') {
                return dayObj.dow === 0
                    ? 'print-cell-sunday bg-gradient-to-b from-red-600 to-red-700 text-white font-black border-red-800/70'
                    : 'print-cell-saturday bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-black border-sky-700/70';
            }
            return dayObj.dow === 0
                ? 'print-cell-sunday bg-gradient-to-b from-red-600 to-red-700 text-white font-black border-red-800/70'
                : 'print-cell-saturday bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-black border-sky-700/70';
        }
        // Dias de semana normais com codificação sutil e tecnológica por sigla
        if (sigla === 'F' || sigla === 'FB' || sigla === 'FP') {
            return 'print-cell-weekday print-sigla-folga bg-rose-50/90 dark:bg-rose-950/35 text-[#E3000F] dark:text-rose-400 font-black border-neutral-200/90 dark:border-neutral-800';
        }
        if (sigla === 'AT' || sigla === 'AF' || sigla === 'FE') {
            return 'print-cell-weekday print-sigla-amber bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-300 font-black border-neutral-200/90 dark:border-neutral-800';
        }
        if (sigla === 'M') {
            return 'print-cell-weekday print-sigla-manha bg-white dark:bg-neutral-900/90 text-sky-700 dark:text-sky-300 font-extrabold border-neutral-200/90 dark:border-neutral-800';
        }
        if (sigla === 'I') {
            return 'print-cell-weekday print-sigla-inter bg-white dark:bg-neutral-900/90 text-amber-700 dark:text-amber-300 font-extrabold border-neutral-200/90 dark:border-neutral-800';
        }
        if (sigla === 'N') {
            return 'print-cell-weekday print-sigla-noite bg-white dark:bg-neutral-900/90 text-indigo-700 dark:text-indigo-300 font-extrabold border-neutral-200/90 dark:border-neutral-800';
        }
        return 'print-cell-weekday bg-white dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 font-extrabold border-neutral-200/90 dark:border-neutral-800';
    };

    return (
        <div
            className="escala-print-wrapper h-full flex flex-col animate-fade-in print:block print:h-auto print:bg-white antialiased"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 4mm; }
                    html, body, #root {
                        background: #ffffff !important;
                        color: #000000 !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print, .print-hide-select { display: none !important; }
                    .print-only-sigla { display: block !important; }
                    .escala-print-wrapper,
                    .escala-print-root,
                    .escala-scroll-box {
                        position: static !important;
                        transform: none !important;
                        animation: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    .print-schedule {
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 1.5px solid #1e293b !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    .print-schedule * {
                        visibility: visible !important;
                    }
                    .print-schedule .sticky {
                        position: static !important;
                        box-shadow: none !important;
                    }
                    .escala-sheet-table {
                        width: 100% !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 7.5pt !important;
                    }
                    .escala-sheet-table th,
                    .escala-sheet-table td {
                        min-width: 0 !important;
                        padding: 2px 1px !important;
                        border: 1px solid #334155 !important;
                        line-height: 1.15 !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }
                    th.escala-col-nome,
                    th.escala-col-cargo {
                        white-space: normal !important;
                        word-break: break-word !important;
                        font-size: 6.8pt !important;
                        padding: 3px 2px !important;
                    }
                    .escala-col-nome {
                        width: 98px !important;
                        min-width: 98px !important;
                        max-width: 98px !important;
                    }
                    .escala-col-cargo {
                        width: 114px !important;
                        min-width: 114px !important;
                        max-width: 114px !important;
                    }
                    /* Cores limpas para impressão independente de Modo Escuro ativo na tela */
                    .print-row-highlight {
                        background: #e5e7eb !important;
                        color: #09090b !important;
                    }
                    .print-row-normal {
                        background: #ffffff !important;
                        color: #09090b !important;
                    }
                    .print-cell-weekday {
                        background: #ffffff !important;
                        color: #111827 !important;
                    }
                    .print-sigla-manha { color: #0369a1 !important; }
                    .print-sigla-inter { color: #b45309 !important; }
                    .print-sigla-noite { color: #4338ca !important; }
                    .print-sigla-amber { background: #fef3c7 !important; color: #92400e !important; }
                    .print-sigla-folga { background: #fff1f2 !important; color: #E3000F !important; }
                    .print-cell-sunday {
                        background: #dc2626 !important;
                        color: #ffffff !important;
                    }
                    .print-cell-saturday {
                        background: #0284c7 !important;
                        color: #ffffff !important;
                    }
                    .print-cell-holiday {
                        background: #facc15 !important;
                        color: #09090b !important;
                    }
                    .print-folga-red { color: #E3000F !important; }
                    .print-folga-white { color: #ffffff !important; }
                    .print-footer-grid {
                        display: grid !important;
                        grid-template-columns: 45% 55% !important;
                        border-top: 2px solid #1e293b !important;
                        page-break-inside: avoid !important;
                        background: #ffffff !important;
                    }
                    .print-legend-box {
                        background: #ffffff !important;
                        color: #111827 !important;
                        font-size: 6.8pt !important;
                    }
                    .print-legend-box div {
                        color: #111827 !important;
                        border-color: #cbd5e1 !important;
                        padding-top: 1.5px !important;
                        padding-bottom: 1.5px !important;
                    }
                }
            `}</style>

            {!hasAccess ? (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl no-print">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                        <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                            Apenas a Gerência tem autorização para visualizar e editar a escala de trabalho.
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
                <div className="flex flex-col h-full bg-white dark:bg-neutral-950 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden escala-print-root">
                    {/* BARRA DE COMANDO TECNOLÓGICA COMPACTA (SEM INSTRUÇÕES VISÍVEIS) */}
                    <div className="no-print px-4 py-3 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* IDENTIFICAÇÃO TECNOLÓGICA + SELETOR DE MÊS */}
                            <div className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-xl shadow-inner">
                                <span className="w-2 h-2 rounded-full bg-[#E3000F] animate-pulse" />
                                <CalendarDays size={15} className="text-[#E3000F]" />
                                <input
                                    type="month"
                                    value={selectedScheduleMonth}
                                    onChange={(e) => setSelectedScheduleMonth(e.target.value)}
                                    className="bg-transparent text-xs sm:text-sm font-extrabold text-white outline-none cursor-pointer tracking-wide"
                                />
                            </div>

                            {canEditSchedule && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-700/80">
                                        {['6X1', '5X2'].map((mod) => (
                                            <button
                                                key={mod}
                                                type="button"
                                                onClick={() => {
                                                    setEscalaModel(mod);
                                                    handleGenerateSuggestionLoop(mod);
                                                }}
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer ${
                                                    escalaModel === mod
                                                        ? 'bg-gradient-to-r from-[#E3000F] to-red-600 text-white shadow-md shadow-red-600/30'
                                                        : 'text-neutral-400 hover:text-white'
                                                }`}
                                            >
                                                {mod}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGenerateSuggestionLoop(escalaModel)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 text-white border border-neutral-700 text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer group"
                                        title="Gerar nova sugestão automática de escala em loop"
                                    >
                                        <Sparkles size={14} className="text-[#E3000F] group-hover:scale-110 transition-transform" />
                                        <span>Sugerir Escala ({escalaModel})</span>
                                        <RefreshCw size={13} className="text-neutral-400 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                            )}

                            {/* INDICADOR DE CARGA HORÁRIA DO REGIME ATIVO (6X1: 44h | 5X2: 42h) */}
                            <div className="px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-[11px] font-extrabold text-neutral-200 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#E3000F] text-white font-black text-[10px]">
                                    {escalaModel}
                                </span>
                                <span>{currentModelSpecs.weeklyTotal}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-[#107c41] hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
                            >
                                <FileSpreadsheet size={15} />
                                <span>Exportar Excel</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePrintSchedule}
                                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                                <Printer size={15} />
                                <span>Imprimir</span>
                            </button>
                        </div>
                    </div>

                    {/* MATRIZ TECNOLÓGICA DE ESCALA (PADRÃO PLANILHA POR TURNOS E SIGLAS) */}
                    <div className="flex-1 overflow-auto p-2 sm:p-4 bg-neutral-100/80 dark:bg-neutral-950 escala-print-root">
                        <div className="print-schedule bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto escala-scroll-box">
                                <table className="w-full border-collapse text-center whitespace-nowrap escala-sheet-table select-none">
                                    {/* CABEÇALHO DA MATRIZ: LOJA | MÊS | LETRAS E DIAS DO MÊS */}
                                    <thead>
                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="escala-col-nome bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white font-black text-xs sm:text-sm uppercase px-3 py-2.5 border border-neutral-700 sticky left-0 z-20 min-w-[140px] tracking-wider shadow-[2px_0_8px_rgba(0,0,0,0.25)]"
                                            >
                                                <div className="flex flex-col items-center justify-center leading-tight">
                                                    <span className="text-[10px] font-bold text-[#E3000F] tracking-widest">UNIDADE</span>
                                                    <span>{storeDisplayName}</span>
                                                </div>
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="escala-col-cargo bg-gradient-to-br from-neutral-800 to-neutral-900 text-white font-black text-xs sm:text-sm uppercase px-3 py-2.5 border border-neutral-700 min-w-[165px] tracking-wider"
                                            >
                                                <div className="flex flex-col items-center justify-center leading-tight">
                                                    <span className="text-[10px] font-bold text-sky-400 tracking-widest">{currentYearLabel}</span>
                                                    <span>{currentMonthLabel}</span>
                                                </div>
                                            </th>
                                            {monthDaysList.map((d) => {
                                                const headerBg = d.isHoliday
                                                    ? 'bg-gradient-to-b from-amber-300 to-yellow-400 text-neutral-950 font-black'
                                                    : d.isWeekend
                                                        ? (d.dow === 0 ? 'bg-gradient-to-b from-red-600 to-red-700 text-white font-black' : 'bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-black')
                                                        : 'bg-neutral-900 text-neutral-300 font-bold';
                                                return (
                                                    <th
                                                        key={`letter-${d.dateStr}`}
                                                        onClick={() => handleToggleHolidayColumn(d)}
                                                        title={canEditSchedule ? 'Clique para marcar/desmarcar Feriado (Amarelo)' : d.dayNameFull}
                                                        className={`px-1 py-1.5 text-[11px] font-black border border-neutral-700/80 min-w-[32px] sm:min-w-[35px] cursor-pointer transition-all hover:brightness-110 ${headerBg}`}
                                                    >
                                                        {d.dayLetter}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            {monthDaysList.map((d) => {
                                                const numBg = d.isHoliday
                                                    ? 'bg-yellow-400 text-neutral-950 font-black'
                                                    : d.isWeekend
                                                        ? (d.dow === 0 ? 'bg-red-700 text-white font-black' : 'bg-[#0369a1] text-white font-black')
                                                        : 'bg-neutral-800 text-white font-extrabold';
                                                return (
                                                    <th
                                                        key={`num-${d.dateStr}`}
                                                        onClick={() => handleToggleHolidayColumn(d)}
                                                        title={canEditSchedule ? 'Clique para marcar/desmarcar Feriado (Amarelo)' : `Dia ${d.dayNumber}`}
                                                        className={`px-1 py-1 text-[11px] font-black border border-neutral-700/80 cursor-pointer tabular-nums ${numBg}`}
                                                    >
                                                        {String(d.dayNumber).padStart(2, '0')}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {groupedSections.map((sec) => (
                                            <React.Fragment key={sec.id}>
                                                {/* FAIXA TECNOLÓGICA SEPARADORA DE TURNO: Nome | CARGO | MANHÃ / INTERMEDIÁRIO / TARDE + HORÁRIO E CARGA HORÁRIA */}
                                                <tr className={`bg-gradient-to-r ${sec.barGradient} text-white font-black text-[11px] uppercase tracking-wider`}>
                                                    <td className="px-3 py-1.5 border border-neutral-700 sticky left-0 z-10 bg-slate-900 text-neutral-300 text-left">
                                                        Nome
                                                    </td>
                                                    <td className="px-3 py-1.5 border border-neutral-700 text-neutral-300 text-left">
                                                        Cargo
                                                    </td>
                                                    <td
                                                        colSpan={monthDaysList.length}
                                                        className="px-4 py-1.5 border border-neutral-700 text-center"
                                                    >
                                                        <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                                                            {sec.icon}
                                                            <span className="tracking-widest font-black">{sec.title}</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${sec.badgeColor}`}>
                                                                {sec.subtitle} • {sec.cargaHoraria}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* LINHAS DOS COLABORADORES DO TURNO */}
                                                {sec.employees.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={2 + monthDaysList.length}
                                                            className="py-2.5 text-xs text-neutral-400 dark:text-neutral-500 italic border border-neutral-200 dark:border-neutral-800"
                                                        >
                                                            Nenhum colaborador alocado em {sec.title}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sec.employees.map((emp) => {
                                                        const isHighlightedRole = emp.group !== 'VENDEDOR';
                                                        const nameBg = isHighlightedRole
                                                            ? 'print-row-highlight bg-neutral-200/90 dark:bg-neutral-800/95 text-neutral-950 dark:text-white'
                                                            : 'print-row-normal bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100';

                                                        return (
                                                            <tr key={emp.name} className="hover:brightness-95 dark:hover:brightness-110 transition-all">
                                                                {/* NOME DO COLABORADOR */}
                                                                <td
                                                                    className={`escala-col-nome px-3 py-2 text-xs font-extrabold uppercase border border-neutral-300 dark:border-neutral-800 sticky left-0 z-10 text-left shadow-[2px_0_6px_rgba(0,0,0,0.06)] ${nameBg}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className={`w-1.5 h-4 rounded-full shrink-0 ${
                                                                                isHighlightedRole ? 'bg-[#E3000F]' : 'bg-sky-500'
                                                                            }`}
                                                                        />
                                                                        <span className="truncate">{getFirstName(emp.name)}</span>
                                                                    </div>
                                                                </td>

                                                                {/* CARGO + SELETOR RÁPIDO PARA MOVER DE FAIXA (M / I / T) */}
                                                                <td
                                                                    className={`escala-col-cargo px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold border border-neutral-300 dark:border-neutral-800 text-left ${nameBg}`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1.5">
                                                                        <span className="truncate">{emp.friendlyRole}</span>
                                                                        {canEditSchedule && (
                                                                            <select
                                                                                value={sec.id}
                                                                                onChange={(e) => handleChangeEmployeeSection(emp.name, e.target.value)}
                                                                                className="no-print text-[10px] font-black bg-neutral-900/10 dark:bg-white/10 hover:bg-neutral-900/20 dark:hover:bg-white/20 rounded-md px-1.5 py-0.5 outline-none cursor-pointer transition-colors"
                                                                                title="Mudar colaborador de turno (M = Manhã, I = Intermediário, T = Tarde)"
                                                                            >
                                                                                <option value="MANHA" className="bg-white text-black">M</option>
                                                                                <option value="INTERMEDIARIO" className="bg-white text-black">I</option>
                                                                                <option value="TARDE" className="bg-white text-black">T</option>
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* CÉLULAS DOS DIAS (1 A 30/31) COM SIGLAS LIMPAS */}
                                                                {monthDaysList.map((d) => {
                                                                    const sigla = getCellSigla(emp, d, sec.id);
                                                                    const cellTheme = getTechCellClasses(d, sigla);
                                                                    const isFolgaSigla = sigla === 'F' || sigla === 'FB' || sigla === 'FP';
                                                                    const folgaTextClass = isFolgaSigla
                                                                        ? (d.dow === 0 && !d.isHoliday ? 'text-white print-folga-white' : 'text-[#E3000F] print-folga-red')
                                                                        : '';

                                                                    return (
                                                                        <td
                                                                            key={`${emp.name}-${d.dateStr}`}
                                                                            className={`p-0 border text-xs sm:text-[13px] transition-colors ${cellTheme}`}
                                                                        >
                                                                            {canEditSchedule ? (
                                                                                <>
                                                                                    <select
                                                                                        value={sigla}
                                                                                        onChange={(e) => handleCellSiglaChange(emp.name, d.dateStr, e.target.value)}
                                                                                        className={`print-hide-select w-full h-full py-1.5 px-0 text-center font-black outline-none cursor-pointer appearance-none bg-transparent ${folgaTextClass}`}
                                                                                        style={{ textAlignLast: 'center', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                                                        title={`${getFirstName(emp.name)} • Dia ${d.dayNumber} (${d.dayNameFull})`}
                                                                                    >
                                                                                        {SIGLAS_ESCALA.map((s) => (
                                                                                            <option
                                                                                                key={s.code}
                                                                                                value={s.code}
                                                                                                title={s.label}
                                                                                                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-black text-center"
                                                                                            >
                                                                                                {s.code}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <span className={`hidden print-only-sigla py-0.5 px-0 font-black text-center ${folgaTextClass}`}>
                                                                                        {sigla}
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <span className={`block py-1.5 px-0.5 font-black ${folgaTextClass}`}>
                                                                                    {sigla}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* RODAPÉ TECNOLÓGICO NO PADRÃO DA PLANILHA: LEGENDA + BANNER AZUL OFICIAL */}
                            <div className="print-footer-grid grid grid-cols-1 lg:grid-cols-12 border-t-2 border-neutral-800">
                                {/* TABELA DE LEGENDA DE SIGLAS COM CARGA HORÁRIA COMPLETA EM TODOS OS TURNOS (MANHÃ, INTERMEDIÁRIO E TARDE) */}
                                <div className="print-legend-box lg:col-span-5 bg-neutral-50 dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800 border-b lg:border-b-0 lg:border-r border-neutral-700 text-[11px] font-extrabold uppercase">
                                    {[
                                        { label: `MANHÃ (${currentModelSpecs.MANHA.range} • ${currentModelSpecs.MANHA.carga})`, code: 'M', badge: 'text-sky-600 dark:text-sky-400' },
                                        { label: `INTERMEDIÁRIO (${currentModelSpecs.INTERMEDIARIO.range} • ${currentModelSpecs.INTERMEDIARIO.carga})`, code: 'I', badge: 'text-amber-600 dark:text-amber-400' },
                                        { label: `TARDE / NOITE (${currentModelSpecs.TARDE.range} • ${currentModelSpecs.TARDE.carga})`, code: 'N / T', badge: 'text-indigo-600 dark:text-indigo-400' },
                                        { label: 'FOLGA', code: 'F', badge: 'text-[#E3000F] dark:text-rose-400' },
                                        { label: 'FOLGA BANCO / FOLGA PRÊMIO', code: 'FB / FP', badge: 'text-[#E3000F] dark:text-rose-400' },
                                        { label: 'ATESTADO', code: 'AT', badge: 'text-amber-600 dark:text-amber-400' },
                                        { label: 'TREINAMENTO', code: 'TR', badge: 'text-sky-600 dark:text-sky-400' },
                                        { label: 'AFASTADA / FÉRIAS', code: 'AF / FE', badge: 'text-neutral-700 dark:text-neutral-300' }
                                    ].map((item) => (
                                        <div key={item.label} className="grid grid-cols-12 items-center hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                                            <div className="col-span-9 px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-300 border-r border-neutral-200 dark:border-neutral-800 tracking-wide">
                                                {item.label}
                                            </div>
                                            <div className={`col-span-3 px-2 py-1.5 text-center font-black ${item.badge}`}>
                                                {item.code}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* FAIXA AZUL TECNOLÓGICA "ESCALA SUJEITA A ALTERAÇÕES" */}
                                <div className="lg:col-span-7 bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#075985] text-white flex flex-col items-center justify-center p-5 text-center relative overflow-hidden">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.2em] drop-shadow-sm">
                                        <ShieldAlert size={16} className="text-sky-200 shrink-0" />
                                        <span>ESCALA {escalaModel} ({currentModelSpecs.weeklyTotal}) — SUJEITA A ALTERAÇÕES</span>
                                    </div>
                                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-sky-100 no-print">
                                        <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/15">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-white inline-block" />
                                            Sábado (Azul) • Domingo (Vermelho)
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/15">
                                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black/40 inline-block" />
                                            Feriado (Clique no dia no topo)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
