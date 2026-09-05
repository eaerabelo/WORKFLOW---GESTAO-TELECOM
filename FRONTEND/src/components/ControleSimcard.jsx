import React, { useState, useEffect, useRef } from 'react';
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import { Lock, Unlock, FileSpreadsheet, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { applyDateShortMask, applyOvMask, applyCpfCnpjMask, applyCurrencyMask, getTodaySP } from '../utils/masks';

const formatPastedValue = (field, rawValue) => {
    if (!rawValue) return '';
    let val = rawValue.trim();
    if (field === 'simcardFisico' || field === 'simcardEsim') val = val.replace(/\D/g, '').slice(0, 20);
    else if (field === 'cpf') val = applyCpfCnpjMask(val);
    else if (field === 'valor') val = applyCurrencyMask(val);
    else if (field === 'data') val = applyDateShortMask(val);
    else if (field === 'ov' || field === 'plano' || field === 'cliente' || field === 'pagamento') val = val.toUpperCase();
    else if (field === 'dataPortin') {
        let v = val.replace(/\D/g, '');
        if (v.length > 10) v = v.slice(0, 10);
        let masked = v;
        if (v.length > 8) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6, 8)}:${v.slice(8, 10)}`;
        else if (v.length > 6) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6)}`;
        else if (v.length > 4) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        else if (v.length > 2) masked = `${v.slice(0, 2)}/${v.slice(2)}`;
        val = masked;
    }
    else if (field === 'numPortado' || field === 'numProvisorio') {
        let v = val.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        let masked = v;
        if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        val = masked;
    }
    return val;
};

const getColumns = (tab, isFisico) => {
    const iccidField = isFisico ? 'simcardFisico' : 'simcardEsim';
    if (tab === 'SOBREPOSIÇÃO') {
        return [iccidField, 'data', 'dataPortin', 'numPortado', 'numProvisorio', 'ov', 'codAutorizacao', 'cpf', 'plano', 'cliente', 'observacao'];
    } else if (tab === 'ESTOQUE TVBOX') {
        return ['caid', 'data', 'vendedor', 'cliente', 'cpf', 'observacao'];
    } else if (tab === 'ACOMPANHAR') {
        return [iccidField, 'data', 'vendedor', 'ov', 'codAutorizacao', 'cpf', 'plano', 'cliente', 'observacao'];
    } else {
        return [iccidField, 'data', 'ov', 'codAutorizacao', 'cpf', 'plano', 'cliente', 'pagamento', 'valor', 'observacao'];
    }
};

const CellInput = ({ value, onCommit, onCancel, placeholder, className, maskType, autoFocus }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const latestValue = useRef(value || '');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setLocalValue(value || '');
            latestValue.current = value || '';
        }
    }, [value, isFocused]);

    const handleChange = (e) => {
        let val = e.target.value;
        if (maskType === 'iccid') val = val.replace(/\D/g, '').slice(0, 20);
        else if (maskType === 'cpf') val = applyCpfCnpjMask(val);
        else if (maskType === 'valor') val = applyCurrencyMask(val);
        else if (maskType === 'data') val = applyDateShortMask(val);
        else if (maskType === 'upper') val = val.toUpperCase();
        else if (maskType === 'dataPortin') {
            let v = val.replace(/\D/g, '');
            if (v.length > 10) v = v.slice(0, 10);
            let masked = v;
            if (v.length > 8) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6, 8)}:${v.slice(8, 10)}`;
            else if (v.length > 6) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6)}`;
            else if (v.length > 4) masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
            else if (v.length > 2) masked = `${v.slice(0, 2)}/${v.slice(2)}`;
            val = masked;
        }
        else if (maskType === 'telefone') {
            let v = val.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            let masked = v;
            if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            val = masked;
        }
        setLocalValue(val);
        latestValue.current = val;
    };

    const handleBlur = () => {
        setIsFocused(false);
        onCommit(latestValue.current);
        if (onCancel) onCancel();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setLocalValue(value || '');
            latestValue.current = value || '';
            e.target.blur();
        }
    };

    return (
        <input
            type="text"
            value={isFocused ? localValue : (value || '')}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            autoFocus={autoFocus}
        />
    );
};

const EditableCell = ({ item, idx, colIdx, field, value, tipoLote, canModifySimcard, maskType, selection, setSelection, isDragging, setIsDragging, editingCell, setEditingCell, handleInlineChange, handleProtectedClick, className = '', placeholder = '', align = 'left', showLock = false }) => {
    const isSelected = selection.type === tipoLote && 
        selection.startRow !== null && selection.endRow !== null &&
        selection.startCol !== null && selection.endCol !== null &&
        idx >= Math.min(selection.startRow, selection.endRow) && 
        idx <= Math.max(selection.startRow, selection.endRow) &&
        colIdx >= Math.min(selection.startCol, selection.endCol) &&
        colIdx <= Math.max(selection.startCol, selection.endCol);

    const isProtectedField = field === 'simcardFisico' || field === 'simcardEsim';
    const isEditing = editingCell?.id === item.id && editingCell?.type === tipoLote && editingCell?.field === field && (!isProtectedField || canModifySimcard);

    const handleCommit = (newVal) => {
        handleInlineChange(item.id, field, newVal);
    };

    let justify = 'justify-start';
    if (align === 'center') justify = 'justify-center';
    else if (align === 'right') justify = 'justify-end';

    return (
        <td 
            className={`border border-neutral-200 dark:border-neutral-800 p-0 relative selectable-cell ${isSelected && !isEditing ? 'bg-red-100 dark:bg-red-900/40 ring-inset ring-2 ring-red-500 z-10' : ''}`}
            onMouseDown={(e) => {
                if (e.target.closest('input') || e.target.closest('select') || e.target.closest('svg') || isEditing) return;
                
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
                window.getSelection()?.removeAllRanges();

                setIsDragging(true);
                setSelection({ type: tipoLote, startRow: idx, endRow: idx, startCol: colIdx, endCol: colIdx });
                setEditingCell(null);
            }}
            onMouseEnter={() => {
                if (isDragging && selection.type === tipoLote) {
                    setSelection(prev => ({ ...prev, endRow: idx, endCol: colIdx }));
                }
            }}
            onDoubleClick={() => {
                if (isProtectedField && !canModifySimcard) {
                    if (handleProtectedClick) handleProtectedClick();
                    return;
                }
                if (selection.startRow === selection.endRow && selection.startCol === selection.endCol) {
                    setEditingCell({ id: item.id, type: tipoLote, field });
                }
            }}
        >
            {isEditing ? (
                <CellInput 
                    value={value} 
                    onCommit={handleCommit} 
                    onCancel={() => setEditingCell(null)}
                    maskType={maskType} 
                    placeholder={placeholder} 
                    className={`w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-red-50 dark:focus:bg-red-900/20 focus:ring-inset focus:ring-2 focus:ring-[#E3000F] text-xs text-${align} ${className}`}
                    autoFocus={true}
                />
            ) : (
                <div className={`w-full h-full min-h-[36px] px-3 py-1.5 text-xs flex items-center ${justify} ${(!canModifySimcard && isProtectedField) ? 'text-neutral-500 dark:text-neutral-400 opacity-60' : 'text-neutral-800 dark:text-neutral-200'} ${isSelected ? 'text-red-800 dark:text-red-200' : ''} cursor-cell select-none ${className} overflow-hidden whitespace-nowrap`}>
                    {value || ''}
                </div>
            )}
            {showLock && !canModifySimcard && isProtectedField && value && <Lock size={12} onClick={handleProtectedClick} title="Desbloquear Edição" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 cursor-pointer hover:text-[#E3000F] transition-colors" />}
        </td>
    );
};

const SelectableCell = ({ item, idx, colIdx, field, value, tipoLote, canModifySimcard, selection, setSelection, isDragging, setIsDragging, handleInlineChange }) => {
    const isSelected = selection.type === tipoLote && 
        selection.startRow !== null && selection.endRow !== null &&
        selection.startCol !== null && selection.endCol !== null &&
        idx >= Math.min(selection.startRow, selection.endRow) && 
        idx <= Math.max(selection.startRow, selection.endRow) &&
        colIdx >= Math.min(selection.startCol, selection.endCol) &&
        colIdx <= Math.max(selection.startCol, selection.endCol);

    return (
        <td 
            className={`border border-neutral-200 dark:border-neutral-800 p-0 relative selectable-cell ${isSelected ? 'bg-red-100 dark:bg-red-900/40 ring-inset ring-2 ring-red-500 z-10' : ''}`}
            onMouseDown={(e) => {
                if (e.target.closest('select')) return;

                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
                window.getSelection()?.removeAllRanges();

                setIsDragging(true);
                setSelection({ type: tipoLote, startRow: idx, endRow: idx, startCol: colIdx, endCol: colIdx });
            }}
            onMouseEnter={() => {
                if (isDragging && selection.type === tipoLote) {
                    setSelection(prev => ({ ...prev, endRow: idx, endCol: colIdx }));
                }
            }}
        >
            <select 
                value={value || ''} 
                onChange={e => handleInlineChange(item.id, field, e.target.value)} 
                className="w-full h-full min-h-[36px] px-2 py-1.5 bg-transparent outline-none focus:bg-red-50 dark:focus:bg-red-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase disabled:opacity-80"
            >
                <option className="bg-white dark:bg-neutral-900" value=""></option>
                <option className="bg-white dark:bg-neutral-900" value="LPAY">LPAY</option>
                <option className="bg-white dark:bg-neutral-900" value="PIX">PIX</option>
                <option className="bg-white dark:bg-neutral-900" value="LINK DE PAGAMENTO">LINK DE PAGAMENTO</option>
                <option className="bg-white dark:bg-neutral-900" value="DINHEIRO">DINHEIRO</option>
                <option className="bg-white dark:bg-neutral-900" value="DOA">DOA</option>
            </select>
        </td>
    );
};

export const ControleSimcard = ({ simcardsData, setSimcardsData, canModifySimcard, globalUser, setAuthModal, usersDB = {} }) => {
    const safeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || ""))
        .filter(Boolean);

    const [simcardActiveTab, setSimcardActiveTab] = useState(() => {
        if (globalUser?.role === 'VENDEDOR' && globalUser?.name) {
            const sellerFullName = String(globalUser.name || "");
            if (safeVendedores.includes(sellerFullName)) return sellerFullName;
        }
        return 'GESTAO';
    });
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchData, setBatchData] = useState({ fisicos: '', esims: '', caids: '', data: getTodaySP() });

    const [selection, setSelection] = useState({ type: null, startRow: null, endRow: null, startCol: null, endCol: null, isFisico: null });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (isBatchModalOpen) {
            setBatchData({ fisicos: '', esims: '', caids: '', data: getTodaySP() });
        }
    }, [isBatchModalOpen]);

    const [editingCell, setEditingCell] = useState(null);
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
    const selectionRef = useRef({ selection: null, data: null, currentTab: null, canModifySimcard, isFisico: null });

    const dynamicTabs = ['GESTAO', ...safeVendedores, 'SOBREPOSIÇÃO', 'ACOMPANHAR', 'ESTOQUE TVBOX'];
    const currentTab = dynamicTabs.includes(simcardActiveTab) ? simcardActiveTab : (dynamicTabs[0] || 'GESTAO');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isBatchModalOpen) {
                setIsBatchModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBatchModalOpen]);

    useEffect(() => {
        selectionRef.current = { selection, simcardsData, currentTab, canModifySimcard, isFisico: selection?.type === 'FÍSICO' };
    }, [selection, simcardsData, currentTab, canModifySimcard, selection?.type]);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        const handleClickOutside = (e) => {
            if (!e.target.closest('.selectable-cell')) {
                setSelection({ type: null, startRow: null, endRow: null, startCol: null, endCol: null });
                setEditingCell(null);
            }
        };
        
        const handleKeyDown = (e) => {
            const { selection, simcardsData, currentTab, canModifySimcard, isFisico } = selectionRef.current;
            
            if (selection && selection.type && selection.startRow !== null && selection.endRow !== null && selection.startCol !== null && selection.endCol !== null) {
                const startRow = Math.min(selection.startRow, selection.endRow);
                const endRow = Math.max(selection.startRow, selection.endRow);
                const startCol = Math.min(selection.startCol, selection.endCol);
                const endCol = Math.max(selection.startCol, selection.endCol);
                
                const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
                const isEditingCell = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

                if (!isEditingCell) {
                    const key = e.key || '';
                    const code = e.code || '';
                    const isDelete = key === 'Delete' || key === 'Backspace' || key === 'Del' || code === 'Delete' || code === 'Backspace' || e.keyCode === 8 || e.keyCode === 46;

                    // Ação de APAGAR (DELETE / BACKSPACE) com validação
                    if (isDelete) {
                        e.preventDefault();

                        let cols = getColumns(currentTab, isFisico).slice(startCol, endCol + 1);
                        
                        if (!canModifySimcard) {
                            const hasProtectedCol = cols.some(col => col === 'simcardFisico' || col === 'simcardEsim' || col === 'caid');
                            if (hasProtectedCol) {
                                toast.error('Acesso restrito: ICCIDs mantidos. Apagando demais campos...');
                                cols = cols.filter(col => col !== 'simcardFisico' && col !== 'simcardEsim');
                            }
                        }

                        if (cols.length === 0) return;

                        setSimcardsData(prev => {
                            const currentFiltered = (prev || []).filter(item => {
                                if (currentTab === 'ESTOQUE TVBOX') return item.owner === currentTab;
                                if (item.owner !== currentTab) return false;
                                if (isFisico) {
                                    return item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
                                } else {
                                    return item.simcardEsim && !item.simcardFisico;
                                }
                            });

                            const itemsToUpdate = currentFiltered.slice(startRow, endRow + 1);
                            if (itemsToUpdate.length === 0) return prev;
                            
                            const itemsToUpdateIds = itemsToUpdate.map(i => i.id);

                            return prev.map(item => {
                                if (itemsToUpdateIds.includes(item.id)) {
                                    const updates = {};
                                    cols.forEach(col => updates[col] = '');
                                    return { ...item, ...updates };
                                }
                                return item;
                            });
                        });
                        toast.success(`${(endRow - startRow + 1) * cols.length} item(ns) apagado(s)!`);
                        return;
                    }

                    // Ação de EDITAR (ENTER)
                    if (e.key === 'Enter' && startRow === endRow && startCol === endCol) {
                        e.preventDefault();
                        const cols = getColumns(currentTab, isFisico);
                        const field = cols[startCol];
                        
                        const isProtected = field === 'simcardFisico' || field === 'simcardEsim' || field === 'caid';
                        if (isProtected && !canModifySimcard) {
                            toast.error('Acesso restrito: Você não tem permissão para editar ICCIDs.');
                            return;
                        }

                        const items = (simcardsData || []).filter(item => {
                            if (item.owner !== currentTab) return false;
                            if (currentTab === 'ESTOQUE TVBOX') return true;
                            return isFisico ? (item.simcardFisico || (!item.simcardFisico && !item.simcardEsim)) : (item.simcardEsim && !item.simcardFisico);
                        });
                        if (items[startRow]) {
                            setEditingCell({ id: items[startRow].id, type: selection.type, field });
                        }
                    }

                    if (e.ctrlKey || e.metaKey) {
                        // Ação de COPIAR Múltiplas células (CTRL+C)
                        if (e.key.toLowerCase() === 'c') {
                            e.preventDefault();
                            const filteredData = (simcardsData || []).filter(item => {
                                if (currentTab === 'ESTOQUE TVBOX') return item.owner === currentTab;
                                if (item.owner !== currentTab) return false;
                                if (isFisico) {
                                    return item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
                                } else {
                                    return item.simcardEsim && !item.simcardFisico;
                                }
                            });

                            const selectedItems = filteredData.slice(startRow, endRow + 1);
                            const cols = getColumns(currentTab, isFisico).slice(startCol, endCol + 1);
                            
                            const textToCopy = selectedItems.map(item => {
                                return cols.map(col => item[col] || '').join('\t');
                            }).join('\n');
                            
                            if (textToCopy) {
                                navigator.clipboard.writeText(textToCopy);
                                toast.success(`${selectedItems.length * cols.length} item(ns) copiado(s)!`);
                            }
                        }

                        // Ação de COLAR para Múltiplas Células (CTRL+V) - Liberado com Proteção
                        if (e.key.toLowerCase() === 'v') {
                            let cols = getColumns(currentTab, isFisico).slice(startCol, endCol + 1);
                            
                            if (!canModifySimcard) {
                                const hasProtectedCol = cols.some(col => col === 'simcardFisico' || col === 'simcardEsim' || col === 'caid');
                                if (hasProtectedCol) {
                                    toast.error('Acesso restrito: Colagem em ICCIDs ignorada.');
                                    cols = cols.map(col => (col === 'simcardFisico' || col === 'simcardEsim') ? null : col);
                                }
                            }

                            e.preventDefault();
                            navigator.clipboard.readText().then(text => {
                                if (!text) return;
                                const pastedLines = text.split(/\r?\n/).filter(line => line.trim() !== '' || line.includes('\t'));
                                if (pastedLines.length === 0) return;
                                

                                setSimcardsData(prev => {
                                    const currentFiltered = (prev || []).filter(item => {
                                        if (currentTab === 'ESTOQUE TVBOX') return item.owner === currentTab;
                                        if (item.owner !== currentTab) return false;
                                        if (isFisico) {
                                            return item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
                                        } else {
                                            return item.simcardEsim && !item.simcardFisico;
                                        }
                                    });

                                    const itemsToUpdate = currentFiltered.slice(startRow, startRow + pastedLines.length);
                                    if (itemsToUpdate.length === 0) return prev;
                                    
                                    const itemsToUpdateIds = itemsToUpdate.map(i => i.id);
                                    toast.success(`${Math.min(itemsToUpdate.length, pastedLines.length) * cols.length} item(ns) colado(s)!`);

                                    return prev.map(item => {
                                        const rowIdx = itemsToUpdateIds.indexOf(item.id);
                                        if (rowIdx !== -1 && pastedLines[rowIdx] !== undefined) {
                                            const pastedCells = pastedLines[rowIdx].split('\t');
                                            const updates = {};
                                            cols.forEach((col, cIdx) => {
                                                if (col !== null && pastedCells[cIdx] !== undefined) {
                                                    updates[col] = formatPastedValue(col, pastedCells[cIdx]);
                                                }
                                            });
                                            return { ...item, ...updates };
                                        }
                                        return item;
                                    });
                                });
                            }).catch(() => {
                                toast.error('O seu navegador bloqueou o acesso à área de transferência.');
                            });
                        }
                    }
                }
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleBatchSubmit = (e) => {
        e.preventDefault(); 
        const linhasFisico = batchData.fisicos.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasEsim = batchData.esims.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasCaid = (batchData.caids || '').split('\n').map(l => l.trim()).filter(l => l);

        if (currentTab === 'ESTOQUE TVBOX') {
            if (linhasCaid.length === 0) return;
        } else {
            if (linhasFisico.length === 0 && linhasEsim.length === 0) return;
        }

        let shortDate = '';
        if (batchData.data) {
            const [yyyy, mm, dd] = batchData.data.split('-');
            if (yyyy && mm && dd) shortDate = `${dd}/${mm}/${yyyy.slice(2)}`;
        }

        const novosRegistros = [];
        const baseId = -Date.now() * 1000;

        if (currentTab === 'ESTOQUE TVBOX') {
            linhasCaid.forEach((linha, i) => {
                novosRegistros.push({
                    id: baseId - i,
                    owner: currentTab,
                    caid: linha,
                    data: shortDate,
                    vendedor: '', cliente: '', cpf: '', observacao: ''
                });
            });
        } else {
            linhasFisico.forEach((linha, i) => {
                novosRegistros.push({
                    id: baseId - i,
                    owner: currentTab,
                    simcardFisico: linha,
                    simcardEsim: '',
                    data: shortDate, ov: '', codAutorizacao: '', cpf: '', plano: '', cliente: '', pagamento: '', valor: 'R$ 15,00', observacao: '',
                    dataPortin: '', numPortado: '', numProvisorio: ''
                });
            });

            linhasEsim.forEach((linha, i) => {
                novosRegistros.push({
                    id: baseId - linhasFisico.length - i,
                    owner: currentTab,
                    simcardFisico: '',
                    simcardEsim: linha,
                    data: shortDate, ov: '', codAutorizacao: '', cpf: '', plano: '', cliente: '', pagamento: '', valor: 'R$ 15,00', observacao: '',
                    dataPortin: '', numPortado: '', numProvisorio: ''
                });
            });
        }

        setSimcardsData(prev => [...prev, ...novosRegistros]);
        setIsBatchModalOpen(false);
        setBatchData({ fisicos: '', esims: '', data: getTodaySP() });
    };

    const handleInlineChange = (id, field, value) => {
        if ((field === 'simcardFisico' || field === 'simcardEsim' || field === 'caid') && !canModifySimcard) return;
        setSimcardsData(prev => prev.map(item => {
            if (item.id === id) {
                let newValue = value;
                if (field === 'cpf') newValue = applyCpfCnpjMask(value);
                if (field === 'valor') newValue = applyCurrencyMask(value);
                if (field === 'simcardFisico' || field === 'simcardEsim') newValue = value.replace(/\D/g, '').slice(0, 20);
                if (field === 'data') newValue = applyDateShortMask(value);
                if (field === 'ov' || field === 'plano') newValue = value.toUpperCase();
                if (field === 'dataPortin') {
                    let v = value.replace(/\D/g, '');
                    if (v.length > 10) v = v.slice(0, 10);
                    let masked = v;
                    if (v.length > 8) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6, 8)}:${v.slice(8, 10)}`;
                    } else if (v.length > 6) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6)}`;
                    } else if (v.length > 4) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                    } else if (v.length > 2) {
                        masked = `${v.slice(0, 2)}/${v.slice(2)}`;
                    }
                    newValue = masked;
                }
                if (field === 'numPortado' || field === 'numProvisorio') {
                    let v = value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    let masked = v;
                    if (v.length > 7) {
                        masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                    } else if (v.length > 2) {
                        masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    }
                    newValue = masked;
                }
                return { ...item, [field]: newValue };
            }
            return item;
        }));
    };

    const handleDeleteRequest = (id) => {
        if (canModifySimcard) { setSimcardsData(prev => prev.filter(item => item.id !== id)); }
        else { setAuthModal({ isOpen: true, pendingAction: 'DELETE', pendingId: id, requiredRole: 'SENIOR' }); }
    };

    const handleProtectedClick = () => {
        if (!canModifySimcard) setAuthModal({ isOpen: true, pendingAction: 'UNLOCK', pendingId: null, requiredRole: 'SENIOR' });
    };

    const handleChangeColor = (id, newColor) => {
        if (!canModifySimcard) return;
        setSimcardsData(prev => prev.map(item => {
            if (item.id === id) {
                // Ao marcar vermelho ou amarelo, move automaticamente para a aba ACOMPANHAR (para limpar as tabelas)
                if ((newColor === 'red' || newColor === 'yellow') && item.owner !== 'ACOMPANHAR' && item.owner !== 'SOBREPOSIÇÃO' && item.owner !== 'ESTOQUE TVBOX') {
                    toast.success('Movido automaticamente para a aba ACOMPANHAR!');
                    const obsSuffix = item.vendedor ? `(De: ${getFirstName(item.vendedor)})` : `(De: ${item.owner})`;
                    const sep = item.observacao ? ' ' : '';
                    return { ...item, statusColor: newColor, owner: 'ACOMPANHAR', observacao: (item.observacao || '') + sep + obsSuffix };
                }
                return { ...item, statusColor: newColor };
            }
            return item;
        }));
    };

    const handleExportExcel = () => {
        const filteredData = (simcardsData || []).filter(item => item.owner === currentTab);

        if (filteredData.length === 0) {
            toast.error('Nenhum dado para exportar na aba atual.');
            return;
        }

        const dataToExport = filteredData.map(item => {
            const isFisico = item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
            if (currentTab === 'ESTOQUE TVBOX') {
                return {
                    'CAID': item.caid,
                    'Data Entrada': item.data,
                    'Vendedor': item.vendedor || '-',
                    'Cliente': item.cliente || '-',
                    'CPF | CNPJ': item.cpf || '-',
                    'Observação': item.observacao || '-'
                };
            }
            if (currentTab === 'SOBREPOSIÇÃO') {
                return {
                    'SIMCARD/E-SIM': isFisico ? item.simcardFisico : item.simcardEsim,
                    'Data': item.data,
                    'Data Portin': item.dataPortin || '-',
                    'Nº Portado': item.numPortado || '-',
                    'Nº Provisório': item.numProvisorio || '-',
                    'OV': item.ov,
                    'Cód. Aut.': item.codAutorizacao,
                    'CPF | CNPJ': item.cpf,
                    'Plano': item.plano,
                    'Cliente': item.cliente,
                    'Observação': item.observacao || '-'
                };
            } else if (currentTab === 'ACOMPANHAR') {
                return {
                    'SIMCARD/E-SIM': isFisico ? item.simcardFisico : item.simcardEsim,
                    'Data': item.data,
                    'Vendedor': item.vendedor || '-',
                    'OV': item.ov,
                    'Cód. Aut.': item.codAutorizacao,
                    'CPF | CNPJ': item.cpf,
                    'Plano': item.plano,
                    'Cliente': item.cliente,
                    'Observação (Problema)': item.observacao || '-'
                };
            } else {
                return {
                    'SIMCARD/E-SIM': isFisico ? item.simcardFisico : item.simcardEsim,
                    'Data': item.data,
                    'OV': item.ov,
                    'Cód. Aut.': item.codAutorizacao,
                    'CPF | CNPJ': item.cpf,
                    'Plano': item.plano,
                    'Cliente': item.cliente,
                    'Pagamento': item.pagamento || '-',
                    'Valor': item.valor || '-',
                    'Observação': item.observacao || '-'
                };
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, currentTab);
        XLSX.writeFile(workbook, `Relatorio_Simcards_${currentTab}.xlsx`);
        toast.success('Relatório exportado com sucesso!');
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full animate-fade-in transition-colors">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-neutral-900 shrink-0">
                    <h2 
                        onDoubleClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
                        className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 cursor-pointer select-none hover:text-[#E3000F] transition-colors"
                        title="Duplo clique para expandir/recolher as opções"
                    >
                        Controle de Estoque e SIM Cards
                        {canModifySimcard ? (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2"><Unlock size={12} /> Edição Liberada</span>
                        ) : (
                            <span onClick={handleProtectedClick} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors" title="Desbloquear Edição"><Lock size={12} /> Acesso Restrito</span>
                        )}
                    </h2>
                    {!isOptionsCollapsed && (
                        <div className="flex gap-2">
                            {!globalUser && (
                                <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null })} className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"><Lock size={14} /> Autenticar</button>
                            )}
                            {canModifySimcard && (
                                <>
                                    <button type="button" onClick={handleExportExcel} className="px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center gap-2">Exportar Excel</button>
                                    <button onClick={() => setIsBatchModalOpen(true)} className="px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center gap-2"><FileSpreadsheet size={16} /> + Lote</button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex overflow-x-auto bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 scrollbar-hide shrink-0" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                    {dynamicTabs.map(tab => (
                        <button key={tab} onClick={() => setSimcardActiveTab(tab)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-[3px] ${currentTab === tab ? "border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900" : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}>{["GESTAO", "SOBREPOSIÇÃO", "ACOMPANHAR", "ESTOQUE TVBOX"].includes(tab) ? tab : getFirstName(tab)}</button>
                    ))}
                </div>

                <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 shrink-0 overflow-x-auto scrollbar-hide no-print">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 mr-1">Status:</span>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 w-max">
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div> Em Processo de Baixa SAP</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div> Chip Não Localizado SAP</span>
                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div> Corrigido / Processado</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-auto flex-1 bg-neutral-50/20 dark:bg-neutral-950/50 flex flex-col">
                    {currentTab === 'ESTOQUE TVBOX' ? (
                        <div>
                            <div className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2 font-bold uppercase text-xs sticky left-0 border-y border-neutral-300 dark:border-neutral-700 shadow-sm">
                                CAID: TV BOX
                            </div>
                            <table className="w-full text-sm text-left whitespace-nowrap border-collapse border border-neutral-300 dark:border-neutral-800">
                                <thead className="text-[11px] text-white uppercase bg-[#C00000] dark:bg-red-900 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-44 min-w-[176px]">CAID</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Data Entrada</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Vendedor</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Cliente</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">CPF | CNPJ</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Observação</th>
                                        <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-neutral-900">
                                    {(simcardsData || []).filter(item => item.owner === currentTab).length === 0 ? (
                                        <tr><td colSpan="7" className="text-center py-6 text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 font-medium">Nenhum TV BOX em estoque.</td></tr>
                                    ) : (
                                        (simcardsData || []).filter(item => item.owner === currentTab).map((item, idx) => (
                                            <tr key={item.id} className={`transition-colors group hover:bg-red-50/40 dark:hover:bg-red-900/20`}>
                                                <EditableCell item={item} idx={idx} colIdx={0} field="caid" value={item.caid} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} maskType="upper" className="font-mono text-xs" showLock={true} />
                                                <EditableCell item={item} idx={idx} colIdx={1} field="data" value={item.data} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} maskType="data" placeholder="DD/MM/AA" align="center" className="text-neutral-600 dark:text-neutral-400" />
                                                <EditableCell item={item} idx={idx} colIdx={2} field="vendedor" value={item.vendedor ? item.vendedor.split(' ')[0] : ''} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} maskType="upper" className="font-bold uppercase text-neutral-800 dark:text-neutral-200" />
                                                <EditableCell item={item} idx={idx} colIdx={3} field="cliente" value={item.cliente} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} maskType="upper" className="uppercase text-neutral-800 dark:text-neutral-200" />
                                                <EditableCell item={item} idx={idx} colIdx={4} field="cpf" value={item.cpf} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} maskType="cpf" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                <EditableCell item={item} idx={idx} colIdx={5} field="observacao" value={item.observacao} tipoLote="TVBOX" canModifySimcard={canModifySimcard} selection={selection} setSelection={setSelection} isDragging={isDragging} setIsDragging={setIsDragging} editingCell={editingCell} setEditingCell={setEditingCell} handleInlineChange={handleInlineChange} handleProtectedClick={handleProtectedClick} className="text-neutral-600 dark:text-neutral-400" />
                                                <td className="border border-neutral-200 dark:border-neutral-800 p-0 text-center align-middle"><button onClick={() => handleDeleteRequest(item.id)} className={`flex items-center justify-center transition-colors w-full h-full ${canModifySimcard ? 'text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded' : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400'}`} title={canModifySimcard ? "Excluir Linha" : "Autenticação Necessária"}>{canModifySimcard ? <Trash2 size={14} /> : <Lock size={12} />}</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        ['FÍSICO', 'VIRTUAL (E-SIM)'].map((tipoLote, idx) => {
                            const isFisico = tipoLote === 'FÍSICO';
                            const filteredData = (simcardsData || []).filter(item => {
                                if (item.owner !== currentTab) return false;
                                if (isFisico) {
                                    return item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
                                } else {
                                    return item.simcardEsim && !item.simcardFisico;
                                }
                            });

                            return (
                                <div key={tipoLote} className={`${idx > 0 ? 'mt-8' : ''}`}>
                                    <div className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2 font-bold uppercase text-xs sticky left-0 border-y border-neutral-300 dark:border-neutral-700 shadow-sm">
                                        ICCID: {tipoLote}
                                    </div>
                                    <table className="w-full text-sm text-left whitespace-nowrap border-collapse border border-neutral-300 dark:border-neutral-800">
                                        <thead className="text-[11px] text-white uppercase bg-[#C00000] dark:bg-red-900 sticky top-0 z-10 shadow-sm">
                                            {currentTab === 'SOBREPOSIÇÃO' ? (
                                                <tr>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-44 min-w-[176px]">{isFisico ? 'SIMCARD Físico' : 'E-SIM Virtual'}</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Data</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-36 min-w-[144px]">Data Portin</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Nº Portado</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Nº Provisório</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-20 min-w-[80px]">OV</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Cód. Aut.</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">CPF | CNPJ</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Plano</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Cliente</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Observação</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Ações</th>
                                                </tr>
                                            ) : currentTab === 'ACOMPANHAR' ? (
                                                <tr>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-44 min-w-[176px]">{isFisico ? 'SIMCARD Físico' : 'E-SIM Virtual'}</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Data</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Vendedor</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-20 min-w-[80px]">OV</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Cód. Aut.</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">CPF | CNPJ</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Plano</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Cliente</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Observação (Problema)</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Ações</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-44 min-w-[176px]">{isFisico ? 'SIMCARD Físico' : 'E-SIM Virtual'}</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Data</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-20 min-w-[80px]">OV</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Cód. Aut.</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">CPF | CNPJ</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Plano</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Cliente</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-28 min-w-[112px]">Pagamento</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-24 min-w-[96px]">Valor</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-64 min-w-[256px]">Observação</th>
                                                    <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-32 min-w-[128px]">Ações</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody className="bg-white dark:bg-neutral-900">
                                            {filteredData.length === 0 ? (
                                                <tr><td colSpan="12" className="text-center py-6 text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 font-medium">Nenhum registro encontrado nesta seção.</td></tr>
                                            ) : (
                                                filteredData.map((item, idx) => {
                                                    const val = isFisico ? item.simcardFisico : item.simcardEsim;
                                                    const commonProps = { item, idx, tipoLote, canModifySimcard, selection, setSelection, isDragging, setIsDragging, editingCell, setEditingCell, handleInlineChange, handleProtectedClick };
                                                    const iccidField = isFisico ? 'simcardFisico' : 'simcardEsim';

                                                    return (
                                                        <tr key={item.id} className={`transition-colors group ${item.statusColor === 'green' ? 'bg-green-200 dark:bg-green-900/40 hover:bg-green-300/60 dark:hover:bg-green-900/60' :
                                                            item.statusColor === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-900/40 hover:bg-yellow-300/60 dark:hover:bg-yellow-900/60' :
                                                                item.statusColor === 'red' ? 'bg-red-200 dark:bg-red-900/40 hover:bg-red-300/60 dark:hover:bg-red-900/60' :
                                                                    'hover:bg-red-50/40 dark:hover:bg-red-900/20'
                                                            }`}>
                                                            <EditableCell {...commonProps} field={iccidField} colIdx={0} value={val} maskType="iccid" className="font-mono text-xs" showLock={true} />
                                                            <EditableCell {...commonProps} field="data" colIdx={1} value={item.data} maskType="data" placeholder="DD/MM/AA" align="center" className="text-neutral-600 dark:text-neutral-400" />
                                                            {currentTab === 'SOBREPOSIÇÃO' && (
                                                                <>
                                                                    <EditableCell {...commonProps} field="dataPortin" colIdx={2} value={item.dataPortin} maskType="dataPortin" align="center" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                                    <EditableCell {...commonProps} field="numPortado" colIdx={3} value={item.numPortado} maskType="telefone" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                                    <EditableCell {...commonProps} field="numProvisorio" colIdx={4} value={item.numProvisorio} maskType="telefone" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                                </>
                                                            )}
                                                            {currentTab === 'ACOMPANHAR' && (
                                                                <EditableCell {...commonProps} field="vendedor" colIdx={2} value={item.vendedor ? item.vendedor.split(' ')[0] : ''} maskType="upper" className="font-bold uppercase text-neutral-800 dark:text-neutral-200" />
                                                            )}
                                                            <EditableCell {...commonProps} field="ov" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 5 : (currentTab === 'ACOMPANHAR' ? 3 : 2)} value={item.ov} maskType="upper" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                            <EditableCell {...commonProps} field="codAutorizacao" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 6 : (currentTab === 'ACOMPANHAR' ? 4 : 3)} value={item.codAutorizacao} className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                            <EditableCell {...commonProps} field="cpf" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 7 : (currentTab === 'ACOMPANHAR' ? 5 : 4)} value={item.cpf} maskType="cpf" className="font-mono text-neutral-800 dark:text-neutral-200" />
                                                            <EditableCell {...commonProps} field="plano" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 8 : (currentTab === 'ACOMPANHAR' ? 6 : 5)} value={item.plano} maskType="upper" className="font-bold uppercase text-neutral-800 dark:text-neutral-200" />
                                                            <EditableCell {...commonProps} field="cliente" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 9 : (currentTab === 'ACOMPANHAR' ? 7 : 6)} value={item.cliente} maskType="upper" className="uppercase text-neutral-800 dark:text-neutral-200" />
                                                            {currentTab !== 'SOBREPOSIÇÃO' && currentTab !== 'ACOMPANHAR' && (
                                                                <>
                                                                    <SelectableCell {...commonProps} field="pagamento" colIdx={7} value={item.pagamento} />
                                                                    <EditableCell {...commonProps} field="valor" colIdx={8} value={item.valor} maskType="valor" placeholder="R$ 0,00" className="font-bold text-neutral-800 dark:text-neutral-200" />
                                                                </>
                                                            )}
                                                            <EditableCell {...commonProps} field="observacao" colIdx={currentTab === 'SOBREPOSIÇÃO' ? 10 : (currentTab === 'ACOMPANHAR' ? 8 : 9)} value={item.observacao} className="text-neutral-600 dark:text-neutral-400" />
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 text-center align-middle">
                                                                <div className="flex items-center justify-center gap-1.5 h-full min-h-[36px] px-2">
                                                                    {canModifySimcard && (
                                                                        <div className="flex items-center gap-1.5 border-r border-neutral-300 dark:border-neutral-700 pr-2 mr-1">
                                                                            <button onClick={() => handleChangeColor(item.id, 'green')} className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-600 shadow-sm transition-colors" title="Corrigido/Processado" />
                                                                            <button onClick={() => handleChangeColor(item.id, 'yellow')} className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-600 shadow-sm transition-colors" title="Em Processo de Baixa SAP" />
                                                                            <button onClick={() => handleChangeColor(item.id, 'red')} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 shadow-sm transition-colors" title="Chip Não Localizado SAP" />
                                                                            {item.statusColor && (
                                                                                <button onClick={() => handleChangeColor(item.id, null)} className="w-3.5 h-3.5 rounded-full bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-500 text-[8px] flex items-center justify-center font-bold shadow-sm transition-colors" title="Limpar Cor">X</button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <button onClick={() => handleDeleteRequest(item.id)} className={`flex items-center justify-center transition-colors ${canModifySimcard ? 'text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded' : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400'}`} title={canModifySimcard ? "Excluir Linha" : "Autenticação Necessária"}>
                                                                        {canModifySimcard ? <Trash2 size={14} /> : <Lock size={12} />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {isBatchModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in transition-colors">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                                <div><h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Cadastro em Lote</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Insira os códigos para criar as linhas na seção <strong className="text-[#E3000F]">{currentTab}</strong>.</p></div>
                                <button onClick={() => setIsBatchModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data do Lote</label><input type="date" value={batchData.data} onChange={e => setBatchData({ ...batchData, data: e.target.value })} className="w-full md:w-1/2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-[#E3000F]" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    {currentTab !== 'ESTOQUE TVBOX' && (
                                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -translate-x-1/2"></div>
                                    )}
                                    
                                    {currentTab !== 'ESTOQUE TVBOX' && (
                                        <div className="md:pr-3"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1"><span>Lote Físico (ICCID)</span><span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span></label><textarea value={batchData.fisicos} onChange={e => setBatchData({ ...batchData, fisicos: e.target.value })} rows={8} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                    )}

                                    {currentTab === 'ESTOQUE TVBOX' ? (
                                        <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1"><span>Lote TV BOX (CAID)</span><span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span></label><textarea value={batchData.caids || ''} onChange={e => setBatchData({ ...batchData, caids: e.target.value })} rows={8} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;001234567890&#10;001234567891" /></div>
                                    ) : (
                                        <div className="md:pl-3 pt-6 md:pt-0 border-t border-neutral-200 dark:border-neutral-700 md:border-0"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1"><span>Lote Virtual (E-SIM)</span><span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span></label><textarea value={batchData.esims} onChange={e => setBatchData({ ...batchData, esims: e.target.value })} rows={8} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                    )}
                                </div>
                                <div className="pt-2 flex justify-end gap-3"><button type="button" onClick={() => setIsBatchModalOpen(false)} className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button><button onClick={handleBatchSubmit} className="px-8 py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2">Adicionar à Planilha</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};