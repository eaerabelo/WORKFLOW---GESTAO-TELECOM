import React, { useState, useMemo } from 'react';
import {
    ShieldCheck, Phone, User, Smartphone, Tv, Wifi, Zap, Plus, Search,
    Sparkles, MessageCircle, Copy, Check, Trash2, Edit3,
    CheckCircle2, Clock, Flame, Layers, FileText, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applyPhoneMask } from '../utils/masks';

const SERVICOS_CATALOGO = [
    {
        id: 'MOVEL',
        label: 'MÓVEL',
        sub: 'Pós / Controle',
        icon: Smartphone,
        activeClass: 'bg-red-50 dark:bg-[#E3000F]/15 border-[#E3000F] text-[#E3000F] shadow-sm',
        badgeClass: 'bg-red-500/10 text-[#E3000F] border-red-500/20'
    },
    {
        id: 'TVBOX',
        label: 'TVBOX',
        sub: 'Claro TV+ / Box',
        icon: Tv,
        activeClass: 'bg-purple-50 dark:bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    },
    {
        id: 'FIBRA',
        label: 'FIBRA',
        sub: 'Banda Larga Fixa',
        icon: Wifi,
        activeClass: 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
        id: 'COMBO_MULTI',
        label: 'COMBO MULTI',
        sub: 'Convergente Multi',
        icon: Zap,
        activeClass: 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    }
];

const STATUS_TRABALHO = {
    PARA_TRABALHAR: {
        id: 'PARA_TRABALHAR',
        label: 'Para Trabalhar',
        shortLabel: 'Trabalhar',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: Clock
    },
    EM_CONTATO: {
        id: 'EM_CONTATO',
        label: 'Em Negociação',
        shortLabel: 'Negociando',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Flame
    },
    CONVERTIDO: {
        id: 'CONVERTIDO',
        label: 'Convertido',
        shortLabel: 'Convertido',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2
    }
};

/**
 * Calcula automaticamente a recomendação de oferta futura com base no que o cliente já possui
 */
const gerarSugestaoFutura = (servicos = []) => {
    const hasMovel = servicos.includes('MOVEL');
    const hasFibra = servicos.includes('FIBRA');
    const hasTv = servicos.includes('TVBOX');
    const hasMulti = servicos.includes('COMBO_MULTI');

    const faltantes = [];
    if (!hasMovel) faltantes.push('MÓVEL');
    if (!hasFibra) faltantes.push('FIBRA');
    if (!hasTv) faltantes.push('TVBOX');

    if (faltantes.length === 0 || (hasMovel && hasFibra && hasTv)) {
        return {
            titulo: 'Cliente Completo • Ofertar Upgrade / Dependente / Aparelho',
            descricao: 'Cliente já possui Móvel, Fibra e TVBox. Trabalhar linha dependente, aparelho ou seguro.',
            destaque: 'UPGRADE & BLINDAGEM',
            faltantes: []
        };
    }

    if (hasMovel && !hasFibra && !hasTv) {
        return {
            titulo: 'Ofertar FIBRA + TVBOX (Migrar p/ Combo Multi)',
            descricao: 'Cliente já tem linha Móvel. Oportunidade para ofertar Banda Larga Fibra e Claro TV Box.',
            destaque: 'OFERTAR FIBRA + TVBOX',
            faltantes
        };
    }

    if (hasFibra && !hasMovel) {
        return {
            titulo: 'Ofertar Linha MÓVEL Pós/Controle no Combo Multi',
            descricao: 'Cliente já possui Fibra instalada. Trabalhar portabilidade ou ativação Móvel com bônus Multi.',
            destaque: 'OFERTAR MÓVEL MULTI',
            faltantes
        };
    }

    if (hasMovel && hasFibra && !hasTv) {
        return {
            titulo: 'Ofertar TVBOX / Claro TV+ e Blindar Combo Multi',
            descricao: 'Cliente já possui Móvel e Fibra. Ofertar Claro TV Box para completar a residência.',
            destaque: 'OFERTAR TVBOX',
            faltantes
        };
    }

    return {
        titulo: `Ofertar ${faltantes.join(' + ')} ${!hasMulti ? 'no Combo Multi' : ''}`,
        descricao: `Trabalhar abordagem futura para inclusão de ${faltantes.join(' e ')}.`,
        destaque: `OFERTAR ${faltantes.join(' + ')}`,
        faltantes
    };
};

export function Retencao({
    retencaoData = [],
    setRetencaoData,
    globalUser,
    isGerente,
    usersDB = {}
}) {
    const loggedName = String(globalUser?.name || 'COLABORADOR').trim();
    const userRole = String(globalUser?.role || 'VENDEDOR').toUpperCase();
    const canViewAll = isGerente || ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'ADM', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'COORDENADOR', 'ESPECIALISTA'].includes(userRole);

    // Estados do Formulário de Cadastro / Edição
    const [editingId, setEditingId] = useState(null);
    const [nome, setNome] = useState('');
    const [celular, setCelular] = useState('');
    const [tipoOperacao, setTipoOperacao] = useState('SIMPLIFICA'); // 'SIMPLIFICA' | 'NETSALES'
    const [servicosAtuais, setServicosAtuais] = useState(['MOVEL']);
    const [observacao, setObservacao] = useState('');

    // Estados de Filtro da Carteira de Clientes
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOperacao, setFilterOperacao] = useState('TODOS');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [filterOportunidade, setFilterOportunidade] = useState('TODAS');
    const [filterVendedor, setFilterVendedor] = useState(canViewAll ? 'TODOS' : loggedName);
    const [copiedId, setCopiedId] = useState(null);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [noteDraft, setNoteDraft] = useState('');

    const toggleServico = (servicoId) => {
        setServicosAtuais(prev => {
            if (prev.includes(servicoId)) {
                return prev.filter(s => s !== servicoId);
            }
            return [...prev, servicoId];
        });
    };

    const previewSugestao = useMemo(() => gerarSugestaoFutura(servicosAtuais), [servicosAtuais]);

    const resetForm = () => {
        setEditingId(null);
        setNome('');
        setCelular('');
        setTipoOperacao('SIMPLIFICA');
        setServicosAtuais(['MOVEL']);
        setObservacao('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const digits = String(celular || '').replace(/\D/g, '');
        if (digits.length < 10) {
            toast.error('Informe um número de celular (Linha Titular) válido com DDD.');
            return;
        }
        if (servicosAtuais.length === 0) {
            toast.error('Selecione pelo menos 1 serviço que o cliente possui (Móvel, TVBox, Fibra ou Combo Multi).');
            return;
        }

        const sugestao = gerarSugestaoFutura(servicosAtuais);
        const nowFormatted = new Date().toLocaleDateString('pt-BR');

        if (editingId) {
            setRetencaoData(prev => (prev || []).map(item => {
                if (item.id !== editingId) return item;
                return {
                    ...item,
                    nome: nome.trim() ? nome.trim().toUpperCase() : 'CLIENTE PÓS-VENDA',
                    celular: celular.trim(),
                    tipoOperacao,
                    servicos: servicosAtuais,
                    observacao: observacao.trim(),
                    sugestaoFutura: sugestao.destaque,
                    updatedAt: Date.now()
                };
            }));
            toast.success('Ficha do cliente atualizada na carteira de retenção!');
        } else {
            const novoRegistro = {
                id: Date.now(),
                nome: nome.trim() ? nome.trim().toUpperCase() : 'CLIENTE PÓS-VENDA',
                celular: celular.trim(),
                tipoOperacao,
                servicos: servicosAtuais,
                observacao: observacao.trim(),
                sugestaoFutura: sugestao.destaque,
                statusTrabalho: 'PARA_TRABALHAR',
                notaFutura: '',
                vendedor: loggedName,
                vendedorUsername: globalUser?.username || '',
                dataCadastro: nowFormatted,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            setRetencaoData(prev => [novoRegistro, ...(Array.isArray(prev) ? prev : [])]);
            toast.success('Cliente salvo na Carteira de Retenção para trabalharmos futuramente!');
        }

        resetForm();
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setNome(item.nome === 'CLIENTE PÓS-VENDA' ? '' : (item.nome || ''));
        setCelular(item.celular || '');
        setTipoOperacao(item.tipoOperacao || 'SIMPLIFICA');
        setServicosAtuais(Array.isArray(item.servicos) && item.servicos.length > 0 ? item.servicos : ['MOVEL']);
        setObservacao(item.observacao || '');
    };

    const handleDelete = (id) => {
        if (window.confirm('Deseja remover este cliente da carteira de retenção?')) {
            setRetencaoData(prev => (prev || []).filter(item => item.id !== id));
            toast.success('Registro removido da carteira.');
        }
    };

    const handleChangeStatus = (id, novoStatus) => {
        setRetencaoData(prev => (prev || []).map(item => {
            if (item.id !== id) return item;
            return { ...item, statusTrabalho: novoStatus, updatedAt: Date.now() };
        }));
        const label = STATUS_TRABALHO[novoStatus]?.label || novoStatus;
        toast.success(`Status atualizado para: ${label}`);
    };

    const handleSaveFollowUpNote = (id) => {
        setRetencaoData(prev => (prev || []).map(item => {
            if (item.id !== id) return item;
            return { ...item, notaFutura: noteDraft.trim(), updatedAt: Date.now() };
        }));
        setActiveNoteId(null);
        setNoteDraft('');
        toast.success('Anotação comercial salva no espaço do cliente!');
    };

    const handleCopyPhone = (id, phoneStr) => {
        const clean = String(phoneStr || '').replace(/\D/g, '');
        navigator.clipboard.writeText(clean || phoneStr);
        setCopiedId(id);
        toast.success('Linha titular copiada!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleOpenWhatsApp = (item) => {
        const digits = String(item.celular || '').replace(/\D/g, '');
        if (!digits) return;
        const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;
        const primeiroNome = item.nome && item.nome !== 'CLIENTE PÓS-VENDA'
            ? item.nome.split(' ')[0]
            : 'Cliente';
        const msg = encodeURIComponent(
            `Olá ${primeiroNome}, tudo bem? Aqui é da Loja Claro! Passando para acompanhar o benefício aplicado na sua linha e verificar se posso te ajudar com uma condição exclusiva.`
        );
        window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
    };

    // Lista de consultores para filtro
    const listaVendedores = useMemo(() => {
        const fromDB = Object.values(usersDB || {})
            .filter(u => u?.role !== 'SUSPENDER')
            .map(u => String(u?.name || '').trim())
            .filter(Boolean);
        const fromCards = (retencaoData || []).map(r => String(r?.vendedor || '').trim()).filter(Boolean);
        return [...new Set([...fromDB, ...fromCards, loggedName])].filter(Boolean).sort();
    }, [usersDB, retencaoData, loggedName]);

    // Filtragem dos clientes na carteira
    const filteredList = useMemo(() => {
        return (retencaoData || []).filter(item => {
            if (filterVendedor !== 'TODOS') {
                if (String(item.vendedor || '').trim().toUpperCase() !== String(filterVendedor).trim().toUpperCase()) {
                    return false;
                }
            }
            if (filterOperacao !== 'TODOS' && item.tipoOperacao !== filterOperacao) {
                return false;
            }
            if (filterStatus !== 'TODOS' && (item.statusTrabalho || 'PARA_TRABALHAR') !== filterStatus) {
                return false;
            }
            if (filterOportunidade !== 'TODAS') {
                const servs = Array.isArray(item.servicos) ? item.servicos : [];
                if (filterOportunidade === 'FALTA_FIBRA' && servs.includes('FIBRA')) return false;
                if (filterOportunidade === 'FALTA_MOVEL' && servs.includes('MOVEL')) return false;
                if (filterOportunidade === 'FALTA_TVBOX' && servs.includes('TVBOX')) return false;
                if (filterOportunidade === 'JA_MULTI' && !servs.includes('COMBO_MULTI')) return false;
            }
            if (searchTerm.trim()) {
                const q = searchTerm.trim().toLowerCase();
                const matchNome = String(item.nome || '').toLowerCase().includes(q);
                const matchTel = String(item.celular || '').toLowerCase().includes(q) || String(item.celular || '').replace(/\D/g, '').includes(q);
                const matchVend = String(item.vendedor || '').toLowerCase().includes(q);
                const matchObs = String(item.observacao || '').toLowerCase().includes(q);
                if (!matchNome && !matchTel && !matchVend && !matchObs) return false;
            }
            return true;
        });
    }, [retencaoData, filterVendedor, filterOperacao, filterStatus, filterOportunidade, searchTerm]);

    // Métricas Resumo
    const stats = useMemo(() => {
        const base = filterVendedor === 'TODOS'
            ? (retencaoData || [])
            : (retencaoData || []).filter(i => String(i.vendedor || '').trim().toUpperCase() === String(filterVendedor).trim().toUpperCase());

        const total = base.length;
        const simplifica = base.filter(i => i.tipoOperacao === 'SIMPLIFICA').length;
        const netsales = base.filter(i => i.tipoOperacao === 'NETSALES').length;
        const paraTrabalhar = base.filter(i => (i.statusTrabalho || 'PARA_TRABALHAR') === 'PARA_TRABALHAR').length;
        const convertidos = base.filter(i => i.statusTrabalho === 'CONVERTIDO').length;

        return { total, simplifica, netsales, paraTrabalhar, convertidos };
    }, [retencaoData, filterVendedor]);

    return (
        <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-5 pb-6 animate-fade-in font-sans">
            {/* CABEÇALHO E KPIs DA CENTRAL DE RETENÇÃO */}
            <div className="w-full max-w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E3000F] to-red-700 text-white flex items-center justify-center shadow-md shadow-red-600/20 shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                                    Central de Retenção & Pós-Venda
                                </h2>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#E3000F]/10 text-[#E3000F] border border-[#E3000F]/20">
                                    Carteira de Oportunidades
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5 leading-relaxed">
                                Registre descontos de retenção pós-venda e construa sua carteira inteligente para ofertar novos serviços futuramente.
                            </p>
                        </div>
                    </div>

                    {/* MINI CARDS DE MÉTRICAS RÁPIDAS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full xl:w-auto shrink-0">
                        <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/70 min-w-[105px]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block truncate">Carteira Total</span>
                            <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums">{stats.total}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 min-w-[105px]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">P/ Trabalhar</span>
                            <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 tabular-nums">{stats.paraTrabalhar}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 min-w-[105px]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">Simplifica / Net</span>
                            <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300 tabular-nums">{stats.simplifica} / {stats.netsales}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 min-w-[105px]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Convertidos</span>
                            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{stats.convertidos}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCO 1: FORMULÁRIO LÚDICO E ELEGANTE DE REGISTRO DE RETENÇÃO */}
            <div className="w-full max-w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-neutral-50 via-red-50/30 to-neutral-50 dark:from-neutral-800/70 dark:via-[#E3000F]/10 dark:to-neutral-800/70 border-b border-neutral-200 dark:border-neutral-800 rounded-t-2xl flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                        <Sparkles size={16} className="text-[#E3000F] shrink-0" />
                        <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider truncate">
                            {editingId ? 'Editar Ficha de Retenção do Cliente' : '1. Novo Registro de Retenção Pós-Venda'}
                        </h3>
                    </div>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-xs font-bold text-neutral-500 hover:text-[#E3000F] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                            <X size={14} /> Cancelar Edição
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* CAMPO 1: NOME (OPCIONAL) */}
                        <div className="min-w-0 space-y-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1.5 truncate">
                                    <User size={13} className="text-[#E3000F] shrink-0" /> Nome do Cliente
                                </span>
                                <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">
                                    OPCIONAL
                                </span>
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Maria Aparecida (opcional)"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white placeholder:font-normal placeholder:text-neutral-400 outline-none focus:border-[#E3000F] transition-all uppercase"
                            />
                        </div>

                        {/* CAMPO 2: CELULAR / LINHA TITULAR (OBRIGATÓRIO) */}
                        <div className="min-w-0 space-y-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1.5 truncate">
                                    <Phone size={13} className="text-[#E3000F] shrink-0" /> Celular (Linha Titular)
                                </span>
                                <span className="text-[9px] font-extrabold text-[#E3000F] bg-red-50 dark:bg-[#E3000F]/15 px-1.5 py-0.5 rounded shrink-0">
                                    OBRIGATÓRIO
                                </span>
                            </label>
                            <input
                                type="tel"
                                value={celular}
                                onChange={(e) => setCelular(applyPhoneMask(e.target.value))}
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white placeholder:font-normal placeholder:text-neutral-400 outline-none focus:border-[#E3000F] transition-all tabular-nums tracking-wide"
                            />
                        </div>

                        {/* CAMPO 3: TIPO DE OPERAÇÃO (SIMPLIFICA OU NETSALES) */}
                        <div className="min-w-0 sm:col-span-2 lg:col-span-1 space-y-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                                <Layers size={13} className="text-[#E3000F] shrink-0" /> Tipo de Operação <span className="text-[#E3000F]">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['SIMPLIFICA', 'NETSALES'].map((op) => {
                                    const active = tipoOperacao === op;
                                    return (
                                        <button
                                            key={op}
                                            type="button"
                                            onClick={() => setTipoOperacao(op)}
                                            className={`py-2.5 px-2.5 rounded-xl border-2 font-extrabold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                                                active
                                                    ? 'bg-[#E3000F] text-white border-[#E3000F] shadow-sm'
                                                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-[#E3000F]/50'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-neutral-400'}`} />
                                            <span className="truncate">{op}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* CAMPO 4: SELEÇÃO LÚDICA DO QUE O CLIENTE POSSUI */}
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-[#E3000F] shrink-0" />
                                <span>O que o cliente já possui atualmente?</span>
                            </label>
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                Selecione os produtos ativos do cliente
                            </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {SERVICOS_CATALOGO.map((serv) => {
                                const IconComp = serv.icon;
                                const isSelected = servicosAtuais.includes(serv.id);
                                return (
                                    <button
                                        key={serv.id}
                                        type="button"
                                        onClick={() => toggleServico(serv.id)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 min-w-0 ${
                                            isSelected
                                                ? serv.activeClass
                                                : 'bg-neutral-50/80 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected ? 'bg-white/90 dark:bg-neutral-900/80 shadow-sm' : 'bg-neutral-200/70 dark:bg-neutral-700/50'
                                            }`}>
                                                <IconComp size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-black uppercase tracking-wide truncate">
                                                    {serv.label}
                                                </div>
                                                <div className="text-[10px] font-medium opacity-80 truncate">
                                                    {serv.sub}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            isSelected ? 'border-current bg-current' : 'border-neutral-300 dark:border-neutral-600'
                                        }`}>
                                            {isSelected && <Check size={10} strokeWidth={3} className="text-white dark:text-neutral-950" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PREVIEW INTELIGENTE DE OPORTUNIDADE FUTURA + OBSERVAÇÃO OPCIONAL */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center pt-1">
                        <div className="xl:col-span-6 p-3 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-red-50/60 dark:from-amber-950/25 dark:via-neutral-800/60 dark:to-[#E3000F]/10 border border-amber-200/80 dark:border-amber-700/40 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <Sparkles size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0">
                                        Oferta Futura
                                    </span>
                                    <span className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                                        {previewSugestao.titulo}
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium mt-0.5 line-clamp-1">
                                    {previewSugestao.descricao}
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
                            <input
                                type="text"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                placeholder="Detalhe opcional (ex: Desc. R$ 20 aplicado)..."
                                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 placeholder:font-normal outline-none focus:border-[#E3000F]"
                            />
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E3000F] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                            >
                                <Plus size={16} />
                                <span>{editingId ? 'Salvar Alterações' : 'Criar Espaço do Cliente'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* BLOCO 2: ESPAÇO DOS CLIENTES PARA TRABALHAR FUTURAMENTE */}
            <div className="w-full max-w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <Flame size={18} className="text-[#E3000F] shrink-0" />
                            <span>2. Espaço do Cliente — Carteira Pós-Venda & Oferta Futura</span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {filteredList.length}
                            </span>
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                            Clientes fidelizados na retenção prontos para relacionamento e oferta futura.
                        </p>
                    </div>

                    {/* BARRA DE BUSCA E FILTROS RESPONSIVA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 w-full xl:w-auto">
                        <div className="relative sm:col-span-2 lg:w-52">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar nome ou celular..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                            />
                        </div>

                        <select
                            value={filterOperacao}
                            onChange={(e) => setFilterOperacao(e.target.value)}
                            className="w-full lg:w-auto px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="TODOS">Operação: Todas</option>
                            <option value="SIMPLIFICA">SIMPLIFICA</option>
                            <option value="NETSALES">NETSALES</option>
                        </select>

                        <select
                            value={filterOportunidade}
                            onChange={(e) => setFilterOportunidade(e.target.value)}
                            className="w-full lg:w-auto px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="TODAS">Oportunidade: Todas</option>
                            <option value="FALTA_FIBRA">Ofertar FIBRA</option>
                            <option value="FALTA_MOVEL">Ofertar MÓVEL</option>
                            <option value="FALTA_TVBOX">Ofertar TVBOX</option>
                            <option value="JA_MULTI">Clientes Multi</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full lg:w-auto px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="TODOS">Status: Todos</option>
                            <option value="PARA_TRABALHAR">Para Trabalhar</option>
                            <option value="EM_CONTATO">Em Negociação</option>
                            <option value="CONVERTIDO">Convertido</option>
                        </select>

                        {canViewAll && (
                            <select
                                value={filterVendedor}
                                onChange={(e) => setFilterVendedor(e.target.value)}
                                className="w-full lg:w-auto px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 outline-none cursor-pointer"
                            >
                                <option value="TODOS">Consultor: Todos</option>
                                {listaVendedores.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* GRADE DE ESPAÇOS DOS CLIENTES */}
                {filteredList.length === 0 ? (
                    <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] flex items-center justify-center mx-auto mb-2.5">
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-neutral-800 dark:text-neutral-100">
                            Nenhum cliente na carteira com este filtro
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1">
                            Utilize o painel acima para registrar um atendimento de retenção pós-venda e criar automaticamente o espaço futuro do cliente.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {filteredList.map((item) => {
                            const servicos = Array.isArray(item.servicos) ? item.servicos : [];
                            const sugestao = gerarSugestaoFutura(servicos);
                            const stKey = item.statusTrabalho || 'PARA_TRABALHAR';
                            const stObj = STATUS_TRABALHO[stKey] || STATUS_TRABALHO.PARA_TRABALHAR;
                            const StatusIcon = stObj.icon;

                            return (
                                <div
                                    key={item.id}
                                    className="min-w-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/40 hover:border-[#E3000F]/40 transition-all shadow-sm flex flex-col justify-between overflow-hidden"
                                >
                                    {/* TOPO DO CARD DO CLIENTE */}
                                    <div className="p-4 space-y-3 min-w-0">
                                        <div className="flex items-start justify-between gap-2 min-w-0">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                        item.tipoOperacao === 'NETSALES'
                                                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25'
                                                            : 'bg-[#E3000F]/15 text-[#E3000F] border border-[#E3000F]/25'
                                                    }`}>
                                                        {item.tipoOperacao || 'SIMPLIFICA'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1 ${stObj.badge}`}>
                                                        <StatusIcon size={10} />
                                                        {stObj.label}
                                                    </span>
                                                </div>

                                                <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-1.5 truncate" title={item.nome}>
                                                    {item.nome || 'CLIENTE PÓS-VENDA'}
                                                </h4>

                                                {/* LINHA TITULAR COM COPIAR E WHATSAPP */}
                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                    <span className="text-xs sm:text-sm font-black text-[#E3000F] tabular-nums tracking-wide">
                                                        {item.celular}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyPhone(item.id, item.celular)}
                                                        className="p-1 rounded-md bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                                                        title="Copiar Linha Titular"
                                                    >
                                                        {copiedId === item.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenWhatsApp(item)}
                                                        className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                                        title="Chamar cliente no WhatsApp"
                                                    >
                                                        <MessageCircle size={11} />
                                                        <span>WhatsApp</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AÇÕES DE EDITAR E EXCLUIR */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                                    title="Editar dados do cliente"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                    title="Remover da carteira"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* SERVIÇOS QUE O CLIENTE JÁ POSSUI */}
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                                                O que o cliente possui:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {SERVICOS_CATALOGO.map(sc => {
                                                    if (!servicos.includes(sc.id)) return null;
                                                    const SIcon = sc.icon;
                                                    return (
                                                        <span
                                                            key={sc.id}
                                                            className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border inline-flex items-center gap-1 ${sc.badgeClass}`}
                                                        >
                                                            <SIcon size={12} />
                                                            {sc.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* RADAR DE TRABALHO FUTURO DO CLIENTE */}
                                        <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <Sparkles size={11} /> Próxima Oferta
                                                </span>
                                                <span className="text-[10px] font-extrabold text-[#E3000F] truncate">
                                                    {sugestao.destaque}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 leading-snug break-words">
                                                {sugestao.titulo}
                                            </p>

                                            {item.observacao && (
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800 break-words">
                                                    <strong>Retenção:</strong> {item.observacao}
                                                </p>
                                            )}

                                            {item.notaFutura && activeNoteId !== item.id && (
                                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-1 border-t border-neutral-100 dark:border-neutral-800 break-words">
                                                    <strong>Acompanhamento:</strong> {item.notaFutura}
                                                </p>
                                            )}

                                            {activeNoteId === item.id ? (
                                                <div className="pt-1.5 space-y-1.5">
                                                    <input
                                                        type="text"
                                                        value={noteDraft}
                                                        onChange={(e) => setNoteDraft(e.target.value)}
                                                        placeholder="Ex: Ligar dia 10 p/ ofertar Fibra..."
                                                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-white outline-none focus:border-[#E3000F]"
                                                    />
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveNoteId(null); setNoteDraft(''); }}
                                                            className="px-2 py-1 rounded-md text-[10px] font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveFollowUpNote(item.id)}
                                                            className="px-2.5 py-1 rounded-md bg-[#E3000F] text-white text-[10px] font-bold"
                                                        >
                                                            Salvar Nota
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveNoteId(item.id);
                                                        setNoteDraft(item.notaFutura || '');
                                                    }}
                                                    className="text-[11px] font-bold text-[#E3000F] hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                                                >
                                                    <FileText size={11} />
                                                    <span>{item.notaFutura ? 'Editar anotação futura' : '+ Anotar abordagem futura'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* RODAPÉ DO CARD: CONTROLE DE ESTÁGIO E METADADOS */}
                                    <div className="px-4 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/90 border-t border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1.5">
                                        <div className="grid grid-cols-3 gap-1">
                                            {Object.values(STATUS_TRABALHO).map((st) => {
                                                const isCurrent = stKey === st.id;
                                                return (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() => handleChangeStatus(item.id, st.id)}
                                                        className={`py-1 px-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer truncate ${
                                                            isCurrent
                                                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                                                                : 'bg-white/80 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        {st.shortLabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider pt-0.5 gap-2">
                                            <span className="truncate">Consultor: {item.vendedor || loggedName}</span>
                                            <span className="shrink-0">{item.dataCadastro || ''}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
