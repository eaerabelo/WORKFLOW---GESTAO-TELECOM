import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, DollarSign, Smartphone, Home, RotateCcw, Lock, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_PRICING } from '../utils/constants';
import { applyCurrencyMask, parseCurrencyToFloat } from '../utils/masks';

export function Precificacao({ pricingData, setPricingData, globalUser }) {
    const [activeTab, setActiveTab] = useState('movel'); // 'movel' or 'residencial'
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ nome: '', valor: '', valorMulti: '', valorMulti3p: '' });

    const hasAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setEditForm({ 
            nome: plan.nome, 
            valor: applyCurrencyMask(plan.valor || 0),
            valorMulti: applyCurrencyMask(plan.valorMulti !== undefined ? plan.valorMulti : (plan.valor || 0)),
            valorMulti3p: applyCurrencyMask(plan.valorMulti3p !== undefined ? plan.valorMulti3p : (plan.valorMulti !== undefined ? plan.valorMulti : (plan.valor || 0)))
        });
    };

    const handleSave = () => {
        if (!editForm.nome) return toast.error('O nome é obrigatório.');
        
        const valSingle = parseCurrencyToFloat(editForm.valor);
        const valMulti = parseCurrencyToFloat(editForm.valorMulti);
        const valMulti3p = parseCurrencyToFloat(editForm.valorMulti3p);

        if (valSingle < 0 || valMulti < 0 || valMulti3p < 0) return toast.error('Os valores não podem ser negativos.');

        setPricingData(prev => {
            const updatedList = prev[activeTab].map(p => 
                p.id === editingId ? { 
                    ...p, 
                    nome: editForm.nome, 
                    valor: valSingle,
                    valorMulti: valMulti,
                    valorMulti3p: valMulti3p
                } : p
            );
      
            const isNew = !prev[activeTab].find(p => p.id === editingId);
            if (isNew) {
                updatedList.push({ 
                    id: editingId, 
                    nome: editForm.nome, 
                    valor: valSingle,
                    valorMulti: valMulti,
                    valorMulti3p: valMulti3p
                });
            }

            toast.success(isNew ? 'Plano adicionado com sucesso!' : 'Plano atualizado com sucesso!');
      
            return {
                ...prev,
                [activeTab]: updatedList,
                lastUpdated: Date.now()
            };
        });
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
        setPricingData(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(p => p.id !== id),
            lastUpdated: Date.now()
        }));
        toast.success('Plano excluído com sucesso!');
    };

    const handleAdd = () => {
        const newId = `plan_${Date.now()}`;
        setEditingId(newId);
        setEditForm({ 
            nome: '', 
            valor: applyCurrencyMask(0), 
            valorMulti: applyCurrencyMask(0), 
            valorMulti3p: applyCurrencyMask(0) 
        });
    };

    const handleRestoreDefaults = () => {
        if (!window.confirm('Isso apagará suas alterações atuais e restaurará todos os produtos padrões do sistema. Deseja continuar?')) return;
        setPricingData({
            ...DEFAULT_PRICING,
            lastUpdated: Date.now()
        });
        toast.success('Produtos padrões restaurados com sucesso!');
    };

    if (!hasAccess) {
        return null;
    }

    return (
        <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
                <Wrench size={32} />
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Em Desenvolvimento</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
                O módulo de Precificação Dinâmica está sendo construído e em breve estará disponível para a sua loja.
            </p>
        </div>
    );

    // CÓDIGO ORIGINAL OCULTO ENQUANTO ESTÁ EM DESENVOLVIMENTO:
    if (false) {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight flex items-center gap-2">
                            <DollarSign className="text-[#E3000F]" size={28} />
                            Precificação
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
                            Gerencie os nomes e valores dos planos e serviços. As alterações refletem para toda a equipe.
                            <br className="hidden sm:block" /> * Caso o plano não possua descontos no combo (ex: Seguros), basta repetir o mesmo valor nos 3 campos.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={handleRestoreDefaults}
                            className="flex-1 sm:flex-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                            title="Restaurar Produtos Padrões"
                        >
                            <RotateCcw size={16} /> Restaurar Padrões
                        </button>
                        <button 
                            onClick={handleAdd}
                            className="flex-1 sm:flex-none bg-[#E3000F] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                        >
                            <Plus size={16} /> Adicionar Plano
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto scrollbar-hide border-b border-neutral-200 dark:border-neutral-800 p-2 gap-2 bg-neutral-50 dark:bg-neutral-800/50" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                        <button
                            onClick={() => setActiveTab('movel')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'movel' ? 'bg-white dark:bg-neutral-700 text-[#E3000F] shadow-sm' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                        >
                            <Smartphone size={18} /> Planos Móveis
                        </button>
                        <button
                            onClick={() => setActiveTab('residencial')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'residencial' ? 'bg-white dark:bg-neutral-700 text-[#E3000F] shadow-sm' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                        >
                            <Home size={18} /> Planos Residenciais
                        </button>
                    </div>

                    {/* Content - Compact Table */}
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-neutral-50/50 dark:bg-neutral-950/50">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm max-w-4xl mx-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="px-4 py-3 w-[30%]">Nome do Plano / Produto</th>
                                        <th className="px-2 py-3 w-[15%] text-right text-neutral-500">Valor Single</th>
                                        <th className="px-2 py-3 w-[15%] text-right text-blue-500">Combo Multi</th>
                                        <th className="px-2 py-3 w-[15%] text-right text-purple-500">Multi 3P</th>
                                        <th className="px-4 py-3 w-[25%] text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {(pricingData[activeTab] || []).map(plan => (
                                        <tr key={plan.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                            {editingId === plan.id ? (
                                                <>
                                                    <td className="px-4 py-2 align-top pt-3">
                                                        <input 
                                                            type="text" 
                                                            value={editForm.nome} 
                                                            onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                                            placeholder="Nome do Plano"
                                                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-800 dark:text-white outline-none focus:border-[#E3000F]"
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">R$ Single</label>
                                                        <input 
                                                            type="text" 
                                                            value={editForm.valor} 
                                                            onChange={e => setEditForm({ ...editForm, valor: applyCurrencyMask(e.target.value) })}
                                                            className="w-full text-right bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1.5 text-sm font-bold text-neutral-600 dark:text-neutral-300 outline-none focus:border-[#E3000F]"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <label className="text-[9px] font-bold text-blue-500/70 uppercase tracking-widest block mb-1">R$ Multi</label>
                                                        <input 
                                                            type="text" 
                                                            value={editForm.valorMulti} 
                                                            onChange={e => setEditForm({ ...editForm, valorMulti: applyCurrencyMask(e.target.value) })}
                                                            className="w-full text-right bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg px-2 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <label className="text-[9px] font-bold text-purple-500/70 uppercase tracking-widest block mb-1">R$ Multi 3P</label>
                                                        <input 
                                                            type="text" 
                                                            value={editForm.valorMulti3p} 
                                                            onChange={e => setEditForm({ ...editForm, valorMulti3p: applyCurrencyMask(e.target.value) })}
                                                            className="w-full text-right bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-lg px-2 py-1.5 text-sm font-bold text-purple-600 dark:text-purple-400 outline-none focus:border-purple-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center align-top pt-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={handleSave} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors" title="Salvar">
                                                                <Save size={16} />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 rounded-lg transition-colors" title="Cancelar">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 font-bold text-neutral-800 dark:text-neutral-100">{plan.nome}</td>
                                                    <td className="px-2 py-3 font-bold text-neutral-500 dark:text-neutral-400 text-right">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.valor)}
                                                    </td>
                                                    <td className="px-2 py-3 font-black text-blue-600 dark:text-blue-500 text-right">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.valorMulti !== undefined ? plan.valorMulti : plan.valor)}
                                                    </td>
                                                    <td className="px-2 py-3 font-black text-purple-600 dark:text-purple-500 text-right">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.valorMulti3p !== undefined ? plan.valorMulti3p : (plan.valorMulti !== undefined ? plan.valorMulti : plan.valor))}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEdit(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Excluir">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {(!pricingData[activeTab] || pricingData[activeTab].length === 0) && (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 font-medium">
                                                Nenhum plano cadastrado nesta categoria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div >
            </div >
        );
    }
} 