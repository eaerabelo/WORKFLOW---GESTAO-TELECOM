import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit3, Trash2, X, Calendar, Target, Award, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTodaySP } from '../utils/masks';

export const checkHasNewCampanha = (campanhas, globalUser) => {
    try {
        const viewed = globalUser?.viewedCampanhas || {};
        return (campanhas || []).some(camp => {
            const lastUpdated = camp.updatedAt || camp.id;
            const isRecent = (Date.now() - lastUpdated) < 15 * 24 * 60 * 60 * 1000; // 15 dias
            if (!isRecent) return false;
            return viewed[camp.id] !== lastUpdated;
        });
    } catch {
        return false;
    }
};

export function Campanha({ globalUser, campanhasData = [], setCampanhasData, updateUserProfile }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        premio: '',
        ganhadores: '',
        dataInicio: '',
        dataFim: '',
        status: 'ATIVA'
    });

    const viewedCampanhas = globalUser?.viewedCampanhas || {};

    // Sistema Automático: Encerra campanhas cuja data limite foi ultrapassada
    useEffect(() => {
        if (!campanhasData || campanhasData.length === 0) return;
        
        const today = getTodaySP();
        let hasChanges = false;
        
        const updatedCampanhas = campanhasData.map(camp => {
            if (camp.status === 'ATIVA' && camp.dataFim && camp.dataFim < today) {
                hasChanges = true;
                return { ...camp, status: 'ENCERRADA' };
            }
            return camp;
        });

        if (hasChanges) {
            setCampanhasData(updatedCampanhas);
        }
    }, [campanhasData, setCampanhasData]);

    const canEdit = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);

    const handleOpenModal = () => {
        setEditingId(null);
        setFormData({ titulo: '', descricao: '', premio: '', ganhadores: '', dataInicio: '', dataFim: '', status: 'ATIVA' });
        setIsModalOpen(true);
    };

    const markAsViewed = (camp) => {
        const lastUpdated = camp.updatedAt || camp.id;
        if (viewedCampanhas[camp.id] !== lastUpdated) {
            const newViewed = { ...viewedCampanhas, [camp.id]: lastUpdated };
            updateUserProfile({ viewedCampanhas: newViewed });
        }
    };

    const isCampNew = (camp) => {
        const lastUpdated = camp.updatedAt || camp.id;
        const isRecent = (Date.now() - lastUpdated) < 15 * 24 * 60 * 60 * 1000;
        if (!isRecent) return false;
        return viewedCampanhas[camp.id] !== lastUpdated;
    };

    const hasNews = (campanhasData || []).some(isCampNew);

    const handleEdit = (campanha) => {
        setEditingId(campanha.id);
        setFormData({ ...campanha });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
            setCampanhasData(prev => prev.filter(c => c.id !== id));
            toast.success('Campanha excluída com sucesso!');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.dataInicio || !formData.dataFim) {
            toast.error('Preencha os campos obrigatórios.');
            return;
        }

        if (editingId) {
            setCampanhasData(prev => prev.map(c => c.id === editingId ? { ...c, ...formData, updatedAt: Date.now() } : c));
            toast.success('Campanha atualizada!');
        } else {
            setCampanhasData(prev => [{ ...formData, id: Date.now(), updatedAt: Date.now() }, ...prev]);
            toast.success('Nova campanha lançada!');
        }
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-y-auto animate-fade-in transition-colors">
            {/* CABEÇALHO */}
            <div className="p-6 pb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Megaphone size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Painel de Campanhas</h2>
                            {hasNews ? (
                                <span className="bg-red-100 text-[#E3000F] dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F] mr-1.5"></span>
                                    Novidades
                                </span>
                            ) : (
                                <span className="bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Tudo Visto
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">Incentivos, prêmios e campanhas vigentes na operação.</p>
                    </div>
                </div>
                {canEdit && (
                    <button onClick={handleOpenModal} className="px-4 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                        <Plus size={18} /> Lançar Campanha
                    </button>
                )}
            </div>

            {/* CORPO */}
            <div className="px-6 pb-8 space-y-6 max-w-7xl mx-auto w-full">
                {(campanhasData || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4"><Award size={32} /></div>
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Nenhuma campanha ativa no momento</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mt-1">Quando a liderança lançar novos incentivos, eles aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(campanhasData || []).map(camp => (
                            <div key={camp.id} onMouseEnter={() => markAsViewed(camp)} className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group ${camp.status === 'ATIVA' ? 'border-orange-200 dark:border-orange-800/50' : 'border-neutral-200 dark:border-neutral-800 opacity-75'}`}>
                                {isCampNew(camp) && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 z-10">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E3000F] border-2 border-white dark:border-neutral-900" title="Nova campanha ou alterada recentemente"></span>
                                    </span>
                                )}
                                {camp.status === 'ATIVA' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>}
                                
                                <div className="flex justify-between items-start mb-4 mt-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${camp.status === 'ATIVA' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                        {camp.status === 'ATIVA' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {camp.status}
                                    </span>
                                    {canEdit && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                            <button onClick={() => handleEdit(camp)} className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Editar"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(camp.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-base font-black text-neutral-800 dark:text-neutral-100 uppercase leading-tight mb-2">{camp.titulo}</h3>
                                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                                    {camp.descricao}
                                </div>

                                <div className="mt-auto space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                        <Calendar size={14} className="text-neutral-400" />
                                        {camp.dataInicio.split('-').reverse().join('/')} até {camp.dataFim.split('-').reverse().join('/')}
                                    </div>
                                    {camp.premio && (
                                        <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 p-2.5 rounded-xl">
                                            <Award size={16} className="text-orange-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="block text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider">Prêmio</span>
                                                <span className="text-xs font-bold text-orange-800 dark:text-orange-400 leading-tight whitespace-pre-wrap">{camp.premio}</span>
                                            </div>
                                        </div>
                                    )}
                                    {camp.ganhadores && (
                                        <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-2.5 rounded-xl">
                                            <Trophy size={16} className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="block text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider">Ganhador(es)</span>
                                                <span className="text-xs font-bold text-yellow-900 dark:text-yellow-400 leading-tight whitespace-pre-wrap">{camp.ganhadores}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE CAMPANHA */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center"><h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Target size={18} className="text-orange-500" /> {editingId ? 'Editar Campanha' : 'Lançar Nova Campanha'}</h2><button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"><X size={18} /></button></div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Título da Campanha <span className="text-[#E3000F]">*</span></label><input type="text" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value.toUpperCase() })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm uppercase font-bold" placeholder="Ex: ACELERA FIBRA" required /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Regras / Descrição</label><textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm min-h-[150px] resize-y" placeholder="Cole aqui o texto da campanha..." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data Início <span className="text-[#E3000F]">*</span></label><input type="date" value={formData.dataInicio} onChange={e => setFormData({ ...formData, dataInicio: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm" required /></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data Fim <span className="text-[#E3000F]">*</span></label><input type="date" value={formData.dataFim} onChange={e => setFormData({ ...formData, dataFim: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm" required /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Prêmio (Opcional)</label><textarea value={formData.premio} onChange={e => setFormData({ ...formData, premio: e.target.value })} className="w-full bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-400 font-bold px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm min-h-[60px] resize-y" placeholder="Ex: Reduzido, Folga..." /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ganhador(es) (Opcional)</label><textarea value={formData.ganhadores || ''} onChange={e => setFormData({ ...formData, ganhadores: e.target.value })} className="w-full bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-400 font-bold px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-yellow-500 outline-none text-sm min-h-[60px] resize-y" placeholder="Ex: João da Silva" /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm"><option className="bg-white dark:bg-neutral-900" value="ATIVA">ATIVA</option><option className="bg-white dark:bg-neutral-900" value="ENCERRADA">ENCERRADA</option></select></div>
                            <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm">Cancelar</button><button type="submit" className="px-8 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/30 text-sm">{editingId ? 'Salvar Edição' : 'Lançar Campanha'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 