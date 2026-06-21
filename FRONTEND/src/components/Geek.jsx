import React, { useState } from 'react';
import { Cpu, Plus, FileText, Trash2, ExternalLink, X, BookOpen, Layers, Tag, Archive, FolderPlus, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export const checkHasNewGeek = (docs, globalUser) => {
    try {
        const viewed = globalUser?.viewedGeekDocs || {};
        return (docs || []).some(doc => {
            const lastUpdated = doc.updatedAt || doc.id;
            const isRecent = (Date.now() - lastUpdated) < 15 * 24 * 60 * 60 * 1000; // 15 dias
            if (!isRecent) return false;
            return viewed[doc.id] !== lastUpdated;
        });
    } catch {
        return false;
    }
};

export function Geek({ geekDocs = [], setGeekDocs, isGerente, globalUser, updateUserProfile }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ titulo: '', categoria: 'BOOK DE OFERTAS', link: '' });
    const [isNovaCategoria, setIsNovaCategoria] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

    const viewedDocs = globalUser?.viewedGeekDocs || {};

    const categoriasPadrao = [
        { id: 'BOOK DE OFERTAS', icon: <BookOpen size={20} className="text-blue-500" /> },
        { id: 'MÓDULOS BUNDLE', icon: <Layers size={20} className="text-purple-500" /> },
        { id: 'PROMOMEMO DE ACESSÓRIOS', icon: <Tag size={20} className="text-green-500" /> },
        { id: 'CARTILHA DE COMISSIONAMENTO', icon: <FileText size={20} className="text-emerald-500" /> },
        { id: 'MAPA DE PREÇOS', icon: <Tag size={20} className="text-rose-500" /> },
        { id: 'MATERIAL DE TREINAMENTO', icon: <BookOpen size={20} className="text-yellow-500" /> },
        { id: 'OUTROS', icon: <Archive size={20} className="text-orange-500" /> }
    ];

    const categoriasUnicas = Array.from(new Set((geekDocs || []).map(d => d.categoria)));
    const allCategorias = [...categoriasPadrao];
    categoriasUnicas.forEach(catId => {
        if (!allCategorias.some(c => c.id === catId)) {
            allCategorias.push({ id: catId, icon: <FolderPlus size={20} className="text-indigo-500" /> });
        }
    });

    const canEdit = ['GEEK', 'ADMINISTRAÇÃO', 'GERENTE'].includes(globalUser?.role);

    const handleOpenModal = () => {
        setEditingId(null);
        setFormData({ titulo: '', categoria: 'BOOK DE OFERTAS', link: '' });
        setIsNovaCategoria(false);
        setNovaCategoriaNome('');
        setIsModalOpen(true);
    };

    const handleEdit = (doc) => {
        setEditingId(doc.id);
        setFormData({ titulo: doc.titulo, categoria: doc.categoria, link: doc.link });
        setIsNovaCategoria(false);
        setNovaCategoriaNome('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalCategoria = isNovaCategoria ? novaCategoriaNome.trim().toUpperCase() : formData.categoria;

        if (!formData.titulo || !formData.link || !finalCategoria) {
            toast.error('Preencha o título, a categoria e o link do documento.');
            return;
        }

        let finalLink = formData.link;
        if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
            finalLink = 'https://' + finalLink;
        }

        if (editingId) {
            setGeekDocs(prev => prev.map(doc => doc.id === editingId ? {
                ...doc,
                titulo: formData.titulo,
                categoria: finalCategoria,
                link: finalLink,
                updatedAt: Date.now()
            } : doc));
            toast.success('Documento atualizado com sucesso!');
        } else {
            const newDoc = {
                id: Date.now(),
                titulo: formData.titulo,
                categoria: finalCategoria,
                link: finalLink,
                data: new Date().toLocaleDateString('pt-BR'),
                updatedAt: Date.now()
            };

            setGeekDocs(prev => [newDoc, ...prev]);
            toast.success('Documento adicionado com sucesso!');
        }
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (!canEdit) {
            toast.error('Acesso negado. Apenas os perfis GEEK, ADMINISTRAÇÃO ou GERENTE podem excluir documentos.');
            return;
        }
        if (window.confirm('Deseja excluir este documento?')) {
            setGeekDocs(prev => prev.filter(doc => doc.id !== id));
            toast.success('Documento excluído.');
        }
    };

    const markAsViewed = (doc) => {
        const lastUpdated = doc.updatedAt || doc.id;
        if (viewedDocs[doc.id] !== lastUpdated) {
            const newViewed = { ...viewedDocs, [doc.id]: lastUpdated };
            updateUserProfile({ viewedGeekDocs: newViewed });
        }
    };

    const isDocNew = (doc) => {
        const lastUpdated = doc.updatedAt || doc.id;
        const isRecent = (Date.now() - lastUpdated) < 15 * 24 * 60 * 60 * 1000;
        if (!isRecent) return false;
        return viewedDocs[doc.id] !== lastUpdated;
    };

    const hasNews = (geekDocs || []).some(isDocNew);

    return (
        <div className="h-full flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-y-auto animate-fade-in transition-colors">
            <div className="p-6 pb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Cpu size={22} /></div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Espaço GEEK</h2>
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
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">Central de Documentos, Books de Ofertas e Manuais.</p>
                    </div>
                </div>
                {canEdit && (
                    <button onClick={handleOpenModal} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                        <Plus size={18} /> Novo Documento
                    </button>
                )}
            </div>

            <div className="px-6 pb-8 space-y-8 max-w-7xl mx-auto w-full">
                {allCategorias.map(cat => {
                    const docs = (geekDocs || []).filter(d => d.categoria === cat.id);
                    if (docs.length === 0) return null;

                    return (
                        <div key={cat.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                {cat.icon} {cat.id} <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[10px]">{docs.length}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {docs.map(doc => (
                                    <div key={doc.id} className="group relative bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col">
                                        {isDocNew(doc) && (
                                            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 z-10">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E3000F] border-2 border-white dark:border-neutral-900" title="Novo arquivo ou alterado recentemente"></span>
                                            </span>
                                        )}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-indigo-500 shrink-0"><FileText size={18} /></div>
                                            {canEdit && (
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                                    <button onClick={() => handleEdit(doc)} className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Editar"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm mb-1 line-clamp-2 flex-1" title={doc.titulo}>{doc.titulo}</h4>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-4 mt-auto pt-2">Add: {doc.data}</p>
                                        <a href={doc.link} target="_blank" rel="noopener noreferrer" onClick={() => markAsViewed(doc)} className="w-full py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-center gap-1.5">Acessar <ExternalLink size={14} /></a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {geekDocs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4"><FileText size={32} /></div>
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Nenhum material disponível</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mt-1">Ainda não há materiais adicionados na seção GEEK. Solicite à gestão que adicione novos links de documentos.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center"><h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Cpu size={18} className="text-indigo-500" /> {editingId ? 'Editar Material' : 'Adicionar Material'}</h2><button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"><X size={18} /></button></div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Título do Documento <span className="text-[#E3000F]">*</span></label><input type="text" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: Book de Aparelhos - Maio" required /></div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Categoria <span className="text-[#E3000F]">*</span></label>
                                <select value={isNovaCategoria ? 'NOVA_CATEGORIA' : formData.categoria} onChange={e => {
                                    if (e.target.value === 'NOVA_CATEGORIA') {
                                        setIsNovaCategoria(true);
                                    } else {
                                        setIsNovaCategoria(false);
                                        setFormData({ ...formData, categoria: e.target.value });
                                    }
                                }} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-bold">
                                    {allCategorias.map(c => <option className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100" key={c.id} value={c.id}>{c.id}</option>)}
                                    <option className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black" value="NOVA_CATEGORIA">+ CRIAR NOVA CATEGORIA</option>
                                </select>
                            </div>
                            {isNovaCategoria && (
                                <div className="space-y-1.5 animate-fade-in"><label className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Nome da Nova Categoria <span className="text-[#E3000F]">*</span></label><input type="text" value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)} className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm uppercase font-bold" placeholder="Ex: MANUAIS DE PROCEDIMENTO" required={isNovaCategoria} /></div>
                            )}
                            <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Link do PDF (Drive / Web) <span className="text-[#E3000F]">*</span></label><input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" placeholder="https://..." required /><p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">Dica: Faça o upload do PDF no Google Drive da loja, clique em "Compartilhar", copie o link e cole aqui!</p></div>
                            <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm">Cancelar</button><button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 text-sm">{editingId ? 'Salvar Edição' : 'Salvar Documento'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 