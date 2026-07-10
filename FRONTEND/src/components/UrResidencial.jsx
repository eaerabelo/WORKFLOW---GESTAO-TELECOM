import React, { useState } from 'react';
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import { Edit2, Save, X, Search, Calendar, Filter, Trash2, Home, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { applyCpfCnpjMask } from '../utils/masks';

export function UrResidencial({ salesData, setSalesData, globalUser, isGerente, usersDB = {}, globalMonth, setGlobalMonth }) {
    const isLideranca = isGerente || ['SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
    
    const isVendedor = globalUser?.role === 'VENDEDOR';
    const loggedName = String(globalUser?.name || '');
    const [sellerFilter, setSellerFilter] = useState(isVendedor ? loggedName : '');
  
    const monthFilter = globalMonth;
    const setMonthFilter = setGlobalMonth;

    // OPÇÕES TRAVADAS DO SISTEMA
    const STATUS_OPTIONS = ['PEND.DE INSTALAÇÃO', 'CONECTADO', 'CANCELADO'];
    const AGENDAMENTO_OPTIONS = ['08:00 A 12:00', '12:00 A 15:00', '15:00 A 18:00'];
    const ACAO_OPTIONS = ['REAGENDADO', 'RETENÇÃO EM FALTA', 'DESISTIU'];

    const activeVendedoresOptions = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || ""))
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
        return p.includes('FIBRA') || p.includes('TV') || p.includes('FIXO') || p.includes('RESIDENCIAL') || p.includes('MESH');
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
                String(item.cpf || '').toLowerCase().includes(term) ||
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
        if (field === 'cpf') value = applyCpfCnpjMask(value);
        
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
            'CPF/CNPJ': item.cpf || '-',
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
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in transition-colors">
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
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
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
                            <button type="button" onClick={handleExportExcel} className="w-full sm:w-auto px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-xl hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center justify-center gap-2 whitespace-nowrap">Exportar Excel</button>
                        )}
                    </div>
                )}
            </div>

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
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">CPF/CNPJ</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Obs</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Ação</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-center sticky right-0 bg-[#E3000F] shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">Editar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="14" className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">
                                            Nenhuma venda residencial registrada neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <tr key={item.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900">
                                                {/* REGRAS DE BLOQUEIO DE CAMPO (GESTOR) APLICADOS AQUI */}
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
                                                    {isEditing ? <input type="date" value={editForm.dataInstalacao || ''} onChange={(e) => handleChange(e, 'dataInstalacao')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer focus:border-[#E3000F]" /> : <span className="text-neutral-700 dark:text-neutral-300">{item.dataInstalacao ? new Date(item.dataInstalacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>}
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
                                                    {isEditing ? <input type="text" value={editForm.cpf || ''} onChange={(e) => handleChange(e, 'cpf')} disabled={!isLideranca} className={`w-32 px-2 py-1 border rounded ${!isLideranca ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-transparent' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 outline-none'}`} /> : <span className="font-mono text-neutral-600 dark:text-neutral-400">{item.cpf || '-'}</span>}
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
                                                            <button onClick={handleSave} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"><Save size={16} /></button>
                                                            <button onClick={handleCancel} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                            {isLideranca && (
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
        </div>
    );
} 