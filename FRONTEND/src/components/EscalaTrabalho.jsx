import React, { useState, useEffect } from 'react';
import { Unlock, Lock, Printer, Edit3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { HORARIOS_PADRAO } from '../utils/constants';

const LOCAL_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const getLocalDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const SAFE_HORARIOS = ['09:40 - 18:00', '10:40 - 19:00', '11:40 - 20:00', '13:40 - 22:00', 'FOLGA'];

export const EscalaTrabalho = ({ canEditSchedule, scheduleData, setScheduleData, monthlyOverrides, setMonthlyOverrides, hasAccess, setAuthModal, usersDB = {} }) => {
    const SAFE_VENDEDORES = [...new Set(
        Object.values(usersDB || {})
            .filter(u => u?.role !== 'SUSPENDER')
            .map(u => String(u?.name || '').split(' ')[0])
            .filter(Boolean)
    )].sort();
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [editScheduleCell, setEditScheduleCell] = useState(null);
    const [editScheduleValue, setEditScheduleValue] = useState('');


    const getDailySchedule = (seller, year, month, day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if ((monthlyOverrides || {})[seller] && (monthlyOverrides || {})[seller][dateStr] !== undefined) {
            return (monthlyOverrides || {})[seller][dateStr];
        }
        const dateObj = new Date(year, month, day);
        const weekDayStr = LOCAL_WEEKDAYS[dateObj.getDay()];
        return (scheduleData || {})[seller]?.[weekDayStr] || '';
    };

    const handleScheduleClick = (seller, key, type, dateStr = null) => {
        if (!canEditSchedule) return;
        setEditScheduleCell({ seller, key, type, dateStr });
        if (type === 'WEEKLY') {
            setEditScheduleValue((scheduleData || {})[seller]?.[key] || '');
        } else {
            if ((monthlyOverrides || {})[seller] && (monthlyOverrides || {})[seller][dateStr] !== undefined) {
                setEditScheduleValue((monthlyOverrides || {})[seller][dateStr]);
            } else {
                setEditScheduleValue('__DEFAULT__');
            }
        }
    };

    const handleSaveScheduleCell = (e) => {
        e.preventDefault();
        if (!editScheduleCell) return;
        if (editScheduleCell.type === 'WEEKLY') {
            setScheduleData(prev => ({
                ...prev,
                [editScheduleCell.seller]: { ...prev[editScheduleCell.seller], [editScheduleCell.key]: editScheduleValue }
            }));
        } else {
            setMonthlyOverrides(prev => {
                const newOverrides = { ...prev };
                if (editScheduleValue === '__DEFAULT__') {
                    if (newOverrides[editScheduleCell.seller]) {
                        delete newOverrides[editScheduleCell.seller][editScheduleCell.dateStr];
                    }
                } else {
                    if (!newOverrides[editScheduleCell.seller]) newOverrides[editScheduleCell.seller] = {};
                    newOverrides[editScheduleCell.seller][editScheduleCell.dateStr] = editScheduleValue;
                }
                return newOverrides;
            });
        }
        setEditScheduleCell(null);
    };

    const handlePrintSchedule = () => window.print();

    const formatScheduleCell = (val) => {
        if (!val) return <span className="text-neutral-300 dark:text-neutral-600">-</span>;
        const v = String(val).toUpperCase();
        if (v === 'FOLGA') return <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded text-[10px] print:text-[8px] print:px-1 print:py-0.5 font-bold tracking-wide block">FOLGA</span>;
        if (v === 'FERIADO') return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded text-[10px] print:text-[8px] print:px-1 print:py-0.5 font-bold tracking-wide block">FERIADO</span>;
        if (v === 'FÉRIAS' || v === 'ATESTADO') return <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded text-[10px] print:text-[8px] print:px-1 print:py-0.5 font-bold tracking-wide block">{v}</span>;
        if (v === 'FALTA') return <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-1 rounded text-[10px] print:text-[8px] print:px-1 print:py-0.5 font-bold tracking-wide block">FALTA</span>;
        if (v === 'REDUZIDO') return <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded text-[10px] print:text-[8px] print:px-1 print:py-0.5 font-bold tracking-wide block">REDUZIDO</span>;
        return <span className="text-neutral-800 dark:text-neutral-200 font-bold text-[10px] print:text-[8px] leading-tight block">{v.replace(' - ', '\n')}</span>;
    };

    const goToPrevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));

    if (!hasAccess) {
        return (
            <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl h-full animate-fade-in transition-colors">
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                    <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Apenas contas de Gerente ou Sênior têm autorização para visualizar a escala de trabalho. (Edição restrita à Gerência).</p>
                    <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' })} className="px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Autenticar</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col min-h-full animate-fade-in print-schedule gap-6 print:block print:h-auto print:overflow-visible">

                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden print:overflow-visible flex flex-col shrink-0 transition-colors">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white dark:bg-neutral-900 print:p-2">
                        <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 flex flex-wrap items-center gap-2">
                            <span className="w-full sm:w-auto">Quadro Padrão de Escala Semanal</span>
                            {canEditSchedule ? (
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase sm:ml-2 no-print"><Unlock size={12} /> Edição Liberada</span>
                            ) : (
                                <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase sm:ml-2 no-print"><Lock size={12} /> Somente Leitura</span>
                            )}
                        </h2>
                        <div className="flex w-full md:w-auto gap-2 no-print">
                            <button onClick={handlePrintSchedule} className="w-full sm:w-auto justify-center px-4 py-2 bg-neutral-900 dark:bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-sm flex items-center gap-2" title="Use 'Salvar como PDF' na tela de impressão">
                                <Printer size={16} /> Exportar / Imprimir
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto print:overflow-visible bg-neutral-50/30 dark:bg-neutral-950/50 p-4 print:p-0">
                        <table className="w-full text-sm text-center whitespace-nowrap border-collapse border border-neutral-300 dark:border-neutral-800 shadow-sm print:text-[10px]">
                            <thead className="text-[11px] text-white uppercase bg-neutral-900 dark:bg-neutral-950 print:text-[10px]">
                                <tr>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider text-left bg-neutral-800 dark:bg-neutral-900 w-48 print:px-2 print:py-1">Colaborador</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider">Segunda-feira</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider">Terça-feira</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider">Quarta-feira</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider">Quinta-feira</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider">Sexta-feira</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider text-[#E3000F] bg-neutral-800 dark:bg-neutral-900">Sábado</th>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 font-bold tracking-wider text-[#E3000F] bg-neutral-800 dark:bg-neutral-900">Domingo</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900">
                                {SAFE_VENDEDORES.map((seller) => (
                                    <tr key={`weekly-${seller}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                        <td className="border border-neutral-200 dark:border-neutral-800 px-4 py-3 font-bold text-neutral-800 dark:text-neutral-200 text-left bg-neutral-50/50 dark:bg-neutral-800/50">
                                            {seller}
                                        </td>
                                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                                            <td
                                                key={`weekly-${seller}-${day}`}
                                                onClick={() => handleScheduleClick(seller, day, 'WEEKLY')}
                                                className={`border border-neutral-200 dark:border-neutral-800 px-3 py-3 print:px-1 print:py-1 relative ${canEditSchedule ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group' : ''}`}
                                            >
                                                {formatScheduleCell((scheduleData || {})[seller]?.[day])}
                                                {canEditSchedule && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50/80 dark:bg-blue-900/60 transition-opacity no-print">
                                                        <Edit3 size={16} className="text-blue-600" />
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden print:overflow-visible flex flex-col flex-1 shrink-0 print:mt-6">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white dark:bg-neutral-900 print:p-2">
                        <div className="w-full md:w-auto">
                            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                Escala Detalhada do Mês
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Visão diária. Clique em um dia para adicionar exceções à regra semanal (ex: Feriados, Férias).</p>
                        </div>
                        <div className="flex w-full sm:w-auto justify-between items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 shadow-sm">
                            <button onClick={goToPrevMonth} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 transition-colors flex-shrink-0">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-bold text-sm text-[#E3000F] uppercase tracking-wider min-w-[120px] text-center truncate">
                                {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={goToNextMonth} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 transition-colors flex-shrink-0">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto print:overflow-visible flex-1 bg-white dark:bg-neutral-900 p-4 print:p-0">
                        <table className="w-full text-sm text-center whitespace-nowrap border-collapse border border-neutral-300 dark:border-neutral-800 shadow-sm min-w-max print:min-w-0 print:text-[8px]">
                            <thead className="text-[11px] print:text-[8px] text-white uppercase bg-neutral-800 dark:bg-neutral-950 sticky top-0 z-20">
                                <tr>
                                    <th className="border border-neutral-700 dark:border-neutral-800 px-4 py-3 print:px-2 print:py-1 font-bold tracking-wider text-left bg-neutral-900 dark:bg-neutral-950 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Colaborador</th>
                                    {Array.from({ length: getLocalDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth()) }).map((_, i) => {
                                        const d = i + 1;
                                        const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
                                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                        return (
                                            <th key={`head-${d}`} className={`border border-neutral-700 px-2 py-2 min-w-[90px] print:min-w-0 print:px-1 print:py-1 ${isWeekend ? 'bg-[#C00000] text-white' : ''}`}>
                                                <div className="font-bold text-base leading-none">{d}</div>
                                                <div className={`text-[9px] mt-1 ${isWeekend ? 'text-red-100' : 'text-neutral-400 dark:text-neutral-500'}`}>{LOCAL_WEEKDAYS[dateObj.getDay()]}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900">
                                {SAFE_VENDEDORES.map((seller) => (
                                    <tr key={`month-${seller}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                        <td className="border border-neutral-200 dark:border-neutral-800 px-4 py-3 print:px-2 print:py-1 font-bold text-neutral-800 dark:text-neutral-200 text-left bg-neutral-50 dark:bg-neutral-800 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                                            {seller}
                                        </td>
                                        {Array.from({ length: getLocalDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth()) }).map((_, i) => {
                                            const d = i + 1;
                                            const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
                                            const dateStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                            return (
                                                <td
                                                    key={`month-${seller}-${d}`}
                                                    onClick={() => handleScheduleClick(seller, d, 'MONTHLY', dateStr)}
                                                    className={`border border-neutral-200 dark:border-neutral-800 px-1 py-2 print:px-0.5 print:py-0.5 relative ${isWeekend ? 'bg-red-50/30 dark:bg-red-900/10' : ''} ${canEditSchedule ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group' : ''}`}
                                                >
                                                    {formatScheduleCell(getDailySchedule(seller, currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d))}
                                                    {canEditSchedule && (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50/80 dark:bg-blue-900/60 transition-opacity no-print">
                                                            <Edit3 size={14} className="text-blue-600" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {editScheduleCell && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in transition-colors">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{editScheduleCell.type === 'WEEKLY' ? 'Editar Regra Semanal' : 'Criar Exceção no Dia'}</h2>
                                </div>
                                <button onClick={() => setEditScheduleCell(null)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSaveScheduleCell} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Horários Comuns</label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {SAFE_HORARIOS.map(h => (
                                            <button key={h} type="button" onClick={() => setEditScheduleValue(h)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === h ? 'bg-neutral-800 dark:bg-neutral-700 text-white border-neutral-800 dark:border-neutral-700' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>{h}</button>
                                        ))}
                                        {editScheduleCell.type === 'MONTHLY' && (
                                            <>
                                                <button type="button" onClick={() => setEditScheduleValue('FALTA')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === 'FALTA' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'}`}>FALTA</button>
                                                <button type="button" onClick={() => setEditScheduleValue('ATESTADO')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === 'ATESTADO' ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'}`}>ATESTADO</button>
                                                <button type="button" onClick={() => setEditScheduleValue('FÉRIAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === 'FÉRIAS' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'}`}>FÉRIAS</button>
                                                <button type="button" onClick={() => setEditScheduleValue('REDUZIDO')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === 'REDUZIDO' ? 'bg-teal-600 text-white border-teal-600' : 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/30'}`}>REDUZIDO</button>
                                                <button type="button" onClick={() => setEditScheduleValue('__DEFAULT__')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === '__DEFAULT__' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}>VOLTAR AO PADRÃO</button>
                                            </>
                                        )}
                                        <button type="button" onClick={() => setEditScheduleValue('')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === '' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'}`}>APAGAR HORÁRIO</button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ou digite outro horário / motivo</label>
                                    <input type="text" value={editScheduleValue === '__DEFAULT__' ? '' : editScheduleValue} onChange={e => setEditScheduleValue(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm uppercase" />
                                </div>
                                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                    <button type="button" onClick={() => setEditScheduleCell(null)} className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button>
                                    <button type="submit" className="w-full sm:w-auto justify-center px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};