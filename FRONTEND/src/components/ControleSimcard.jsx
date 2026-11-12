import React, { useState, useEffect, useRef } from 'react';
import { getFirstName } from '../utils/nameFormatter.js';
import { Lock, Unlock, FileSpreadsheet, Trash2, X, Copy, Check, CreditCard, Smartphone, Tv, ShieldCheck, Search, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { applyDateShortMask, applyCpfCnpjMask, applyCurrencyMask, getTodaySP } from '../utils/masks';
import { API_URL } from '../services/api.js';

const getTodayShortSP = () => {
    const today = getTodaySP(); // YYYY-MM-DD
    if (!today) return '';
    const [yyyy, mm, dd] = today.split('-');
    if (yyyy && mm && dd) return `${dd}/${mm}/${yyyy.slice(2)}`;
    return today;
};

const CardFieldInput = ({ value, onCommit, placeholder, className = '', maskType, disabled = false, onCopy }) => {
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
        if (disabled) return;
        let val = e.target.value;
        if (maskType === 'iccid') val = val.replace(/\D/g, '').slice(0, 20);
        else if (maskType === 'cpf') val = applyCpfCnpjMask(val);
        else if (maskType === 'valor') val = applyCurrencyMask(val);
        else if (maskType === 'data') val = applyDateShortMask(val);
        else if (maskType === 'upper') val = val.toUpperCase();
        setLocalValue(val);
        latestValue.current = val;
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (disabled) return;
        if (latestValue.current !== (value || '')) {
            const accepted = onCommit(latestValue.current);
            if (accepted === false) {
                setLocalValue(value || '');
                latestValue.current = value || '';
            }
        }
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
            onFocus={() => !disabled && setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onCopy={onCopy}
            disabled={disabled}
            readOnly={disabled}
            placeholder={placeholder}
            className={className}
        />
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
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Estado do Modal de Remoção de Selo Digital (uso único por remoção, restrito a cargos != VENDEDOR)
    const [sealRemovalModal, setSealRemovalModal] = useState({ isOpen: false, targetId: null, serial: '', sealOwner: '' });
    const [sealAuthUser, setSealAuthUser] = useState('');
    const [sealAuthPass, setSealAuthPass] = useState('');
    const [sealAuthError, setSealAuthError] = useState('');
    const [sealAuthLoading, setSealAuthLoading] = useState(false);

    const dynamicTabs = ['GESTAO', ...safeVendedores, 'SOBREPOSIÇÃO', 'ACOMPANHAR', 'ESTOQUE TVBOX'];
    const currentTab = dynamicTabs.includes(simcardActiveTab) ? simcardActiveTab : (dynamicTabs[0] || 'GESTAO');

    useEffect(() => {
        if (isBatchModalOpen) {
            setBatchData({ fisicos: '', esims: '', caids: '', data: getTodaySP() });
        }
    }, [isBatchModalOpen]);

    const getCurrentUserSeal = () => {
        const matchedKey = Object.keys(usersDB || {}).find(
            k => String(usersDB[k]?.name || '').toUpperCase() === String(globalUser?.name || '').toUpperCase()
        );
        const loginId = globalUser?.username || matchedKey || 'SISTEMA';
        const userName = globalUser?.name || 'COLABORADOR';
        return `LOGIN ${String(loginId).toUpperCase()} - ${String(userName).toUpperCase()}`;
    };

    const sealAndCopySimcard = (item, copyToClipboard = true) => {
        if (!item) return;
        const isTvBox = currentTab === 'ESTOQUE TVBOX';
        const isFisico = item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
        const serialValue = isTvBox ? (item.caid || '') : (isFisico ? (item.simcardFisico || '') : (item.simcardEsim || ''));

        if (!serialValue) {
            toast.error('Esta caixinha ainda não possui ICCID/Serial cadastrado.');
            return;
        }

        if (copyToClipboard && navigator.clipboard) {
            navigator.clipboard.writeText(serialValue).catch(() => {});
        }

        const sealText = getCurrentUserSeal();
        const localShortDate = getTodayShortSP();
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(prev => (prev === item.id ? null : prev)), 2000);

        setSimcardsData(prev => (prev || []).map(sc => {
            if (sc.id === item.id) {
                return {
                    ...sc,
                    data: sc.data || localShortDate,
                    emUsoPor: sealText,
                    emUsoAt: new Date().toISOString()
                };
            }
            return sc;
        }));

        toast.success(`ICCID copiado! Selo aplicado: EM USO (${sealText})`, { id: `seal-${item.id}` });
    };

    const handleOpenSealRemovalModal = (item, serialVal) => {
        setSealAuthUser('');
        setSealAuthPass('');
        setSealAuthError('');
        setSealAuthLoading(false);
        setSealRemovalModal({
            isOpen: true,
            targetId: item.id,
            serial: serialVal || item.simcardFisico || item.simcardEsim || item.caid || '',
            sealOwner: item.emUsoPor || ''
        });
    };

    const handleCloseSealRemovalModal = () => {
        setSealRemovalModal({ isOpen: false, targetId: null, serial: '', sealOwner: '' });
        setSealAuthUser('');
        setSealAuthPass('');
        setSealAuthError('');
        setSealAuthLoading(false);
    };

    const handleConfirmSealRemoval = async (e) => {
        e.preventDefault();
        setSealAuthError('');

        const cleanUser = sealAuthUser.trim().toUpperCase();
        const cleanPass = sealAuthPass.trim();

        if (!cleanUser || !cleanPass) {
            setSealAuthError('Informe o login e a senha para autorizar a remoção.');
            return;
        }

        setSealAuthLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanUser, password: cleanPass }),
                credentials: 'omit'
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result?.user) {
                setSealAuthError(result?.error || 'Credenciais inválidas! Verifique o usuário e a senha.');
                setSealAuthLoading(false);
                return;
            }

            const authRole = String(result.user.role || '').toUpperCase();
            if (!authRole || authRole === 'VENDEDOR' || authRole === 'SUSPENDER') {
                setSealAuthError('Acesso bloqueado! Vendedores não possuem permissão para remover o Selo Digital.');
                setSealAuthLoading(false);
                return;
            }

            // Autorização válida SOMENTE para esta remoção de selo (não altera a sessão atual nem libera edição geral)
            const targetId = sealRemovalModal.targetId;
            setSimcardsData(prev => (prev || []).map(sc => {
                if (sc.id === targetId) {
                    const updated = { ...sc };
                    delete updated.emUsoPor;
                    delete updated.emUsoAt;
                    return updated;
                }
                return sc;
            }));

            toast.success(`Selo Digital removido por ${result.user.name || cleanUser} (${authRole}).`);
            handleCloseSealRemovalModal();
        } catch (err) {
            setSealAuthError('Erro ao validar credenciais no servidor. Tente novamente.');
            setSealAuthLoading(false);
        }
    };

    // Suporte global a CTRL + C quando uma caixinha está selecionada
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (sealRemovalModal.isOpen) {
                    handleCloseSealRemovalModal();
                    return;
                }
                if (isBatchModalOpen) {
                    setIsBatchModalOpen(false);
                    return;
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                const selectionText = window.getSelection ? window.getSelection().toString().trim() : '';
                const activeEl = document.activeElement;
                const isInputSelection = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) && activeEl.selectionStart !== activeEl.selectionEnd;

                // Se o usuário selecionou uma caixinha (e não está copiando outro texto específico), copia o ICCID e sela a caixinha
                if (selectedCardId && !selectionText && !isInputSelection && !sealRemovalModal.isOpen && !isBatchModalOpen) {
                    const cardItem = (simcardsData || []).find(i => i.id === selectedCardId);
                    if (cardItem && cardItem.owner === currentTab) {
                        e.preventDefault();
                        sealAndCopySimcard(cardItem, true);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBatchModalOpen, sealRemovalModal.isOpen, selectedCardId, simcardsData, currentTab, globalUser]);

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        const linhasFisico = batchData.fisicos.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasEsim = batchData.esims.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasCaid = (batchData.caids || '').split('\n').map(l => l.trim().toUpperCase()).filter(l => l);

        if (currentTab === 'ESTOQUE TVBOX') {
            if (linhasCaid.length === 0) return;
        } else {
            if (linhasFisico.length === 0 && linhasEsim.length === 0) return;
        }

        // Trava de data local (não editável)
        const shortDate = getTodayShortSP();

        // Trava de Duplicidade para ICCID e CAID
        const existingIccids = new Set();
        const existingCaids = new Set();

        (simcardsData || []).forEach(sc => {
            if (sc.simcardFisico) existingIccids.add(String(sc.simcardFisico).trim());
            if (sc.simcardEsim) existingIccids.add(String(sc.simcardEsim).trim());
            if (sc.caid) existingCaids.add(String(sc.caid).trim().toUpperCase());
        });

        let duplicatesBlocked = 0;
        const novosRegistros = [];
        const baseId = -Date.now() * 1000;

        if (currentTab === 'ESTOQUE TVBOX') {
            linhasCaid.forEach((linha, i) => {
                if (existingCaids.has(linha)) {
                    duplicatesBlocked++;
                    return;
                }
                existingCaids.add(linha);
                novosRegistros.push({
                    id: baseId - i,
                    owner: currentTab,
                    caid: linha,
                    data: shortDate,
                    vendedor: '', cliente: '', cpf: '', plano: '', valor: '', observacao: ''
                });
            });
        } else {
            linhasFisico.forEach((linha, i) => {
                if (existingIccids.has(linha)) {
                    duplicatesBlocked++;
                    return;
                }
                existingIccids.add(linha);
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
                if (existingIccids.has(linha)) {
                    duplicatesBlocked++;
                    return;
                }
                existingIccids.add(linha);
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

        if (duplicatesBlocked > 0) {
            toast.error(`${duplicatesBlocked} código(s) ICCID/CAID repetido(s) foram bloqueados pela trava de duplicidade!`);
        }

        if (novosRegistros.length === 0) {
            return;
        }

        setSimcardsData(prev => [...prev, ...novosRegistros]);
        toast.success(`${novosRegistros.length} caixinha(s) adicionada(s) com sucesso!`);
        setIsBatchModalOpen(false);
        setBatchData({ fisicos: '', esims: '', caids: '', data: getTodaySP() });
    };

    const handleInlineChange = (id, field, value) => {
        // Trava de Data Local: DATA não é editável
        if (field === 'data') {
            toast.error('A data possui trava automática de acordo com a data local e não pode ser editada.');
            return false;
        }

        if ((field === 'simcardFisico' || field === 'simcardEsim' || field === 'caid') && !canModifySimcard) {
            return false;
        }

        let normalizedVal = value;
        if (field === 'cpf') normalizedVal = applyCpfCnpjMask(value);
        if (field === 'valor') normalizedVal = applyCurrencyMask(value);
        if (field === 'simcardFisico' || field === 'simcardEsim') normalizedVal = String(value || '').replace(/\D/g, '').slice(0, 20);
        if (field === 'caid' || field === 'ov' || field === 'plano' || field === 'cliente') normalizedVal = String(value || '').toUpperCase();

        // Trava contra ICCID e CAID repetidos na edição inline
        if ((field === 'simcardFisico' || field === 'simcardEsim') && normalizedVal.trim() !== '') {
            const cleanTarget = normalizedVal.trim();
            const isDuplicateIccid = (simcardsData || []).some(
                sc => sc.id !== id && (String(sc.simcardFisico || '').trim() === cleanTarget || String(sc.simcardEsim || '').trim() === cleanTarget)
            );
            if (isDuplicateIccid) {
                toast.error(`Trava de Duplicidade: O ICCID ${cleanTarget} já está cadastrado no sistema!`);
                return false;
            }
        }

        if (field === 'caid' && normalizedVal.trim() !== '') {
            const cleanTarget = normalizedVal.trim().toUpperCase();
            const isDuplicateCaid = (simcardsData || []).some(
                sc => sc.id !== id && String(sc.caid || '').trim().toUpperCase() === cleanTarget
            );
            if (isDuplicateCaid) {
                toast.error(`Trava de Duplicidade: O CAID ${cleanTarget} já está cadastrado no sistema!`);
                return false;
            }
        }

        setSimcardsData(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: normalizedVal };
            }
            return item;
        }));
        return true;
    };

    const handleDeleteRequest = (id) => {
        if (canModifySimcard) {
            setSimcardsData(prev => prev.filter(item => item.id !== id));
        } else {
            setAuthModal({ isOpen: true, pendingAction: 'DELETE', pendingId: id, requiredRole: 'SENIOR' });
        }
    };

    const handleProtectedClick = () => {
        if (!canModifySimcard) setAuthModal({ isOpen: true, pendingAction: 'UNLOCK', pendingId: null, requiredRole: 'SENIOR' });
    };

    const handleChangeColor = (id, newColor) => {
        if (!canModifySimcard) return;
        setSimcardsData(prev => prev.map(item => {
            if (item.id === id) {
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
                    'Data': item.data || getTodayShortSP(),
                    'CPF | CNPJ': item.cpf || '-',
                    'Plano': item.plano || '-',
                    'Cliente': item.cliente || '-',
                    'Valor': item.valor || '-',
                    'Observação': item.observacao || '-',
                    'Status Uso': item.emUsoPor || '-'
                };
            }
            return {
                'SIMCARD/E-SIM': isFisico ? item.simcardFisico : item.simcardEsim,
                'Data': item.data || getTodayShortSP(),
                'CPF | CNPJ': item.cpf || '-',
                'Plano': item.plano || '-',
                'Cliente': item.cliente || '-',
                'Valor': item.valor || '-',
                'Observação': item.observacao || '-',
                'Status Uso': item.emUsoPor || '-'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, currentTab);
        XLSX.writeFile(workbook, `Relatorio_Simcards_${currentTab}.xlsx`);
        toast.success('Relatório exportado com sucesso!');
    };

    const filterBySearch = (item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(item.simcardFisico || '').toLowerCase().includes(q) ||
            String(item.simcardEsim || '').toLowerCase().includes(q) ||
            String(item.caid || '').toLowerCase().includes(q) ||
            String(item.cpf || '').toLowerCase().includes(q) ||
            String(item.cliente || '').toLowerCase().includes(q) ||
            String(item.plano || '').toLowerCase().includes(q) ||
            String(item.observacao || '').toLowerCase().includes(q) ||
            String(item.emUsoPor || '').toLowerCase().includes(q)
        );
    };

    const renderSimcardCard = (item, idx, tipoLabel, serialField) => {
        const serialVal = item[serialField] || '';
        const isSelected = selectedCardId === item.id;
        const isCopied = copiedId === item.id;
        const displayDate = item.data || getTodayShortSP();

        const statusBorder =
            item.statusColor === 'green'
                ? 'border-green-500/70 bg-green-50/30 dark:bg-green-950/20'
                : item.statusColor === 'yellow'
                ? 'border-yellow-500/70 bg-yellow-50/30 dark:bg-yellow-950/20'
                : item.statusColor === 'red'
                ? 'border-red-500/70 bg-red-50/30 dark:bg-red-950/20'
                : item.emUsoPor
                ? 'border-[#E3000F]/50 bg-white dark:bg-neutral-900'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900';

        return (
            <div
                key={item.id}
                onClick={() => setSelectedCardId(item.id)}
                className={`rounded-xl px-3.5 py-2.5 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col gap-2 relative group ${statusBorder} ${
                    isSelected ? 'ring-2 ring-[#E3000F] shadow-red-500/10' : ''
                }`}
            >
                {/* Linha Principal Horizontal */}
                <div className="flex flex-col xl:flex-row xl:items-center gap-2.5 w-full">
                    {/* Bloco 1: Índice + ICCID + Botão Copiar */}
                    <div className="flex items-center gap-2 shrink-0 xl:w-[310px]">
                        <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] flex items-center justify-center font-black text-[11px] shrink-0">
                            #{idx + 1}
                        </span>

                        <div className="flex-1 flex items-center justify-between gap-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 min-w-0">
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5 flex items-center gap-1">
                                    {tipoLabel}
                                    {!canModifySimcard && (
                                        <Lock
                                            size={9}
                                            onClick={(e) => { e.stopPropagation(); handleProtectedClick(); }}
                                            className="text-neutral-400 hover:text-[#E3000F] cursor-pointer inline"
                                            title="Desbloquear Edição de ICCID"
                                        />
                                    )}
                                </span>
                                <CardFieldInput
                                    value={serialVal}
                                    onCommit={(val) => handleInlineChange(item.id, serialField, val)}
                                    onCopy={() => sealAndCopySimcard(item, false)}
                                    maskType={serialField === 'caid' ? 'upper' : 'iccid'}
                                    disabled={!canModifySimcard}
                                    placeholder="00000000000000000000"
                                    className="w-full bg-transparent font-mono text-xs font-black tracking-wider text-neutral-800 dark:text-neutral-100 outline-none select-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    sealAndCopySimcard(item, true);
                                }}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all shadow-sm ${
                                    isCopied
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                        : 'bg-[#E3000F] hover:bg-red-700 text-white shadow-red-500/20'
                                }`}
                                title="Copiar ICCID e selar caixinha como EM USO"
                            >
                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Bloco 2: Campos Horizontais (DATA [TRAVADA], CPF/CNPJ, PLANO, CLIENTE, VALOR, OBS) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:flex xl:items-center gap-2 flex-1 min-w-0">
                        <div
                            className="xl:w-24 shrink-0 bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 cursor-not-allowed select-none"
                            title="Data travada de acordo com a data local (não editável)"
                        >
                            <label className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                <span>DATA</span>
                                <Lock size={8} className="text-neutral-400" />
                            </label>
                            <input
                                type="text"
                                value={displayDate}
                                readOnly
                                disabled
                                className="w-full bg-transparent text-xs font-bold text-neutral-600 dark:text-neutral-300 outline-none cursor-not-allowed"
                            />
                        </div>

                        <div className="xl:w-36 shrink-0 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-[#E3000F] transition-all">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                CPF OU CNPJ
                            </label>
                            <CardFieldInput
                                value={item.cpf}
                                onCommit={(val) => handleInlineChange(item.id, 'cpf', val)}
                                maskType="cpf"
                                placeholder="000.000.000-00"
                                className="w-full bg-transparent font-mono text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none"
                            />
                        </div>

                        <div className="xl:w-36 shrink-0 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-[#E3000F] transition-all">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                PLANO
                            </label>
                            <CardFieldInput
                                value={item.plano}
                                onCommit={(val) => handleInlineChange(item.id, 'plano', val)}
                                maskType="upper"
                                placeholder="PLANO"
                                className="w-full bg-transparent text-xs font-bold uppercase text-neutral-800 dark:text-neutral-100 outline-none"
                            />
                        </div>

                        <div className="xl:flex-1 min-w-[130px] bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-[#E3000F] transition-all">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                CLIENTE
                            </label>
                            <CardFieldInput
                                value={item.cliente}
                                onCommit={(val) => handleInlineChange(item.id, 'cliente', val)}
                                maskType="upper"
                                placeholder="NOME DO CLIENTE"
                                className="w-full bg-transparent text-xs font-bold uppercase text-neutral-800 dark:text-neutral-100 outline-none"
                            />
                        </div>

                        <div className="xl:w-24 shrink-0 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-[#E3000F] transition-all">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                VALOR
                            </label>
                            <CardFieldInput
                                value={item.valor}
                                onCommit={(val) => handleInlineChange(item.id, 'valor', val)}
                                maskType="valor"
                                placeholder="R$ 0,00"
                                className="w-full bg-transparent text-xs font-black text-[#E3000F] dark:text-red-400 outline-none"
                            />
                        </div>

                        <div className="xl:flex-1 min-w-[130px] bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-[#E3000F] transition-all">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 leading-none mb-0.5">
                                OBS
                            </label>
                            <CardFieldInput
                                value={item.observacao}
                                onCommit={(val) => handleInlineChange(item.id, 'observacao', val)}
                                placeholder="Observação..."
                                className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none"
                            />
                        </div>
                    </div>

                    {/* Bloco 3: Status SAP e Excluir */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                        {canModifySimcard && (
                            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-0.5">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleChangeColor(item.id, 'green'); }}
                                    className="w-3.5 h-3.5 rounded-full bg-green-500 hover:scale-110 shadow-sm transition-transform"
                                    title="Corrigido/Processado"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleChangeColor(item.id, 'yellow'); }}
                                    className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:scale-110 shadow-sm transition-transform"
                                    title="Em Processo de Baixa SAP"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleChangeColor(item.id, 'red'); }}
                                    className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 shadow-sm transition-transform"
                                    title="Chip Não Localizado SAP"
                                />
                                {item.statusColor && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleChangeColor(item.id, null); }}
                                        className="w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[8px] flex items-center justify-center font-bold"
                                        title="Limpar Status"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item.id); }}
                            className={`p-1.5 rounded-lg transition-colors ${
                                canModifySimcard
                                    ? 'text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500'
                            }`}
                            title={canModifySimcard ? 'Excluir Caixinha' : 'Autenticação Necessária'}
                        >
                            {canModifySimcard ? <Trash2 size={14} /> : <Lock size={12} />}
                        </button>
                    </div>
                </div>

                {/* SELO / ETIQUETA DIGITAL AUTOMÁTICA DE EM USO (Com trava de remoção mediante Login e Senha de cargo != VENDEDOR) */}
                {item.emUsoPor && (
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E3000F]/15 via-red-500/10 to-transparent dark:from-[#E3000F]/25 dark:via-red-900/20 border border-[#E3000F]/40 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3000F] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3000F]"></span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight min-w-0">
                                <span className="font-black uppercase tracking-widest text-[#E3000F] dark:text-red-400">
                                    EM USO:
                                </span>
                                <span className="font-black text-neutral-900 dark:text-white tracking-wide truncate" title={item.emUsoPor}>
                                    {item.emUsoPor}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSealRemovalModal(item, serialVal);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300 hover:text-[#E3000F] dark:hover:text-red-400 px-2 py-0.5 rounded-md bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-700 hover:border-[#E3000F]/50 transition-all shrink-0"
                            title="Remover Selo Digital (Requer Login e Senha de Gerência/Liderança/ADM)"
                        >
                            <Lock size={10} />
                            <span>Remover Selo</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full animate-fade-in transition-colors">
                {/* Cabeçalho */}
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-neutral-900 shrink-0">
                    <h2
                        onDoubleClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
                        className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 cursor-pointer select-none hover:text-[#E3000F] transition-colors"
                        title="Duplo clique para expandir/recolher as opções"
                    >
                        <CreditCard size={20} className="text-[#E3000F]" />
                        <span>Controle de Estoque e SIM Cards</span>
                        {canModifySimcard ? (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2">
                                <Unlock size={12} /> Edição Liberada
                            </span>
                        ) : (
                            <span
                                onClick={handleProtectedClick}
                                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                title="Desbloquear Edição"
                            >
                                <Lock size={12} /> Acesso Restrito
                            </span>
                        )}
                    </h2>
                    {!isOptionsCollapsed && (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar ICCID, CPF, cliente..."
                                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>
                            {!globalUser && (
                                <button
                                    onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null })}
                                    className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"
                                >
                                    <Lock size={14} /> Autenticar
                                </button>
                            )}
                            {canModifySimcard && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleExportExcel}
                                        className="px-4 py-2 bg-[#107c41] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center gap-2"
                                    >
                                        Exportar Excel
                                    </button>
                                    <button
                                        onClick={() => setIsBatchModalOpen(true)}
                                        className="px-4 py-2 bg-[#E3000F] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center gap-2"
                                    >
                                        <FileSpreadsheet size={16} /> + Lote
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Abas de Vendedores / Categorias */}
                <div
                    className="flex overflow-x-auto bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 scrollbar-hide shrink-0"
                    onWheel={(e) => (e.currentTarget.scrollLeft += e.deltaY)}
                >
                    {dynamicTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSimcardActiveTab(tab)}
                            className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-[3px] ${
                                currentTab === tab
                                    ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900'
                                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            {['GESTAO', 'SOBREPOSIÇÃO', 'ACOMPANHAR', 'ESTOQUE TVBOX'].includes(tab) ? tab : getFirstName(tab)}
                        </button>
                    ))}
                </div>

                {/* Legenda de Status e Etiqueta Digital */}
                <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 shrink-0 overflow-x-auto scrollbar-hide no-print">
                    <div className="flex items-center justify-between gap-4 min-w-max">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 mr-1">Status:</span>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div> Em Processo de Baixa SAP</span>
                                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div> Chip Não Localizado SAP</span>
                                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div> Corrigido / Processado</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#E3000F] bg-red-50 dark:bg-[#E3000F]/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-[#E3000F]/20">
                            <ShieldCheck size={14} />
                            <span>Selo Digital "EM USO" automático ao copiar • Remoção exclusiva mediante Login e Senha (exceto Vendedor)</span>
                        </div>
                    </div>
                </div>

                {/* Grid de Caixinhas (Cards) */}
                <div className="overflow-auto flex-1 bg-neutral-50/50 dark:bg-neutral-950/60 p-4 space-y-8">
                    {currentTab === 'ESTOQUE TVBOX' ? (() => {
                        const tvBoxItems = (simcardsData || []).filter(item => item.owner === currentTab && filterBySearch(item));
                        return (
                            <div>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                            <Tv size={18} />
                                        </div>
                                        <h3 className="font-black uppercase text-sm tracking-wider text-neutral-800 dark:text-neutral-100">
                                            CAID: TV BOX
                                        </h3>
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                        {tvBoxItems.length} caixinha(s)
                                    </span>
                                </div>
                                {tvBoxItems.length === 0 ? (
                                    <div className="text-center py-10 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 font-medium text-sm">
                                        Nenhum TV BOX encontrado nesta seção.
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-2.5">
                                        {tvBoxItems.map((item, idx) => renderSimcardCard(item, idx, 'TV BOX', 'caid'))}
                                    </div>
                                )}
                            </div>
                        );
                    })() : (
                        ['FÍSICO', 'VIRTUAL (E-SIM)'].map((tipoLote) => {
                            const isFisico = tipoLote === 'FÍSICO';
                            const filteredData = (simcardsData || []).filter(item => {
                                if (item.owner !== currentTab) return false;
                                const matchType = isFisico
                                    ? (item.simcardFisico || (!item.simcardFisico && !item.simcardEsim))
                                    : (item.simcardEsim && !item.simcardFisico);
                                return matchType && filterBySearch(item);
                            });

                            const serialField = isFisico ? 'simcardFisico' : 'simcardEsim';
                            const badgeLabel = isFisico ? 'SIMCARD FÍSICO' : 'E-SIM VIRTUAL';

                            return (
                                <div key={tipoLote}>
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                                <Smartphone size={18} />
                                            </div>
                                            <h3 className="font-black uppercase text-sm tracking-wider text-neutral-800 dark:text-neutral-100">
                                                ICCID: {tipoLote}
                                            </h3>
                                        </div>
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                            {filteredData.length} caixinha(s)
                                        </span>
                                    </div>

                                    {filteredData.length === 0 ? (
                                        <div className="text-center py-8 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 font-medium text-sm">
                                            Nenhum registro encontrado em {tipoLote}.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-2.5">
                                            {filteredData.map((item, idx) => renderSimcardCard(item, idx, badgeLabel, serialField))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal de Remoção de Selo Digital (Permissão exclusiva e pontual para a remoção) */}
            {sealRemovalModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-[#E3000F]/15 text-[#E3000F] flex items-center justify-center">
                                    <KeyRound size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                                        Remover Selo Digital
                                    </h3>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Autorização pontual (somente cargos superiores a Vendedor)
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseSealRemovalModal}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmSealRemoval} className="p-5 space-y-4">
                            <div className="p-3 rounded-xl bg-red-50/70 dark:bg-[#E3000F]/10 border border-red-200/70 dark:border-[#E3000F]/30 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[10px]">ICCID / CAID:</span>
                                    <span className="font-mono font-black text-neutral-800 dark:text-neutral-100">{sealRemovalModal.serial || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[10px]">Selo Atual:</span>
                                    <span className="font-black text-[#E3000F] dark:text-red-400 truncate max-w-[230px]">{sealRemovalModal.sealOwner}</span>
                                </div>
                            </div>

                            {sealAuthError && (
                                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold">
                                    {sealAuthError}
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Login / Matrícula Autorizador
                                </label>
                                <input
                                    type="text"
                                    value={sealAuthUser}
                                    onChange={(e) => setSealAuthUser(e.target.value.toUpperCase())}
                                    placeholder="Ex: LB24, GERENTE, ADM..."
                                    autoFocus
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold uppercase text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Senha de Acesso
                                </label>
                                <input
                                    type="password"
                                    value={sealAuthPass}
                                    onChange={(e) => setSealAuthPass(e.target.value)}
                                    placeholder="Digite sua senha..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                                    * A permissão desta senha serve exclusivamente para remover este selo e não mantém o painel desbloqueado.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleCloseSealRemovalModal}
                                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sealAuthLoading}
                                    className="px-5 py-2.5 rounded-xl bg-[#E3000F] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-500/20 flex items-center gap-1.5"
                                >
                                    <Unlock size={14} />
                                    <span>{sealAuthLoading ? 'Validando...' : 'Autorizar e Remover'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBatchModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in transition-colors">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Cadastro em Lote</h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                        Insira os códigos para criar as caixinhas na seção <strong className="text-[#E3000F]">{currentTab}</strong>. Códigos repetidos são bloqueados automaticamente.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsBatchModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>Data do Lote (Data Local Travada)</span>
                                        <Lock size={12} className="text-[#E3000F]" />
                                    </label>
                                    <input
                                        type="date"
                                        value={getTodaySP()}
                                        readOnly
                                        disabled
                                        className="w-full md:w-1/2 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 px-3 py-2.5 rounded-lg mt-1 outline-none cursor-not-allowed font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    {currentTab !== 'ESTOQUE TVBOX' && (
                                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -translate-x-1/2"></div>
                                    )}

                                    {currentTab !== 'ESTOQUE TVBOX' && (
                                        <div className="md:pr-3">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1">
                                                <span>Lote Físico (ICCID)</span>
                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span>
                                            </label>
                                            <textarea
                                                value={batchData.fisicos}
                                                onChange={e => setBatchData({ ...batchData, fisicos: e.target.value })}
                                                rows={8}
                                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none"
                                                placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930"
                                            />
                                        </div>
                                    )}

                                    {currentTab === 'ESTOQUE TVBOX' ? (
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1">
                                                <span>Lote TV BOX (CAID)</span>
                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span>
                                            </label>
                                            <textarea
                                                value={batchData.caids || ''}
                                                onChange={e => setBatchData({ ...batchData, caids: e.target.value })}
                                                rows={8}
                                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none"
                                                placeholder="Ex:&#10;001234567890&#10;001234567891"
                                            />
                                        </div>
                                    ) : (
                                        <div className="md:pl-3 pt-6 md:pt-0 border-t border-neutral-200 dark:border-neutral-700 md:border-0">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1">
                                                <span>Lote Virtual (E-SIM)</span>
                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span>
                                            </label>
                                            <textarea
                                                value={batchData.esims}
                                                onChange={e => setBatchData({ ...batchData, esims: e.target.value })}
                                                rows={8}
                                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none"
                                                placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsBatchModalOpen(false)}
                                        className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleBatchSubmit}
                                        className="px-8 py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2"
                                    >
                                        Adicionar Caixinhas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
