import React, { useState, useMemo } from 'react';
import {
    CalendarDays, Lock, Printer, Sparkles, RefreshCw, FileSpreadsheet, Flag
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

// Siglas oficiais da Escala (Idênticas e expandidas a partir da planilha padrão da loja)
export const SIGLAS_ESCALA = [
    { code: 'T', label: 'TRABALHA (TURNO FIXO)', horario: 'Turno Padrão' },
    { code: 'M', label: 'MANHÃ (ABERTURA)', horario: '09:40 - 18:00' },
    { code: 'I', label: 'INTERMEDIÁRIO', horario: '10:40 / 11:40' },
    { code: 'N', label: 'NOITE / TARDE (FECHAMENTO)', horario: '13:40 - 22:00' },
    { code: 'F', label: 'FOLGA', horario: 'FOLGA' },
    { code: 'FB', label: 'FOLGA BANCO', horario: 'FOLGA BANCO' },
    { code: 'FP', label: 'FOLGA PRÊMIO', horario: 'FOLGA PRÊMIO' },
    { code: 'AT', label: 'ATESTADO', horario: 'ATESTADO' },
    { code: 'TR', label: 'TREINAMENTO', horario: 'TREINAMENTO' },
    { code: 'FE', label: 'FÉRIAS', horario: 'FÉRIAS' },
    { code: 'AF', label: 'AFASTADA(O)', horario: 'AFASTADA' }
];

// Converte qualquer valor antigo (ex: '09:40 - 18:00', 'FOLGA') para a Sigla Oficial
const normalizeToSigla = (val, sectionShift = 'MANHA') => {
    const raw = String(val || '').trim().toUpperCase();
    const v = raw.includes('—') ? raw.split('—')[0].trim() : raw.includes('-') && !raw.includes(':') ? raw.split('-')[0].trim() : raw;
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

// Feriados nacionais fixos (MM-DD) para pré-destacar em amarelo automaticamente
const FERIADOS_FIXOS_MM_DD = new Set([
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência
    '10-12', // Nossa Sra. Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Consciência Negra
    '12-25'  // Natal
]);

// Identifica grupo de regra por cargo
const getRoleRuleGroup = (roleRaw) => {
    const r = String(roleRaw || 'VENDEDOR').trim().toUpperCase();
    if (r.includes('GERENTE') || r.includes('COORDENADOR') || r.includes('ESPECIALISTA')) return 'GERENTE';
    if (r.includes('SENIOR') || r.includes('SÊNIOR')) return 'SENIOR';
    if (r.includes('GEEK') || r.includes('TECNOL')) return 'GEEK';
    if (r.includes('ADMIN') || r === 'ADM') return 'ADM';
    if (r.includes('ASSISTENTE') || r.includes('RELA')) return 'ASSISTENTE_RELA';
    return 'VENDEDOR';
};

// Nome amigável do cargo como na planilha ("Vendedora Sênior", "Assistente Adm", "Assis Relacionamento", "Assistente Tecnológico", "Vendedor(a) Loja")
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

    const [escalaModel, setEscalaModel] = useState('6X1'); // '6X1' | '5X2'
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

    // Colaboradores ativos da loja
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

    // Define em qual bloco da planilha o colaborador está alocado: 'MANHA' | 'INTERMEDIARIO' | 'TARDE'
    const getEmployeeSection = (emp, idxInAll = 0) => {
        const savedSec = scheduleData?._sections?.[emp.name];
        if (savedSec && ['MANHA', 'INTERMEDIARIO', 'TARDE'].includes(savedSec)) {
            return savedSec;
        }

        // Inferência caso já tenha horário salvo anteriormente
        const savedBase = String(scheduleData?._baseShifts?.[emp.name] || '');
        if (savedBase.startsWith('13:') || savedBase.startsWith('14:')) return 'TARDE';
        if (savedBase.startsWith('10:40') || savedBase.startsWith('11:')) return 'INTERMEDIARIO';
        if (savedBase.startsWith('09:')) return 'MANHA';

        // Alocação padrão idêntica à estrutura da planilha da loja
        if (emp.group === 'GERENTE' || emp.group === 'ADM' || emp.group === 'ASSISTENTE_RELA') return 'MANHA';
        if (emp.group === 'GEEK') return 'INTERMEDIARIO';
        if (emp.group === 'SENIOR') {
            return idxInAll % 2 === 0 ? 'MANHA' : 'TARDE';
        }
        // Distribui vendedores proporcionalmente entre MANHÃ, INTERMEDIÁRIO e TARDE
        const mod = idxInAll % 5;
        if (mod === 0 || mod === 1) return 'MANHA';
        if (mod === 2) return 'INTERMEDIARIO';
        return 'TARDE';
    };

    // Permite mover o colaborador entre MANHA, INTERMEDIARIO e TARDE diretamente na linha
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

    // Gera os dias do mês selecionado
    const monthDaysList = useMemo(() => {
        const [year, month] = selectedScheduleMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const days = [];
        const customHolidays = monthlyOverrides?._holidays || {};

        while (date.getMonth() === month - 1) {
            const dNum = date.getDate();
            const mmdd = `${String(month).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
            const dateStr = `${year}-${mmdd}`;
            const dow = date.getDay(); // 0=Dom .. 6=Sab
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

    // Alterna se uma coluna do mês é Feriado (Amarelo) ao clicar no cabeçalho do dia
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
                ? `Dia ${dayObj.dayNumber} desmarcado como feriado.`
                : `Dia ${dayObj.dayNumber} destacado como Feriado (Amarelo)!`
        );
    };

    // Obtém a sigla exibida em uma célula (Colaborador + Dia do Mês)
    const getCellSigla = (emp, dayObj, section) => {
        const override = monthlyOverrides?.[emp.name]?.[dayObj.dateStr];
        if (override !== undefined && override !== '') {
            return normalizeToSigla(override, section);
        }
        const weeklyVal = scheduleData?.[emp.name]?.[dayObj.dayNameFull];
        if (weeklyVal !== undefined && weeklyVal !== '') {
            return normalizeToSigla(weeklyVal, section);
        }
        // Padrão inicial caso ainda não gerado
        if (dayObj.dow === 0 && ['GERENTE', 'ADM', 'ASSISTENTE_RELA'].includes(emp.group)) {
            return 'F';
        }
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

    // =========================================================================
    // GERADOR AUTOMÁTICO DE ESCALA (6X1 E 5X2) EM LOOP DE IDEIAS (SILENCIOSO)
    // =========================================================================
    const handleGenerateSuggestionLoop = (targetMode = null) => {
        if (!canEditSchedule) return;
        const mode = targetMode || escalaModel;
        const step = targetMode && targetMode !== escalaModel ? 0 : ideaLoopIndex;

        const VARIATIONS = [
            {
                gerenteExtra5x2: 6, // Sábado
                admExtra5x2: 6,     // Sábado
                relaExtra5x2: 5,    // Sexta
                seniorOff6x1: [1],  // Segunda
                seniorOff5x2: [1, 2],
                geekOff6x1: [3],    // Quarta
                geekOff5x2: [3, 4],
                sellerOffset: 0
            },
            {
                gerenteExtra5x2: 1, // Segunda
                admExtra5x2: 5,     // Sexta
                relaExtra5x2: 6,    // Sábado
                seniorOff6x1: [2],  // Terça
                seniorOff5x2: [2, 3],
                geekOff6x1: [4],    // Quinta
                geekOff5x2: [4, 5],
                sellerOffset: 1
            },
            {
                gerenteExtra5x2: 3, // Quarta
                admExtra5x2: 6,     // Sábado
                relaExtra5x2: 1,    // Segunda
                seniorOff6x1: [4],  // Quinta
                seniorOff5x2: [1, 4],
                geekOff6x1: [2],    // Terça
                geekOff5x2: [2, 5],
                sellerOffset: 2
            },
            {
                gerenteExtra5x2: 5, // Sexta
                admExtra5x2: 1,     // Segunda
                relaExtra5x2: 6,    // Sábado
                seniorOff6x1: [3],  // Quarta
                seniorOff5x2: [2, 3],
                geekOff6x1: [1],    // Segunda
                geekOff5x2: [1, 4],
                sellerOffset: 3
            },
            {
                gerenteExtra5x2: 2, // Terça
                admExtra5x2: 6,     // Sábado
                relaExtra5x2: 4,    // Quinta
                seniorOff6x1: [5],  // Sexta
                seniorOff5x2: [3, 5],
                geekOff6x1: [1],    // Segunda
                geekOff5x2: [1, 4],
                sellerOffset: 4
            }
        ];

        const v = VARIATIONS[step % VARIATIONS.length];
        const nextSections = { ...(scheduleData?._sections || {}) };
        const nextSchedule = { _sections: nextSections };
        const nextMonthlyForMonth = { ...(monthlyOverrides || {}) };

        // Garante seção definida para cada colaborador
        activeEmployees.forEach((emp, idx) => {
            nextSections[emp.name] = getEmployeeSection(emp, idx);
        });

        const workSiglaForSection = (sec, dow, isHol) => {
            if (isHol || dow === 0) return 'T';
            if (sec === 'MANHA') return 'M';
            if (sec === 'INTERMEDIARIO') return 'I';
            return 'N';
        };

        // 1. Dias de folga na semana (0=Dom..6=Sab) por colaborador respeitando 100% das regras
        const weeklyOffDaysMap = {};
        const usedManagerOffDows = new Set();

        // GERENTE: Domingo fixo (0) + conjunta adaptável na 5x2
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

        // ADM e ASSISTENTE RELACIONAMENTO: Sempre Domingo (0) + adaptável na 5x2
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

        // VENDEDORES: Separados por seção (MANHA, INTERMEDIARIO, TARDE) -> Não podem folgar 2 do mesmo turno no mesmo dia
        ['MANHA', 'INTERMEDIARIO', 'TARDE'].forEach((secKey, secIdx) => {
            const sellersInSec = activeEmployees.filter(
                (e) => e.group === 'VENDEDOR' && nextSections[e.name] === secKey
            );
            const offCountByDow = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            const targetOff = mode === '5X2' ? 2 : 1;

            sellersInSec.forEach((emp, idxInSec) => {
                const offs = new Set();
                // Passada 1: Dias com 0 vendedores deste turno folgando
                for (let k = 0; k < 7 && offs.size < targetOff; k++) {
                    const candidateDow = (idxInSec * 2 + k + v.sellerOffset + secIdx) % 7;
                    if (offCountByDow[candidateDow] === 0 && !offs.has(candidateDow)) {
                        offs.add(candidateDow);
                        offCountByDow[candidateDow] += 1;
                    }
                }
                // Passada 2: Dia com menor número de folgas no turno
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

        // Aplica tanto na base semanal quanto nos dias do mês ativo (com rotação sutil por semana no mês para dinamismo)
        activeEmployees.forEach((emp) => {
            const sec = nextSections[emp.name];
            const offs = weeklyOffDaysMap[emp.name] || new Set([0]);
            nextSchedule[emp.name] = {};

            DIAS_SEMANA_FULL.forEach((dName, dow) => {
                nextSchedule[emp.name][dName] = offs.has(dow) ? 'F' : workSiglaForSection(sec, dow, false);
            });

            // Preenche os dias do mês selecionado
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

        toast.success(`Sugestão ${mode} #${(step % VARIATIONS.length) + 1} aplicada na Escala!`, {
            icon: '✨',
            duration: 2500
        });
    };

    // Agrupa os colaboradores nas 3 faixas da planilha: MANHÃ, INTERMEDIÁRIO e TARDE
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
        return [
            { id: 'MANHA', title: 'MANHA', employees: groups.MANHA },
            { id: 'INTERMEDIARIO', title: 'INTERMEDIARIO', employees: groups.INTERMEDIARIO },
            { id: 'TARDE', title: 'TARDE', employees: groups.TARDE }
        ];
    }, [activeEmployees, scheduleData]);

    // =========================================================================
    // EXPORTAÇÃO PARA EXCEL (.XLSX) NO FORMATO DA PLANILHA OFICIAL
    // =========================================================================
    const handleExportExcel = () => {
        if (activeEmployees.length === 0) {
            toast.error('Nenhum colaborador ativo para exportar.');
            return;
        }

        const aoa = [];

        // Linha 1: LOJA | MÊS | Letras dos dias (D, S, T, Q, Q, S, S...)
        const row1 = [storeDisplayName, currentMonthLabel, ...monthDaysList.map((d) => d.dayLetter)];
        // Linha 2: Vazio | Vazio | Números dos dias (1..30/31)
        const row2 = ['', '', ...monthDaysList.map((d) => d.dayNumber)];
        aoa.push(row1, row2);

        // Para cada seção (MANHA, INTERMEDIARIO, TARDE)
        groupedSections.forEach((sec) => {
            const headerRow = ['Nome', 'CARGO', sec.title, ...new Array(Math.max(0, monthDaysList.length - 1)).fill('')];
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

        // Linha em branco + Bloco de Legenda Oficial como no rodapé da imagem
        aoa.push([]);
        const legendRows = [
            ['FOLGA', 'F', 'ESCALA SUJEITA A ALTERAÇÕES'],
            ['ATESTADO', 'AT', ''],
            ['FOLGA BANCO', 'FB', ''],
            ['FOLGA PREMIO', 'FP', ''],
            ['TREINAMENTO', 'TR', ''],
            ['INTERMEDIARIO', 'I', ''],
            ['MANHA / TARDE / TRABALHA', 'M / N / T', ''],
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

    // Estilo das células conforme o dia (Fim de semana Azul, Feriado Amarelo, Dia útil Branco/Escuro)
    const getCellThemeClasses = (dayObj, sigla) => {
        if (dayObj.isHoliday) {
            return 'bg-[#FFFF00] text-black font-black border-neutral-400 dark:border-neutral-600';
        }
        if (dayObj.isWeekend) {
            return 'bg-[#0070C0] text-white font-black border-[#005a9e]';
        }
        if (sigla === 'F' || sigla === 'FB' || sigla === 'FP') {
            return 'bg-red-50/70 dark:bg-red-950/30 text-[#E3000F] dark:text-red-400 font-black border-neutral-300 dark:border-neutral-700';
        }
        if (sigla === 'AT' || sigla === 'AF' || sigla === 'FE') {
            return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-black border-neutral-300 dark:border-neutral-700';
        }
        return 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold border-neutral-300 dark:border-neutral-700';
    };

    return (
        <div
            className="h-full flex flex-col animate-fade-in print:block print:h-auto print:bg-white antialiased"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
            <style>{`
                @media print {
                    @page { size: landscape; margin: 4mm; }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .escala-print-root {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        overflow: visible !important;
                    }
                    .escala-sheet-table {
                        width: 100% !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 8.5pt !important;
                    }
                    .escala-sheet-table th,
                    .escala-sheet-table td {
                        padding: 2px 1px !important;
                        border: 1px solid #333333 !important;
                    }
                    .escala-col-nome { width: 95px !important; }
                    .escala-col-cargo { width: 115px !important; }
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
                <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden escala-print-root">
                    {/* BARRA DE FERRAMENTAS COMPACTA (SEM TEXTOS OU INSTRUÇÕES LONGAS) */}
                    <div className="no-print px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <CalendarDays size={16} className="text-[#E3000F]" />
                                <input
                                    type="month"
                                    value={selectedScheduleMonth}
                                    onChange={(e) => setSelectedScheduleMonth(e.target.value)}
                                    className="bg-transparent text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer"
                                />
                            </div>

                            {canEditSchedule && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center bg-neutral-200/80 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-300/70 dark:border-neutral-700">
                                        {['6X1', '5X2'].map((mod) => (
                                            <button
                                                key={mod}
                                                type="button"
                                                onClick={() => {
                                                    setEscalaModel(mod);
                                                    handleGenerateSuggestionLoop(mod);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                    escalaModel === mod
                                                        ? 'bg-[#E3000F] text-white shadow-sm'
                                                        : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {mod}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGenerateSuggestionLoop(escalaModel)}
                                        className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                        title="Gerar nova sugestão automática de escala em loop"
                                    >
                                        <Sparkles size={14} className="text-[#E3000F]" />
                                        <span>Sugerir Escala ({escalaModel})</span>
                                        <RefreshCw size={13} className="ml-0.5 opacity-80" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="px-3.5 py-2 rounded-xl bg-[#107c41] hover:bg-[#0c5e31] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <FileSpreadsheet size={15} />
                                <span>Exportar Excel</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-black dark:hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <Printer size={15} />
                                <span>Imprimir</span>
                            </button>
                        </div>
                    </div>

                    {/* PLANILHA VISUAL DE ESCALA (MODELO OFICIAL POR TURNOS E SIGLAS) */}
                    <div className="flex-1 overflow-auto p-2 sm:p-4 bg-neutral-100/70 dark:bg-neutral-950/60 escala-print-root">
                        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-800 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-center whitespace-nowrap escala-sheet-table select-none">
                                    {/* CABEÇALHO DA PLANILHA: LOJA | MÊS | LETRAS E DIAS DO MÊS */}
                                    <thead>
                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="escala-col-nome bg-[#BFBFBF] dark:bg-neutral-800 text-neutral-950 dark:text-white font-black text-xs sm:text-sm uppercase px-3 py-2 border border-neutral-700 sticky left-0 z-20 min-w-[130px]"
                                            >
                                                {storeDisplayName}
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="escala-col-cargo bg-[#D9D9D9] dark:bg-neutral-800/90 text-neutral-950 dark:text-white font-black text-xs sm:text-sm uppercase px-3 py-2 border border-neutral-700 min-w-[155px]"
                                            >
                                                {currentMonthLabel}
                                            </th>
                                            {monthDaysList.map((d) => {
                                                const headerBg = d.isHoliday
                                                    ? 'bg-[#FFFF00] text-black'
                                                    : d.isWeekend
                                                        ? 'bg-[#0070C0] text-white'
                                                        : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100';
                                                return (
                                                    <th
                                                        key={`letter-${d.dateStr}`}
                                                        onClick={() => handleToggleHolidayColumn(d)}
                                                        title={canEditSchedule ? 'Clique para marcar/desmarcar este dia como Feriado (Amarelo)' : d.dayNameFull}
                                                        className={`px-1 py-1 text-[11px] sm:text-xs font-black border border-neutral-700 min-w-[30px] sm:min-w-[34px] cursor-pointer transition-opacity hover:opacity-85 ${headerBg}`}
                                                    >
                                                        {d.dayLetter}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            {monthDaysList.map((d) => {
                                                const numBg = d.isHoliday
                                                    ? 'bg-[#FFFF00] text-black'
                                                    : d.isWeekend
                                                        ? 'bg-[#0070C0] text-white'
                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100';
                                                return (
                                                    <th
                                                        key={`num-${d.dateStr}`}
                                                        onClick={() => handleToggleHolidayColumn(d)}
                                                        title={canEditSchedule ? 'Clique para marcar/desmarcar Feriado (Amarelo)' : `Dia ${d.dayNumber}`}
                                                        className={`px-1 py-1 text-[11px] sm:text-xs font-black border border-neutral-700 cursor-pointer ${numBg}`}
                                                    >
                                                        {d.dayNumber}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {groupedSections.map((sec) => (
                                            <React.Fragment key={sec.id}>
                                                {/* FAIXA SEPARADORA DE TURNO: Nome | CARGO | MANHA / INTERMEDIARIO / TARDE */}
                                                <tr className="bg-[#7F7F7F] dark:bg-neutral-800 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider">
                                                    <td className="px-2 py-1.5 border border-neutral-700 sticky left-0 z-10 bg-[#7F7F7F] dark:bg-neutral-800">
                                                        Nome
                                                    </td>
                                                    <td className="px-2 py-1.5 border border-neutral-700">
                                                        CARGO
                                                    </td>
                                                    <td
                                                        colSpan={monthDaysList.length}
                                                        className="px-3 py-1.5 border border-neutral-700 text-center font-black tracking-widest"
                                                    >
                                                        {sec.title}
                                                    </td>
                                                </tr>

                                                {/* LINHAS DOS COLABORADORES DO TURNO */}
                                                {sec.employees.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={2 + monthDaysList.length}
                                                            className="py-2 text-xs text-neutral-400 dark:text-neutral-500 italic border border-neutral-300 dark:border-neutral-800"
                                                        >
                                                            Nenhum colaborador alocado em {sec.title}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sec.employees.map((emp) => {
                                                        const isHighlightedRole = emp.group !== 'VENDEDOR';
                                                        const nameBg = isHighlightedRole
                                                            ? 'bg-[#D9D9D9] dark:bg-neutral-800 text-neutral-950 dark:text-white'
                                                            : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100';

                                                        return (
                                                            <tr key={emp.name} className="hover:brightness-95 transition-all">
                                                                {/* NOME DO COLABORADOR */}
                                                                <td
                                                                    className={`px-2.5 py-1.5 text-xs font-extrabold uppercase border border-neutral-500 dark:border-neutral-700 sticky left-0 z-10 ${nameBg}`}
                                                                >
                                                                    {getFirstName(emp.name)}
                                                                </td>

                                                                {/* CARGO + SELETOR RÁPIDO PARA MOVER ENTRE MANHÃ/INTERMEDIÁRIO/TARDE */}
                                                                <td
                                                                    className={`px-2 py-1 text-[11px] sm:text-xs font-bold border border-neutral-500 dark:border-neutral-700 ${nameBg}`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="truncate">{emp.friendlyRole}</span>
                                                                        {canEditSchedule && (
                                                                            <select
                                                                                value={sec.id}
                                                                                onChange={(e) => handleChangeEmployeeSection(emp.name, e.target.value)}
                                                                                className="no-print text-[10px] font-black bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 outline-none cursor-pointer"
                                                                                title="Alterar bloco de turno deste colaborador (Manhã, Intermediário ou Tarde)"
                                                                            >
                                                                                <option value="MANHA" className="bg-white text-black">M</option>
                                                                                <option value="INTERMEDIARIO" className="bg-white text-black">I</option>
                                                                                <option value="TARDE" className="bg-white text-black">T</option>
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* CÉLULAS DOS DIAS (1 A 30/31) COM SIGLAS */}
                                                                {monthDaysList.map((d) => {
                                                                    const sigla = getCellSigla(emp, d, sec.id);
                                                                    const cellTheme = getCellThemeClasses(d, sigla);

                                                                    return (
                                                                        <td
                                                                            key={`${emp.name}-${d.dateStr}`}
                                                                            className={`p-0 border text-xs sm:text-[13px] ${cellTheme}`}
                                                                        >
                                                                            {canEditSchedule ? (
                                                                                <select
                                                                                    value={sigla}
                                                                                    onChange={(e) => handleCellSiglaChange(emp.name, d.dateStr, e.target.value)}
                                                                                    className="w-full h-full py-1.5 px-0 bg-transparent text-center font-black outline-none cursor-pointer appearance-none"
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
                                                                            ) : (
                                                                                <span className="block py-1.5 px-0.5 font-black">
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

                            {/* RODAPÉ OFICIAL DA PLANILHA: LEGENDA DE SIGLAS + FAIXA AZUL "ESCALA SUJEITA A ALTERAÇÕES" */}
                            <div className="grid grid-cols-1 md:grid-cols-12 border-t-4 border-black dark:border-neutral-700">
                                <div className="md:col-span-4 lg:col-span-3 bg-white dark:bg-neutral-900 divide-y divide-neutral-300 dark:divide-neutral-800 border-b md:border-b-0 md:border-r border-neutral-700 text-[11px] font-extrabold uppercase">
                                    {[
                                        { label: 'FOLGA', code: 'F' },
                                        { label: 'ATESTADO', code: 'AT' },
                                        { label: 'FOLGA BANCO', code: 'FB' },
                                        { label: 'FOLGA PREMIO', code: 'FP' },
                                        { label: 'TREINAMENTO', code: 'TR' },
                                        { label: 'INTERMEDIARIO', code: 'I' },
                                        { label: 'MANHÃ / NOITE / TRABALHA', code: 'M / N / T' },
                                        { label: 'AFASTADA / FÉRIAS', code: 'AF / FE' }
                                    ].map((item) => (
                                        <div key={item.label} className="grid grid-cols-12 items-center">
                                            <div className="col-span-8 px-3 py-1 text-center text-neutral-800 dark:text-neutral-200 border-r border-neutral-300 dark:border-neutral-800">
                                                {item.label}
                                            </div>
                                            <div className="col-span-4 px-2 py-1 text-center font-black text-neutral-950 dark:text-white">
                                                {item.code}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="md:col-span-8 lg:col-span-9 bg-[#0070C0] text-white flex flex-col items-center justify-center p-4 text-center">
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
                                        ESCALA SUJEITA A ALTERAÇÕES
                                    </span>
                                    <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-blue-100 no-print">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm bg-[#0070C0] border border-white inline-block" /> Fim de Semana (Sáb/Dom)
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm bg-[#FFFF00] border border-black/40 inline-block" /> Feriado (Clique no dia no topo para marcar)
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
