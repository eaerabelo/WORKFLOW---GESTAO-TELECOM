import React, { useState, useEffect } from 'react';
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import { AlertOctagon, Plus, Search, Calendar, Edit3, Trash2, X, Lock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { applyCpfCnpjMask, getTodaySP } from '../utils/masks';

export function Reprovados({ reprovadosData, setReprovadosData, globalUser, isGerente, isVendedor, usersDB = {}, globalMonth }) {
    const activeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || ''))
        .filter(Boolean);
        
    const historicalVendedores = (reprovadosData || []).map(r => String(r.vendedor || '')).filter(Boolean);
    
    const safeVendedores = [...new Set([...activeVendedores, ...historicalVendedores])].sort();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [formError, setFormError] = useState('');
    const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);

    const RESIDENTIAL_PRODUCTS = [
        'FIBRA 350 MEGAS', 'FIBRA 500 MEGAS', 'FIBRA 750 MEGAS', 'FIBRA 1 GIGA',
        'CLARO TV+', 'FIXO ILIMITADO BRASIL', 'PONTO ADICIONAL', 'MESH', 'EXTENSOR WIFI'
    ];
    const MOTIVOS_OPTIONS = ['CRÉDITO REPROVADO', 'REPROVADO', 'CABEAMENTO', 'SOMENTE HFC'];

    const [formData, setFormData] = useState({
        data: getTodaySP(),
        vendedor: '',
        produto: '',
        motivo: '',
        cliente: '',
        cpf: '',
        cep: '',
        logradouro: '',
        numero: '',
        obs: ''
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    // Filtrando tabela via Mês e Termos de busca
    const filteredData = (reprovadosData || []).filter(item => {
        if (filterDate && item.data !== filterDate) {
            return false;
        }

        if (searchTerm) {
            const term = String(searchTerm).toLowerCase();
            return (
                String(item.cliente || '').toLowerCase().includes(term) ||
                String(item.cpf || '').toLowerCase().includes(term) ||
                String(item.logradouro || '').toLowerCase().includes(term)
            );
        }
        return true;
    });

    const canEditDelete = (item) => {
        if (isGerente || ['SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(globalUser?.role)) return true;
        if (isVendedor && (item.vendedor === globalUser?.name || item.vendedor === String(globalUser?.name || ''))) return true;
        return false;
    };

    const openModal = () => {
        setFormError('');
        setEditingId(null);
        setFormData({
            data: getTodaySP(),
            vendedor: (isVendedor && globalUser) ? String(globalUser?.name || '') : '',
            produto: '',
            motivo: '',
            cliente: '',
            cpf: '',
            cep: '',
            logradouro: '',
            numero: '',
            obs: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setFormError('');
        setEditingId(item.id);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja apagar este registro de reprovação?')) {
            setReprovadosData(prev => prev.filter(x => x.id !== id));
            toast.success('Registro excluído com sucesso!');
        }
    };

    const handleFormChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = applyCpfCnpjMask(value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepChange = async (e) => {
        let cep = e.target.value.replace(/\D/g, '');
        let formattedCep = cep;
        if (cep.length > 5) formattedCep = cep.replace(/^(\d{5})(\d)/, "$1-$2");
        
        setFormData(prev => ({ ...prev, cep: formattedCep }));

        // Integração Inteligente ViaCEP
        if (cep.length === 8) {
            setIsFetchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    if (data.uf === 'SP') {
                        setFormData(prev => ({ ...prev, logradouro: `${data.logradouro} - ${data.bairro}, ${data.localidade}/SP` }));
                    } else {
                        toast.error('O CEP informado não pertence ao Estado de São Paulo.');
                        setFormData(prev => ({ ...prev, logradouro: `${data.logradouro} - ${data.localidade}/${data.uf}` }));
                    }
                }
            } catch (err) {
                console.error('Falha ao buscar CEP', err);
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.data || !formData.vendedor || !formData.produto || !formData.motivo || !formData.cliente || !formData.cep) {
            setFormError('Preencha todas as informações obrigatórias indicadas com asterisco.');
            return;
        }

        if (editingId) {
            setReprovadosData(prev => prev.map(x => x.id === editingId ? { ...x, ...formData } : x));
            toast.success('Registro atualizado com sucesso!');
        } else {
            setReprovadosData(prev => [{ ...formData, id: Date.now() }, ...prev]);
            toast.success('Inviabilidade registrada com sucesso!');
        }
        setIsModalOpen(false);
    };

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            toast.error('Nenhum dado para exportar no período selecionado.');
            return;
        }
        
        const dataToExport = filteredData.map(item => ({
            'Data': typeof item.data === 'string' && item.data.includes('-') ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : item.data,
            'Vendedor': item.vendedor,
            'Produto': item.produto,
            'Motivo': item.motivo,
            'Cliente': item.cliente,
            'CPF/CNPJ': item.cpf || '-',
            'CEP': item.cep,
            'Logradouro': item.logradouro,
            'Nº': item.numero || 'S/N',
            'Observações': item.obs || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reprovados");
        XLSX.writeFile(workbook, `Relatorio_Reprovados_${filterDate || 'Geral'}.xlsx`);
        toast.success('Relatório exportado com sucesso!');
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full animate-fade-in transition-colors">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-white dark:bg-neutral-900 shrink-0">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                            <AlertOctagon size={22} />
                        </div>
                        <div 
                            onDoubleClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
                            className="cursor-pointer select-none hover:text-[#E3000F] transition-colors"
                            title="Duplo clique para expandir/recolher as opções"
                        >
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 inherit">Inviabilidade Residencial (Reprovados)</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Controle de vendas perdidas por problemas técnicos ou de crédito.</p>
                        </div>
                    </div>
                    {!isOptionsCollapsed && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center w-full lg:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                                <input type="text" placeholder="Buscar Cliente, CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-56 pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all" />
                            </div>
                            <div className="flex w-full sm:w-auto gap-2">
                                <div className="relative flex flex-1 items-center gap-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                                    <Calendar size={16} className="text-neutral-500" />
                                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="text-sm text-neutral-700 dark:text-neutral-300 outline-none bg-transparent font-medium cursor-pointer w-full" title="Filtrar por data" />
                                </div>
                                {isGerente && (
                                    <button type="button" onClick={handleExportExcel} className="flex-1 sm:flex-none px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-xl hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 flex items-center justify-center gap-2 whitespace-nowrap">Exportar Excel</button>
                                )}
                                <button onClick={openModal} className="flex-1 sm:flex-none px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center justify-center gap-2 whitespace-nowrap"><Plus size={16} /> Novo Registro</button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-auto bg-neutral-50/50 dark:bg-neutral-950/50 p-4">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                <thead className="bg-[#E3000F] dark:bg-red-900 text-white">
                                    <tr>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Data</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Vendedor</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Produto</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Motivo</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Cliente</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">CPF/CNPJ</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">CEP</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Logradouro</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Nº</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Observações</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-center sticky right-0 bg-[#E3000F] shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr><td colSpan="11" className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">Nenhum registro reprovado encontrado.</td></tr>
                                    ) : (
                                        filteredData.map(item => (
                                            <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium">{typeof item.data === 'string' && item.data.includes('-') ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : item.data}</td>
                                                <td className="px-4 py-3 font-bold text-neutral-800 dark:text-neutral-200">{getFirstName(item.vendedor)}</td>
                                                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{item.produto}</td>
                                                <td className="px-4 py-3"><span className="bg-red-50 dark:bg-red-900/20 text-[#E3000F] border border-red-100 dark:border-red-900/30 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">{item.motivo}</span></td>
                                                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">{item.cliente}</td>
                                                <td className="px-4 py-3 font-mono text-neutral-500 dark:text-neutral-400">{item.cpf || '-'}</td>
                                                <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">{item.cep}</td>
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate" title={item.logradouro}>{item.logradouro}</td>
                                                <td className="px-4 py-3 font-bold text-neutral-800 dark:text-neutral-200">{item.numero || 'S/N'}</td>
                                                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 max-w-[150px] truncate" title={item.obs}>{item.obs || '-'}</td>
                                                <td className="px-4 py-2 text-center sticky right-0 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.2)] bg-white dark:bg-neutral-900 z-10">
                                                    {canEditDelete(item) ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-300 dark:text-neutral-600 flex justify-center"><Lock size={14} /></span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div >

            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
                            <div><h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{editingId ? 'Editar Registro Reprovado' : 'Lançar Inviabilidade (Reprovado)'}</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Busque o logradouro de forma automática digitando o CEP.</p></div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                            {formError && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[#E3000F] px-4 py-3 rounded-lg text-sm font-medium animate-fade-in">{formError}</div>)}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data <span className="text-[#E3000F]">*</span></label><input type="date" name="data" value={formData.data} onChange={handleFormChange} max={getTodaySP()} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" /></div>
                                <div className="space-y-1.5 relative"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between"><span>Vendedor <span className="text-[#E3000F]">*</span></span>{isVendedor && <Lock size={12} className="text-[#E3000F]" />}</label><select name="vendedor" value={formData.vendedor} onChange={handleFormChange} disabled={isVendedor} className={`w-full px-3 py-2.5 rounded-lg outline-none text-sm border ${isVendedor ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-[#E3000F] cursor-not-allowed font-bold' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 focus:ring-1 focus:ring-[#E3000F]'}`}><option className="bg-white dark:bg-neutral-900" value="">Selecione</option>{safeVendedores.map(v => <option className="bg-white dark:bg-neutral-900" key={v} value={v}>{getFirstName(v)}</option>)}</select></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Produto <span className="text-[#E3000F]">*</span></label><select name="produto" value={formData.produto} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option className="bg-white dark:bg-neutral-900" value="">Selecione</option>{RESIDENTIAL_PRODUCTS.map(p => <option className="bg-white dark:bg-neutral-900" key={p} value={p}>{p}</option>)}</select></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Motivo de Recusa <span className="text-[#E3000F]">*</span></label><select name="motivo" value={formData.motivo} onChange={handleFormChange} className="w-full bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-neutral-800 dark:text-neutral-100 font-semibold px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option className="bg-white dark:bg-neutral-900" value="">Selecione</option>{MOTIVOS_OPTIONS.map(m => <option className="bg-white dark:bg-neutral-900" key={m} value={m}>{m}</option>)}</select></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Nome do Cliente <span className="text-[#E3000F]">*</span></label><input type="text" name="cliente" value={formData.cliente} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" placeholder="Nome completo" /></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">CPF / CNPJ</label><input type="text" name="cpf" value={formData.cpf} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono" placeholder="Opcional" /></div>
                                <div className="space-y-1.5 md:col-span-1 relative"><label className="text-xs font-bold text-[#E3000F] uppercase tracking-wider flex items-center gap-1"><MapPin size={12} /> CEP (Busca Automática) <span className="text-[#E3000F]">*</span></label><input type="text" name="cep" value={formData.cep} onChange={handleCepChange} maxLength="9" className={`w-full bg-white dark:bg-neutral-900 border border-[#E3000F]/30 dark:border-[#E3000F]/50 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono shadow-sm ${isFetchingCep ? 'opacity-50' : ''}`} placeholder="00000-000" /></div>
                                <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Logradouro <span className="text-[#E3000F]">*</span></label><input type="text" name="logradouro" value={formData.logradouro} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium" placeholder="Preenchido via CEP..." /></div>
                                <div className="space-y-1.5 md:col-span-1"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Número <span className="text-[#E3000F]">*</span></label><input type="text" name="numero" value={formData.numero} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" placeholder="Nº ou S/N" /></div>
                                <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Observações Extras</label><input type="text" name="obs" value={formData.obs} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" placeholder="Opcional. Ex: Faltou poste na rua..." /></div>
                            </div>
                            <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-[#E3000F] text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">{editingId ? 'Salvar Edição' : 'Confirmar Lançamento'}</button></div>
                        </form>
                    </div>
                </div>
            )
            }
        </>
    );
} 