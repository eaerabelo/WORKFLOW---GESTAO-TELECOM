import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getFirstName } from '../utils/nameFormatter.js';
import {
    Edit2, Save, X, Search, Filter, Trash2, Home,
    Lock, MessageCircle, MapPin, Loader2, Send, Share2, AlertTriangle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { applyPhoneMask, getTodaySP } from '../utils/masks';
import { getCurrentStoreName } from '../utils/stores.js';

// Calcula quantos dias se passaram desde a data de agendamento/instalação (ou data da venda) até hoje
export const getUrOverdueDays = (item) => {
    if (!item) return 0;
    const status = String(item.statusUr || 'PEND.DE INSTALAÇÃO').trim().toUpperCase();
    if (status === 'CONECTADO' || status === 'CANCELADO') return 0;

    const rawDate = item.dataInstalacao || item.data || '';
    if (!rawDate) return 0;

    let isoDate = '';
    if (typeof rawDate === 'string' && rawDate.includes('-')) {
        isoDate = rawDate.slice(0, 10);
    } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (!isoDate) return 0;

    const todayIso = getTodaySP();
    const startMs = new Date(`${isoDate}T12:00:00`).getTime();
    const todayMs = new Date(`${todayIso}T12:00:00`).getTime();
    if (isNaN(startMs) || isNaN(todayMs)) return 0;

    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24));
    return diffDays;
};

const formatCepMask = (val) => {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
};

const formatStoreDisplayName = () => {
    const raw = String(getCurrentStoreName() || 'LP RAPOSO').trim();
    const cleaned = raw.replace(/^LP\s+/i, '').trim();
    if (!cleaned) return 'Loja Claro Raposo';
    const titleCase = cleaned
        .toLowerCase()
        .split(' ')
        .map(w => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(' ');
    return `Loja Claro ${titleCase}`;
};

const formatPeriodoTexto = (agendamento) => {
    const ag = String(agendamento || '').trim().toUpperCase();
    if (ag === '08:00 A 12:00') return '08h as 12h';
    if (ag === '12:00 A 15:00') return '12h as 15h';
    if (ag === '15:00 A 18:00') return '15h as 18h';
    if (!ag) return '12h as 15h';
    return ag.toLowerCase();
};

const formatDiaMesTexto = (isoDate) => {
    if (!isoDate) return '__/__';
    if (typeof isoDate === 'string' && isoDate.includes('-')) {
        const parts = isoDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    }
    if (typeof isoDate === 'string' && isoDate.includes('/')) {
        const parts = isoDate.split('/');
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    }
    return String(isoDate);
};

const formatProdutoTextoWhatsApp = (produto) => {
    const p = String(produto || '').toUpperCase();
    if (p.includes('FIBRA') || p.includes('VIRTUA') || p.includes('BANDA LARGA')) return 'virtua';
    if (p.includes('SOUNDBOX')) return 'Claro Soundbox';
    if (p.includes('TV')) return 'Claro TV';
    if (p.includes('FIXO')) return 'Claro Fixo';
    if (p.includes('MESH')) return 'Wi-Fi Mesh';
    return 'virtua';
};

export function UrResidencial({ salesData, setSalesData, globalUser, isGerente, usersDB = {}, globalMonth }) {
    const userRoleUpper = String(globalUser?.role || 'VENDEDOR').trim().toUpperCase();
    const isVendedor = userRoleUpper === 'VENDEDOR';
    // Botão de encaminhamento disponível para TODOS os cargos MENOS VENDEDOR
    const canForwardWhatsApp = !isVendedor;
    const isLideranca = isGerente || ['SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'ADM', 'GEEK', 'COORDENADOR', 'ESPECIALISTA', 'CAIXA'].includes(userRoleUpper);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);

    // Estado do Modal de Compartilhamento WhatsApp com busca de CEP via API
    const [whatsModalItem, setWhatsModalItem] = useState(null);
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [whatsForm, setWhatsForm] = useState({
        nomeCliente: '',
        celular: '',
        dataInstalacao: '',
        agendamento: '12:00 A 15:00',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: 'SP'
    });

    const loggedName = String(globalUser?.name || '');
    const [sellerFilter, setSellerFilter] = useState(isVendedor ? loggedName : '');

    const monthFilter = globalMonth;

    // OPÇÕES TRAVADAS DO SISTEMA
    const STATUS_OPTIONS = ['PEND.DE INSTALAÇÃO', 'CONECTADO', 'CANCELADO'];
    const AGENDAMENTO_OPTIONS = ['08:00 A 12:00', '12:00 A 15:00', '15:00 A 18:00'];
    const ACAO_OPTIONS = ['REAGENDADO', 'RETENÇÃO EM FALTA', 'DESISTIU'];

    const activeVendedoresOptions = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || ''))
        .filter(Boolean);

    const historicalVendedoresOptions = (salesData || []).map(s => String(s.vendedor || '')).filter(Boolean);

    const VENDEDORES_OPTIONS = [...new Set([...activeVendedoresOptions, ...historicalVendedoresOptions])].sort();

    const RESIDENTIAL_PRODUCTS = [
        'FIBRA 350 MEGAS', 'FIBRA 500 MEGAS', 'FIBRA 750 MEGAS', 'FIBRA 1 GIGA',
        'CLARO TV+', 'FIXO ILIMITADO BRASIL', 'PONTO ADICIONAL', 'MESH', 'EXTENSOR WIFI'
    ];

    const getCidadePorContrato = (contrato) => {
        if (!contrato || contrato === '-') return '';
        const prefix = String(contrato).replace(/\D/g, '').substring(0, 3);
        if (prefix === '924') return 'OSASCO';
        if (prefix === '003') return 'SÃO PAULO';
        if (prefix === '443') return 'BARUERI';
        if (prefix === '533') return 'CARAPICUIBA';
        return '';
    };

    // Identifica automaticamente se a venda possui caráter residencial
    const isResidential = (produto) => {
        const p = String(produto || '').toUpperCase();
        return p.includes('FIBRA') || p.includes('TV') || p.includes('SOUNDBOX') || p.includes('FIXO') || p.includes('RESIDENCIAL') || p.includes('MESH') || p.includes('PONTO ADICIONAL');
    };

    // Filtrando a Base Central de Vendas para exibir somente UR-RESIDENCIAL
    const filteredData = (salesData || []).filter(item => {
        if (!isResidential(item.produto)) return false;

        if (sellerFilter && item.vendedor !== sellerFilter) {
            return false;
        }

        if (searchTerm) {
            const term = String(searchTerm).toLowerCase();
            const dataVendaBr = typeof item.data === 'string' && item.data.includes('-') ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : String(item.data || '');
            const dataInstBr = item.dataInstalacao ? new Date(item.dataInstalacao + 'T12:00:00').toLocaleDateString('pt-BR') : '';

            return (
                String(item.contrato || '').toLowerCase().includes(term) ||
                String(item.celular || item.cpf || '').toLowerCase().includes(term) ||
                String(item.nomeCliente || '').toLowerCase().includes(term) ||
                String(item.cidade || '').toLowerCase().includes(term) ||
                String(item.vendedor || '').toLowerCase().includes(term) ||
                String(item.produto || '').toLowerCase().includes(term) ||
                String(item.statusUr || 'PEND.DE INSTALAÇÃO').toLowerCase().includes(term) ||
                String(item.agendamento || '').toLowerCase().includes(term) ||
                dataVendaBr.includes(term) ||
                dataInstBr.includes(term) ||
                String(item.data || '').includes(term) ||
                String(item.dataInstalacao || '').includes(term)
            );
        }
        return true;
    });

    const summaryCount = { pendente: 0, conectado: 0, cancelado: 0, total: 0 };
    filteredData.forEach(item => {
        const q = item.qtda === 0 || item.qtda === '0' ? 0 : (Number(item.qtda) || 1);
        summaryCount.total += q;
        const status = item.statusUr || 'PEND.DE INSTALAÇÃO';
        if (status === 'PEND.DE INSTALAÇÃO') summaryCount.pendente += q;
        else if (status === 'CONECTADO') summaryCount.conectado += q;
        else if (status === 'CANCELADO') summaryCount.cancelado += q;
    });

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({ ...item, cidade: item.cidade || getCidadePorContrato(item.contrato) });
    };

    const handleSave = () => {
        setSalesData(prev => prev.map(item => item.id === editingId ? { ...item, ...editForm } : item));
        setEditingId(null);
        toast.success('Dados residenciais atualizados!');
    };

    const handleDelete = (id) => {
        if (!isLideranca) return;
        if (window.confirm('Atenção Liderança: Tem certeza que deseja apagar este registro de residencial?')) {
            setSalesData(prev => prev.filter(item => item.id !== id));
            toast.success('Registro apagado com sucesso!');
        }
    };

    const handleCancel = () => setEditingId(null);

    const handleChange = (e, field) => {
        let value = e.target.value;
        if (field === 'celular' || field === 'cpf') value = applyPhoneMask(value);

        setEditForm(prev => {
            const nextForm = { ...prev, [field]: value };
            if (field === 'contrato') {
                const autoCidade = getCidadePorContrato(value);
                if (autoCidade) {
                    nextForm.cidade = autoCidade;
                }
            }
            if (field === 'statusUr') {
                if (value === 'CANCELADO') {
                    nextForm.qtda = 0;
                    nextForm.receita = 0;
                    nextForm.comissao = 0;
                    nextForm.valorBruto = 0;
                } else if (prev.statusUr === 'CANCELADO' && value !== 'CANCELADO') {
                    if (nextForm.qtda == 0) nextForm.qtda = 1;
                }
            }
            return nextForm;
        });
    };

    // Abre o modal de encaminhamento WhatsApp (Exclusivo ao clicar em Compartilhar Contrato via WhatsApp)
    const handleOpenWhatsModal = (item) => {
        if (!canForwardWhatsApp) return;
        const target = item || filteredData[0];
        if (!target) {
            toast.error('Nenhum lançamento residencial disponível para compartilhar.');
            return;
        }
        setWhatsModalItem(target);
        setWhatsForm({
            nomeCliente: target.nomeCliente || '',
            celular: target.celular || target.cpf || '',
            dataInstalacao: target.dataInstalacao || '',
            agendamento: target.agendamento || '12:00 A 15:00',
            cep: target.cepInstalacao || '',
            logradouro: target.logradouroInstalacao || '',
            numero: target.numeroInstalacao || '',
            complemento: target.complementoInstalacao || '',
            bairro: target.bairroInstalacao || '',
            cidade: target.cidade || getCidadePorContrato(target.contrato) || 'SAO PAULO',
            uf: target.ufInstalacao || 'SP'
        });
    };

    // Consulta automática de CEP via API ViaCEP
    const fetchCepApi = async (rawCep) => {
        const cleanCep = String(rawCep || '').replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (data && !data.erro) {
                setWhatsForm(prev => ({
                    ...prev,
                    cep: formatCepMask(cleanCep),
                    logradouro: String(data.logradouro || prev.logradouro || '').toUpperCase(),
                    bairro: String(data.bairro || prev.bairro || '').toUpperCase(),
                    cidade: String(data.localidade || prev.cidade || '').toUpperCase(),
                    uf: String(data.uf || prev.uf || 'SP').toUpperCase()
                }));
                toast.success('Endereço preenchido automaticamente pelo CEP!');
            } else {
                toast.error('CEP não encontrado. Verifique os dígitos.');
            }
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
            toast.error('Não foi possível consultar o CEP no momento.');
        } finally {
            setIsLoadingCep(false);
        }
    };

    const handleWhatsCepChange = (e) => {
        const masked = formatCepMask(e.target.value);
        setWhatsForm(prev => ({ ...prev, cep: masked }));
        const digits = masked.replace(/\D/g, '');
        if (digits.length === 8) {
            fetchCepApi(digits);
        }
    };

    // Monta o texto padrão exato solicitado para confirmação de instalação residencial
    const buildWhatsAppConfirmationText = (formState, itemRef) => {
        const nomeCliente = String(formState.nomeCliente || 'CLIENTE').trim().toUpperCase();
        const nomeLoja = formatStoreDisplayName();
        const produtoLabel = formatProdutoTextoWhatsApp(itemRef?.produto);
        const diaMes = formatDiaMesTexto(formState.dataInstalacao);
        const periodo = formatPeriodoTexto(formState.agendamento);
        const rua = String(formState.logradouro || 'R ROSARIA ANA BARBOSA').trim().toUpperCase();
        const num = String(formState.numero || 'S/N').trim().toUpperCase();
        const compl = String(formState.complemento || '').trim().toUpperCase();
        const bairro = String(formState.bairro || 'BAIRRO').trim().toUpperCase();
        const cidade = String(formState.cidade || 'SAO PAULO').trim().toUpperCase();
        const uf = String(formState.uf || 'SP').trim().toUpperCase();
        const cep = String(formState.cep || '00000-000').trim();

        const linhaEndereco = compl
            ? `${rua},    ${num},  ${compl}`
            : `${rua},    ${num}`;

        return `Sr ${nomeCliente} sou da ${nomeLoja}, estou entrando em contato para confirmar o agendamento para instalar de um ${produtoLabel} no dia ${diaMes} no período das ${periodo} No endereço: ${linhaEndereco}\n${bairro} - ${cidade}/${uf}\n${cep}, disponibilizamos o APP Minha Claro  para acompanhamento do técnico responsável, além de várias outras funcionalidades`;
    };

    const handleConfirmAndSendWhatsApp = (e) => {
        e.preventDefault();
        if (!whatsModalItem) return;

        if (!whatsForm.cep || !whatsForm.logradouro || !whatsForm.numero) {
            toast.error('Preencha o CEP e o Número do endereço para montar a confirmação.');
            return;
        }

        // Salva os dados adicionais do endereço e agendamento no registro da venda
        setSalesData(prev => prev.map(item => {
            if (item.id !== whatsModalItem.id) return item;
            return {
                ...item,
                nomeCliente: whatsForm.nomeCliente.trim().toUpperCase(),
                celular: whatsForm.celular,
                dataInstalacao: whatsForm.dataInstalacao,
                agendamento: whatsForm.agendamento,
                cidade: whatsForm.cidade.trim().toUpperCase() || item.cidade,
                cepInstalacao: whatsForm.cep,
                logradouroInstalacao: whatsForm.logradouro.trim().toUpperCase(),
                numeroInstalacao: whatsForm.numero.trim().toUpperCase(),
                complementoInstalacao: whatsForm.complemento.trim().toUpperCase(),
                bairroInstalacao: whatsForm.bairro.trim().toUpperCase(),
                ufInstalacao: whatsForm.uf.trim().toUpperCase()
            };
        }));

        const mensagem = buildWhatsAppConfirmationText(whatsForm, whatsModalItem);
        const cleanPhone = String(whatsForm.celular || '').replace(/\D/g, '');
        const fullPhone = cleanPhone.length >= 10
            ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`)
            : '';

        const url = fullPhone
            ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensagem)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;

        window.open(url, '_blank', 'noopener,noreferrer');
        setWhatsModalItem(null);
        toast.success('Confirmação gerada e encaminhada para o WhatsApp!');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PEND.DE INSTALAÇÃO': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'CONECTADO': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        }
    };

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            toast.error('Nenhum dado para exportar no período selecionado.');
            return;
        }

        const dataToExport = filteredData.map(item => ({
            'Contrato': item.contrato || '-',
            'Cidade': item.cidade || getCidadePorContrato(item.contrato) || '-',
            'Data': typeof item.data === 'string' && item.data.includes('-') ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : item.data,
            'Data Inst.': item.dataInstalacao ? new Date(item.dataInstalacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
            'Vendedor': item.vendedor,
            'Produto': item.produto,
            'Qtda': item.qtda,
            'Status': item.statusUr || 'PEND.DE INSTALAÇÃO',
            'Agendamento': item.agendamento || '-',
            'Nome Cliente': item.nomeCliente || '-',
            'Celular': item.celular || item.cpf || '-',
            'CEP': item.cepInstalacao || '-',
            'Endereço': item.logradouroInstalacao ? `${item.logradouroInstalacao}, ${item.numeroInstalacao || ''} ${item.complementoInstalacao || ''}` : '-',
            'Obs': item.obsUr || '-',
            'Ação': item.acaoUr || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "UR Residencial");
        XLSX.writeFile(workbook, `Relatorio_UR_Residencial_${monthFilter || 'Geral'}.xlsx`);
        toast.success('Relatório exportado com sucesso!');
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
            {/* CABEÇALHO DA SEÇÃO */}
            <div className="p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Home size={22} />
                    </div>
                    <div
                        onDoubleClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
                        className="cursor-pointer select-none hover:text-[#E3000F] transition-colors"
                        title="Duplo clique para expandir/recolher as opções"
                    >
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 inherit">Acompanhamento UR-Residencial</h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Controle de instalações e acompanhamento de Vendas Residenciais</p>
                    </div>
                </div>

                {!isOptionsCollapsed && (
                    <div className="flex flex-col sm:flex-row flex-wrap w-full lg:w-auto gap-2.5 items-stretch sm:items-center">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar Contrato, Cliente, Status, Produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all"
                            />
                        </div>
                        <div className={`relative w-full sm:w-auto flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 focus-within:border-[#E3000F] focus-within:ring-1 focus-within:ring-[#E3000F] transition-all ${isVendedor ? 'opacity-80' : ''}`}>
                            {isVendedor ? <Lock className="text-[#E3000F] shrink-0" size={16} title="Acesso restrito aos seus próprios dados" /> : <Filter className="text-neutral-400 dark:text-neutral-500 shrink-0" size={16} />}
                            <select
                                value={sellerFilter}
                                onChange={(e) => setSellerFilter(e.target.value)}
                                disabled={isVendedor}
                                className={`w-full sm:w-40 bg-transparent py-2 pl-2 pr-1 text-sm text-neutral-800 dark:text-neutral-100 outline-none ${isVendedor ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {!isVendedor && <option className="bg-white dark:bg-neutral-900" value="">Todos Vendedores</option>}
                                {isVendedor
                                    ? <option className="bg-white dark:bg-neutral-900" value={loggedName}>{loggedName}</option>
                                    : VENDEDORES_OPTIONS.map(v => <option className="bg-white dark:bg-neutral-900" key={v} value={v}>{getFirstName(v)}</option>)
                                }
                            </select>
                        </div>

                        {isLideranca && (
                            <button type="button" onClick={handleExportExcel} className="w-full sm:w-auto px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-xl hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">Exportar Excel</button>
                        )}
                    </div>
                )}
            </div>

            {/* ALERTA DE PENDENTES HÁ 5+ DIAS SEM CONEXÃO */}
            {(() => {
                const overdueList = filteredData.filter(item => getUrOverdueDays(item) >= 5);
                if (overdueList.length === 0) return null;
                return (
                    <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                        <div className="flex items-start sm:items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                                    Atenção aos Pendentes de Instalação ({overdueList.length} {overdueList.length === 1 ? 'contrato com 5+ dias' : 'contratos com 5+ dias'})
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300/90">
                                    Contratos com agendamento há 5 dias ou mais que ainda não constam como <strong>CONECTADO</strong>. Verifique e atualize o status!
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSearchTerm('PEND.DE INSTALAÇÃO')}
                            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                        >
                            Filtrar Pendentes
                        </button>
                    </div>
                );
            })()}

            {/* TABELA ESTILO EXCEL */}
            <div className="flex-1 overflow-auto p-4 bg-neutral-100/30 dark:bg-neutral-950/50 flex flex-col">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1">
                    <div className="overflow-x-auto flex-1 min-h-[300px]">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="bg-[#E3000F] text-white">
                                <tr>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Contrato</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Cidade</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Data</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Data Inst.</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Vendedor</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Produto</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Qtda</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30 text-center">Status</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Agendamento</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Nome Cliente</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Celular</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Obs</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Ação</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-center sticky right-0 bg-[#E3000F] shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">
                                        {canForwardWhatsApp ? 'WhatsApp / Editar' : 'Editar'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">
                                            Nenhuma venda residencial registrada neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <tr key={item.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900">
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.contrato || ''} onChange={(e) => handleChange(e, 'contrato')} disabled={!isLideranca} className={`w-28 px-2 py-1 border rounded ${!isLideranca ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-transparent' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 focus:border-[#E3000F] outline-none'}`} /> : <span className="font-mono text-neutral-700 dark:text-neutral-300">{item.contrato || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.cidade || ''} onChange={(e) => handleChange(e, 'cidade')} className="w-24 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]" /> : <span className="text-neutral-700 dark:text-neutral-300">{item.cidade || getCidadePorContrato(item.contrato) || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="date" value={editForm.data || ''} onChange={(e) => handleChange(e, 'data')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]" /> : <span className="text-neutral-600 dark:text-neutral-400">{typeof item.data === 'string' && item.data.includes('-') ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : item.data}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? (
                                                        <input type="date" value={editForm.dataInstalacao || ''} onChange={(e) => handleChange(e, 'dataInstalacao')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer focus:border-[#E3000F]" />
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                                                                {item.dataInstalacao ? new Date(item.dataInstalacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                                            </span>
                                                            {item.baixaImediata && (
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase">
                                                                    Baixa Imediata
                                                                </span>
                                                            )}
                                                            {getUrOverdueDays(item) >= 5 && (
                                                                <span
                                                                    className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold flex items-center gap-1 animate-pulse"
                                                                    title={`Contrato não conectado há ${getUrOverdueDays(item)} dias desde o agendamento!`}
                                                                >
                                                                    <Clock size={10} /> +{getUrOverdueDays(item)}d Pendente
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.vendedor || ''} onChange={(e) => handleChange(e, 'vendedor')} className="w-28 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{VENDEDORES_OPTIONS.map(v => <option className="bg-white dark:bg-neutral-900" key={v} value={v}>{getFirstName(v)}</option>)}</select> : <span className="font-medium text-neutral-800 dark:text-neutral-200">{getFirstName(item.vendedor)}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.produto || ''} onChange={(e) => handleChange(e, 'produto')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{RESIDENTIAL_PRODUCTS.map(p => <option className="bg-white dark:bg-neutral-900" key={p} value={p}>{p}</option>)}</select> : <span className="text-neutral-700 dark:text-neutral-300">{item.produto}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800 text-center">
                                                    {isEditing ? <input type="number" value={editForm.qtda || ''} onChange={(e) => handleChange(e, 'qtda')} className="w-12 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="font-medium dark:text-neutral-200">{item.qtda}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800 text-center">
                                                    {isEditing ? <select value={editForm.statusUr || ''} onChange={(e) => handleChange(e, 'statusUr')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{STATUS_OPTIONS.map(s => <option className="bg-white dark:bg-neutral-900" key={s} value={s}>{s}</option>)}</select> : <span className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider ${getStatusStyle(item.statusUr || 'PEND.DE INSTALAÇÃO')}`}>{item.statusUr || 'PEND.DE INSTALAÇÃO'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.agendamento || ''} onChange={(e) => handleChange(e, 'agendamento')} className="w-32 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{AGENDAMENTO_OPTIONS.map(a => <option className="bg-white dark:bg-neutral-900" key={a} value={a}>{a}</option>)}</select> : <span className="text-neutral-700 dark:text-neutral-300">{item.agendamento || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.nomeCliente || ''} onChange={(e) => handleChange(e, 'nomeCliente')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="text-neutral-800 dark:text-neutral-200">{item.nomeCliente || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.celular || editForm.cpf || ''} onChange={(e) => handleChange(e, 'celular')} placeholder="(00) 00000-0000" disabled={!isLideranca} className={`w-36 px-2 py-1 border rounded ${!isLideranca ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-transparent' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 outline-none'}`} /> : <span className="font-mono text-neutral-600 dark:text-neutral-400">{item.celular || item.cpf || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.obsUr || ''} onChange={(e) => handleChange(e, 'obsUr')} className="w-36 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-[150px] inline-block" title={item.obsUr}>{item.obsUr || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.acaoUr || ''} onChange={(e) => handleChange(e, 'acaoUr')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{ACAO_OPTIONS.map(a => <option className="bg-white dark:bg-neutral-900" key={a} value={a}>{a}</option>)}</select> : <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">{item.acaoUr || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 text-center sticky right-0 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.2)] bg-white dark:bg-neutral-900 z-10">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={handleSave} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Salvar"><Save size={16} /></button>
                                                            <button onClick={handleCancel} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Cancelar"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {canForwardWhatsApp && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenWhatsModal(item)}
                                                                    className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                                                    title="Compartilhar Confirmação de Instalação via WhatsApp"
                                                                >
                                                                    <Share2 size={12} />
                                                                    <span>WhatsApp</span>
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar Linha"><Edit2 size={16} /></button>
                                                            {isLideranca && (
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row gap-2 justify-between items-center shrink-0">
                        <span>Mostrando 1 a {filteredData.length} de {filteredData.length} registros</span>
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 md:gap-4 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                            {summaryCount.pendente > 0 && <span>PEND: <span className="text-neutral-800 dark:text-neutral-200">{summaryCount.pendente}</span></span>}
                            {summaryCount.conectado > 0 && <span>CONEC: <span className="text-neutral-800 dark:text-neutral-200">{summaryCount.conectado}</span></span>}
                            {summaryCount.cancelado > 0 && <span>CANCE: <span className="text-neutral-800 dark:text-neutral-200">{summaryCount.cancelado}</span></span>}
                            {summaryCount.total > 0 && <span>QTDA: <span className="text-neutral-800 dark:text-neutral-200">{summaryCount.total}</span></span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE COMPARTILHAMENTO VIA WHATSAPP COM BUSCA DE CEP VIA API (RENDERIZADO NO DOCUMENT.BODY VIA PORTAL) */}
            {whatsModalItem && canForwardWhatsApp && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/65 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 bg-gradient-to-r from-[#25D366] to-emerald-700 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                                        Compartilhar Confirmação de Instalação (WhatsApp)
                                    </h3>
                                    <p className="text-xs text-emerald-50 font-medium">
                                        Contrato: <strong>{whatsModalItem.contrato || '-'}</strong> • Produto: <strong>{whatsModalItem.produto}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWhatsModalItem(null)}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmAndSendWhatsApp} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                            {/* SELETOR RÁPIDO DE CONTRATO CASO ABRA PELO TOPO */}
                            {filteredData.length > 1 && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Selecionar Lançamento / Contrato da Lista
                                    </label>
                                    <select
                                        value={whatsModalItem.id}
                                        onChange={(e) => {
                                            const found = filteredData.find(f => String(f.id) === String(e.target.value));
                                            if (found) handleOpenWhatsModal(found);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white outline-none cursor-pointer"
                                    >
                                        {filteredData.map(f => (
                                            <option key={f.id} value={f.id}>
                                                Contrato: {f.contrato || '-'} | {f.produto} | {f.nomeCliente || getFirstName(f.vendedor)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* DADOS DO CLIENTE E AGENDAMENTO */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Nome do Cliente <span className="text-[#E3000F]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={whatsForm.nomeCliente}
                                        onChange={(e) => setWhatsForm(prev => ({ ...prev, nomeCliente: e.target.value }))}
                                        placeholder="Ex: JOÃO DA SILVA"
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        WhatsApp do Cliente (com DDD)
                                    </label>
                                    <input
                                        type="tel"
                                        maxLength={15}
                                        value={whatsForm.celular}
                                        onChange={(e) => setWhatsForm(prev => ({ ...prev, celular: applyPhoneMask(e.target.value) }))}
                                        placeholder="(11) 99999-9999"
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-extrabold text-neutral-900 dark:text-white outline-none focus:border-emerald-500 tabular-nums"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Data da Instalação <span className="text-[#E3000F]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={whatsForm.dataInstalacao}
                                        onChange={(e) => setWhatsForm(prev => ({ ...prev, dataInstalacao: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Período do Agendamento <span className="text-[#E3000F]">*</span>
                                    </label>
                                    <select
                                        value={whatsForm.agendamento}
                                        onChange={(e) => setWhatsForm(prev => ({ ...prev, agendamento: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                        {AGENDAMENTO_OPTIONS.map(op => (
                                            <option key={op} value={op}>{op}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* SEÇÃO DE ENDEREÇO CONECTADA À API DE CEP */}
                            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/80 space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                        <MapPin size={15} /> Dados de Endereço da Instalação
                                    </span>
                                    {isLoadingCep && (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <Loader2 size={13} className="animate-spin" /> Consultando CEP...
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            CEP <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={9}
                                            value={whatsForm.cep}
                                            onChange={handleWhatsCepChange}
                                            placeholder="05373-000"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-extrabold text-neutral-900 dark:text-white outline-none focus:border-emerald-500 tabular-nums"
                                        />
                                    </div>

                                    <div className="sm:col-span-8 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            Rua / Logradouro <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={whatsForm.logradouro}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, logradouro: e.target.value }))}
                                            placeholder="Ex: R ROSARIA ANA BARBOSA"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-3 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            Número <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={whatsForm.numero}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, numero: e.target.value }))}
                                            placeholder="Ex: 108"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-extrabold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            Complemento
                                        </label>
                                        <input
                                            type="text"
                                            value={whatsForm.complemento}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, complemento: e.target.value }))}
                                            placeholder="Ex: CASA 3"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-5 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            Bairro <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={whatsForm.bairro}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, bairro: e.target.value }))}
                                            placeholder="Ex: JARDIM ESTER"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-9 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            Cidade <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={whatsForm.cidade}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, cidade: e.target.value }))}
                                            placeholder="Ex: SAO PAULO"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-3 space-y-1">
                                        <label className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                                            UF <span className="text-[#E3000F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={2}
                                            value={whatsForm.uf}
                                            onChange={(e) => setWhatsForm(prev => ({ ...prev, uf: e.target.value }))}
                                            placeholder="SP"
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PRÉVIA DA MENSAGEM PADRÃO QUE SERÁ ENVIADA */}
                            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                                    Prévia da Mensagem Padrão Formatada:
                                </span>
                                <pre className="text-xs font-medium text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed">
                                    {buildWhatsAppConfirmationText(whatsForm, whatsModalItem)}
                                </pre>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setWhatsModalItem(null)}
                                    className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Send size={16} />
                                    <span>Salvar Endereço & Enviar no WhatsApp</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
