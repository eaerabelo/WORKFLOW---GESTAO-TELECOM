import React, { useState, useEffect, useRef } from 'react';
import {
    Cpu, Plus, FileText, Trash2, ExternalLink, X, BookOpen, Layers,
    Tag, Archive, FolderPlus, Edit3, ChevronLeft, ChevronRight,
    Image as ImageIcon, Sparkles, Maximize2, Upload, Megaphone
} from 'lucide-react';
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

const DEFAULT_FLYERS = [
    {
        id: 1,
        titulo: 'CLARO FIBRA 500 MEGA',
        subtitulo: 'Ultravelocidade com Wi-Fi Plus e Globoplay Incluso na Oferta',
        tag: 'CAMPANHA OFICIAL',
        imagemUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop',
        link: 'https://produtos.claro.com.br/simular-precos',
        data: 'Maio/2026'
    },
    {
        id: 2,
        titulo: 'CLARO PÓS PLAY 5G',
        subtitulo: 'Até 500GB com Dobro de Internet e Passaporte Américas sem custo',
        tag: 'DESTAQUE MENSAL',
        imagemUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
        link: 'https://vendasapp.claro.com.br/SVCv2/posicionamento/resultado-pesquisa',
        tagColor: 'bg-[#E3000F]',
        data: 'Maio/2026'
    },
    {
        id: 3,
        titulo: 'MIGRAÇÃO PRÉ -> CONTROLE',
        subtitulo: 'Desconto Exclusivo na Fatura e R$ 10 de Bônus Recarga Claro Pay',
        tag: 'FOCO OPERAÇÃO',
        imagemUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?q=80&w=800&auto=format&fit=crop',
        link: 'https://produtos.claro.com.br/simular-precos',
        tagColor: 'bg-emerald-600',
        data: 'Maio/2026'
    }
];

export function Geek({ geekDocs = [], setGeekDocs, isGerente, globalUser, updateUserProfile }) {
    // --- ESTADOS DE DOCUMENTOS ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ titulo: '', categoria: 'BOOK DE OFERTAS', link: '' });
    const [isNovaCategoria, setIsNovaCategoria] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

    // --- COMPRESSÃO INTELIGENTE DE IMAGEM PARA FLYERS (ALTA DEFINIÇÃO E PESO LEVE) ---
    const compressImageFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1400;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, w, h);
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.90);
                        resolve(compressedBase64);
                    } else {
                        resolve(e.target.result);
                    }
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    // --- ESTADOS DO CARROSSEL DE FLYERS (3:4) ---
    const [flyers, setFlyers] = useState(() => {
        try {
            const saved = localStorage.getItem('CLARO_GEEK_FLYERS_34');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return DEFAULT_FLYERS;
    });

    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [editingFlyerId, setEditingFlyerId] = useState(null);
    const [flyerFormData, setFlyerFormData] = useState({
        titulo: '',
        subtitulo: '',
        tag: 'CAMPANHA OFICIAL',
        imagemUrl: '',
        link: ''
    });
    const [previewFlyer, setPreviewFlyer] = useState(null);
    const carouselRef = useRef(null);

    // Sincronizar com documento de flyers na nuvem (Oracle / GEEK_DOCS)
    useEffect(() => {
        try {
            const cloudDoc = (geekDocs || []).find(d => d.id === 'CONFIG_FLYERS_34' || d.categoria === '__FLYERS_CARROSSEL__');
            if (cloudDoc && Array.isArray(cloudDoc.flyersList)) {
                setFlyers(cloudDoc.flyersList);
                try {
                    localStorage.setItem('CLARO_GEEK_FLYERS_34', JSON.stringify(cloudDoc.flyersList));
                } catch {}
            }
        } catch {}
    }, [geekDocs]);

    // Função central para salvar flyers com persistência local e nuvem
    const saveFlyersList = (newList) => {
        setFlyers(newList);
        try {
            localStorage.setItem('CLARO_GEEK_FLYERS_34', JSON.stringify(newList));
        } catch (err) {
            console.warn('Erro ao salvar flyers no localStorage:', err);
        }
        if (typeof setGeekDocs === 'function') {
            setGeekDocs(prev => {
                const filtered = (prev || []).filter(d => d.id !== 'CONFIG_FLYERS_34' && d.categoria !== '__FLYERS_CARROSSEL__');
                const cloudDoc = {
                    id: 'CONFIG_FLYERS_34',
                    titulo: 'Flyers de Campanha 3:4',
                    categoria: '__FLYERS_CARROSSEL__',
                    flyersList: newList,
                    data: new Date().toLocaleDateString('pt-BR'),
                    updatedAt: Date.now()
                };
                return [cloudDoc, ...filtered];
            });
        }
    };

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

    const categoriasUnicas = Array.from(new Set((geekDocs || []).filter(d => d.categoria !== '__FLYERS_CARROSSEL__').map(d => d.categoria)));
    const allCategorias = [...categoriasPadrao];
    categoriasUnicas.forEach(catId => {
        if (!allCategorias.some(c => c.id === catId)) {
            allCategorias.push({ id: catId, icon: <FolderPlus size={20} className="text-indigo-500" /> });
        }
    });

    const userRole = String(globalUser?.role || '').trim().toUpperCase();
    const canEdit = isGerente || ['GEEK', 'ADMINISTRAÇÃO', 'GERENTE', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'JOVEM APRENDIZ'].includes(userRole);

    // --- FUNÇÕES DE NAVEGAÇÃO DO CARROSSEL ---
    const scrollCarousel = (direction) => {
        if (!carouselRef.current) return;
        const scrollAmount = 300;
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const handleOpenFlyerModal = () => {
        setEditingFlyerId(null);
        setFlyerFormData({
            titulo: '',
            subtitulo: '',
            tag: 'CAMPANHA OFICIAL',
            imagemUrl: '',
            link: ''
        });
        setIsFlyerModalOpen(true);
    };

    const handleEditFlyer = (flyer) => {
        setEditingFlyerId(flyer.id);
        setFlyerFormData({
            titulo: flyer.titulo || '',
            subtitulo: flyer.subtitulo || '',
            tag: flyer.tag || 'CAMPANHA OFICIAL',
            imagemUrl: flyer.imagemUrl || '',
            link: flyer.link || ''
        });
        setIsFlyerModalOpen(true);
    };

    const handleDeleteFlyer = (id) => {
        if (!canEdit) {
            toast.error('Acesso negado. Apenas perfis autorizados podem excluir flyers.');
            return;
        }
        if (window.confirm('Deseja excluir este flyer de campanha definitivamente?')) {
            const updated = flyers.filter(f => f.id !== id);
            saveFlyersList(updated);
            if (previewFlyer?.id === id) {
                setPreviewFlyer(null);
            }
            toast.success('Flyer excluído com sucesso!');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImageFile(file);
            if (compressed) {
                setFlyerFormData(prev => ({ ...prev, imagemUrl: compressed }));
                toast.success('Imagem otimizada em alta definição!');
            }
        } catch {
            toast.error('Erro ao processar imagem.');
        }
    };

    const handleFlyerSubmit = (e) => {
        e.preventDefault();
        if (!flyerFormData.titulo.trim()) {
            toast.error('Informe o título do flyer.');
            return;
        }
        if (!flyerFormData.imagemUrl.trim()) {
            toast.error('Informe a URL da imagem ou faça o upload de um arquivo.');
            return;
        }

        let finalLink = flyerFormData.link.trim();
        if (finalLink && !finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
            finalLink = 'https://' + finalLink;
        }

        let updatedList = [];
        if (editingFlyerId) {
            updatedList = flyers.map(f => f.id === editingFlyerId ? {
                ...f,
                titulo: flyerFormData.titulo.trim(),
                subtitulo: flyerFormData.subtitulo.trim(),
                tag: flyerFormData.tag.trim().toUpperCase(),
                imagemUrl: flyerFormData.imagemUrl.trim(),
                link: finalLink,
                updatedAt: Date.now()
            } : f);
            toast.success('Flyer atualizado com sucesso!');
        } else {
            const novoFlyer = {
                id: Date.now(),
                titulo: flyerFormData.titulo.trim(),
                subtitulo: flyerFormData.subtitulo.trim(),
                tag: flyerFormData.tag.trim().toUpperCase(),
                imagemUrl: flyerFormData.imagemUrl.trim(),
                link: finalLink,
                data: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                updatedAt: Date.now()
            };
            updatedList = [novoFlyer, ...flyers];
            toast.success('Novo flyer publicado no carrossel!');
        }

        saveFlyersList(updatedList);
        setIsFlyerModalOpen(false);
        setEditingFlyerId(null);
    };

    // --- FUNÇÕES DE DOCUMENTOS ---
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
            {/* Cabeçalho Principal */}
            <div className="p-6 pb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Cpu size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Espaço GEEK & Mural Telecom</h2>
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
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                            Campanhas em formato flyer 3:4, central de documentos oficiais, books de ofertas e comunicados.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {canEdit && (
                        <>
                            <button
                                type="button"
                                onClick={handleOpenFlyerModal}
                                className="px-4 py-2.5 bg-gradient-to-r from-[#E3000F] to-red-700 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                title="Cadastrar novo flyer de campanha na proporção 3:4"
                            >
                                <Sparkles size={16} /> + Novo Flyer (3:4)
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenModal}
                                className="px-4 py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                <Plus size={16} /> Novo Documento
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 pb-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* SEÇÃO CARROSSEL DE FLYERS 3:4 */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                <Megaphone size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                                    Campanhas & Divulgações da Empresa (Flyers 3:4)
                                    <span className="bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                        {flyers.length} {flyers.length === 1 ? 'flyer' : 'flyers'}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-neutral-400 font-medium">
                                    Visualização em formato vertical de cartaz/flyer telecom (proporção 3:4). Clique para ampliar.
                                </p>
                            </div>
                        </div>

                        {/* Botões de Navegação do Carrossel */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => scrollCarousel('left')}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm"
                                title="Voltar Flyer"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollCarousel('right')}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm"
                                title="Próximo Flyer"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Trilho de Flyers com Proporção Exata 3:4 */}
                    <div
                        ref={carouselRef}
                        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory"
                        style={{ scrollSnapType: 'x mandatory' }}
                    >
                        {flyers.map((flyer) => (
                            <div
                                key={flyer.id}
                                className="group relative shrink-0 w-[240px] sm:w-[270px] aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-900 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 snap-start flex flex-col justify-end cursor-pointer"
                                onClick={() => setPreviewFlyer(flyer)}
                            >
                                {/* Imagem de Fundo com proporção 3:4 */}
                                <img
                                    src={flyer.imagemUrl}
                                    alt={flyer.titulo}
                                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop';
                                    }}
                                />

                                {/* Gradiente Escuro de Sobreposição para Leitura Perfeita */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                                {/* Badge Superior de Tag */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                                    <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#E3000F] text-white shadow-md">
                                        {flyer.tag || 'CAMPANHA'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-sm">
                                        {flyer.data}
                                    </span>
                                </div>

                                {/* Ações do Flyer (Editar / Excluir para perfis autorizados) */}
                                {canEdit && (
                                    <div
                                        className="absolute top-3 right-3 flex items-center gap-1 z-20 transition-all bg-black/80 backdrop-blur-sm p-1 rounded-lg border border-white/20 shadow-md"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleEditFlyer(flyer)}
                                            className="p-1.5 text-white hover:text-blue-400 hover:bg-white/10 rounded transition-colors"
                                            title="Editar Flyer"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFlyer(flyer.id)}
                                            className="p-1.5 text-white hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                            title="Excluir Flyer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Informações Inferiores do Flyer */}
                                <div className="relative z-10 p-4 flex flex-col gap-1 text-white">
                                    <h4 className="font-black text-sm uppercase tracking-wide leading-snug line-clamp-2 drop-shadow">
                                        {flyer.titulo}
                                    </h4>
                                    {flyer.subtitulo && (
                                        <p className="text-[11px] text-neutral-300 font-medium line-clamp-2 leading-relaxed">
                                            {flyer.subtitulo}
                                        </p>
                                    )}

                                    <div className="pt-2 flex items-center justify-between gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                                            <Maximize2 size={11} /> Clique p/ ver
                                        </span>
                                        {flyer.link && (
                                            <a
                                                href={flyer.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2 py-1 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-[10px] font-bold flex items-center gap-1 transition-all"
                                                title="Acessar link externo da campanha"
                                            >
                                                Link <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Botão Card para Adicionar Novo Flyer (Proporção 3:4) */}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={handleOpenFlyerModal}
                                className="shrink-0 w-[240px] sm:w-[270px] aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#E3000F] dark:hover:border-[#E3000F] bg-neutral-50/50 dark:bg-neutral-800/20 hover:bg-red-50/20 dark:hover:bg-red-950/10 flex flex-col items-center justify-center gap-3 p-6 text-neutral-400 hover:text-[#E3000F] transition-all group snap-start"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 group-hover:bg-red-100 dark:group-hover:bg-[#E3000F]/20 flex items-center justify-center text-neutral-500 group-hover:text-[#E3000F] transition-all">
                                    <Plus size={24} />
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 group-hover:text-[#E3000F]">
                                        + Novo Flyer (3:4)
                                    </span>
                                    <span className="block text-[10px] text-neutral-400 mt-1">
                                        Adicionar cartaz ou comunicado oficial
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* SEÇÃO DE DOCUMENTOS GEEK PADRÃO */}
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

            {/* MODAL DE CRIAÇÃO / EDIÇÃO DE FLYER 3:4 */}
            {isFlyerModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col transition-colors border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <Sparkles size={18} className="text-[#E3000F]" />
                                {editingFlyerId ? 'Editar Flyer (Proporção 3:4)' : 'Novo Flyer de Campanha (Proporção 3:4)'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => { setIsFlyerModalOpen(false); setEditingFlyerId(null); }}
                                className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFlyerSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Título da Campanha / Flyer <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={flyerFormData.titulo}
                                    onChange={e => setFlyerFormData({ ...flyerFormData, titulo: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold uppercase"
                                    placeholder="Ex: CLARO FIBRA 500 MEGA - BLACK FRIDAY"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Etiqueta / Tag
                                    </label>
                                    <select
                                        value={flyerFormData.tag}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, tag: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold uppercase cursor-pointer"
                                    >
                                        <option value="CAMPANHA OFICIAL">CAMPANHA OFICIAL</option>
                                        <option value="DESTAQUE MENSAL">DESTAQUE MENSAL</option>
                                        <option value="FOCO OPERAÇÃO">FOCO OPERAÇÃO</option>
                                        <option value="COMUNICADO">COMUNICADO</option>
                                        <option value="DIVULGAÇÃO">DIVULGAÇÃO</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Link de Regulamento / Acesso
                                    </label>
                                    <input
                                        type="text"
                                        value={flyerFormData.link}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, link: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Subtítulo / Descrição da Campanha
                                </label>
                                <textarea
                                    value={flyerFormData.subtitulo}
                                    onChange={e => setFlyerFormData({ ...flyerFormData, subtitulo: e.target.value })}
                                    rows={2}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-xs"
                                    placeholder="Ex: Dobro de gigas no Combo Multi com desconto de R$ 30 por 12 meses..."
                                />
                            </div>

                            {/* UPLOAD OU URL DA IMAGEM 3:4 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Imagem do Flyer (Proporção 3:4) <span className="text-[#E3000F]">*</span></span>
                                    <span className="text-[10px] text-neutral-400 font-normal">Recomendado: 600x800 ou 900x1200</span>
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={flyerFormData.imagemUrl}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, imagemUrl: e.target.value })}
                                        className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-xs"
                                        placeholder="Cole a URL da imagem ou envie abaixo..."
                                        required
                                    />
                                    <label className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                                        <Upload size={14} /> Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Mini Preview no Modal com proporção 3:4 */}
                                {flyerFormData.imagemUrl && (
                                    <div className="pt-2 flex items-center gap-3">
                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 bg-neutral-900">
                                            <img
                                                src={flyerFormData.imagemUrl}
                                                alt="Prévia Flyer"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                            ✓ Imagem pronta no formato flyer 3:4!
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => { setIsFlyerModalOpen(false); setEditingFlyerId(null); }}
                                    className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 text-xs"
                                >
                                    {editingFlyerId ? 'Salvar Edição' : 'Publicar Flyer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE VISUALIZAÇÃO AMPLIADA DO FLYER - CAMPO 16:9 NÍTIDO SEM DESFOCAR */}
            {previewFlyer && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-2 sm:p-6 flex items-center justify-center no-print"
                    onClick={() => setPreviewFlyer(null)}
                >
                    <div
                        className="relative w-full max-w-5xl aspect-[16/9] max-h-[90vh] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-950 flex flex-col justify-between animate-fade-in select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Imagem de Fundo com desfoque suave para preenchimento de cinema nas abas laterais */}
                        <img
                            src={previewFlyer.imagemUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-25 scale-110 pointer-events-none"
                        />

                        {/* Imagem Principal Central NÍTIDA em Alta Resolução SEM DESFOCAR */}
                        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-6 z-10 pointer-events-none">
                            <img
                                src={previewFlyer.imagemUrl}
                                alt={previewFlyer.titulo}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl pointer-events-auto"
                                style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                        </div>

                        {/* Barra Superior com Tags e Botões de Ação */}
                        <div className="relative z-20 p-4 sm:p-6 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#E3000F] text-white shadow-lg">
                                    {previewFlyer.tag || 'CAMPANHA'}
                                </span>
                                <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold text-white/90 bg-black/60 backdrop-blur-sm border border-white/10">
                                    {previewFlyer.data}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const toEdit = previewFlyer;
                                                setPreviewFlyer(null);
                                                handleEditFlyer(toEdit);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                            title="Editar dados e imagem deste flyer"
                                        >
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFlyer(previewFlyer.id)}
                                            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                            title="Excluir este flyer"
                                        >
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPreviewFlyer(null)}
                                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all border border-white/20 hover:border-white shadow-lg"
                                    title="Fechar Visualização"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Barra Inferior com Título, Subtítulo e Link Externo */}
                        <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                            <div className="max-w-2xl">
                                <h3 className="text-base sm:text-xl font-black uppercase tracking-wide leading-tight drop-shadow-md">
                                    {previewFlyer.titulo}
                                </h3>
                                {previewFlyer.subtitulo && (
                                    <p className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed drop-shadow mt-1">
                                        {previewFlyer.subtitulo}
                                    </p>
                                )}
                            </div>

                            {previewFlyer.link && (
                                <a
                                    href={previewFlyer.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-2.5 px-4 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0"
                                >
                                    Acessar Link Oficial <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DOCUMENTOS GEEK */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <Cpu size={18} className="text-indigo-500" />
                                {editingId ? 'Editar Material' : 'Adicionar Material'}
                            </h2>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Título do Documento <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="Ex: Book de Aparelhos - Maio"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Categoria <span className="text-[#E3000F]">*</span>
                                </label>
                                <select
                                    value={isNovaCategoria ? 'NOVA_CATEGORIA' : formData.categoria}
                                    onChange={e => {
                                        if (e.target.value === 'NOVA_CATEGORIA') {
                                            setIsNovaCategoria(true);
                                        } else {
                                            setIsNovaCategoria(false);
                                            setFormData({ ...formData, categoria: e.target.value });
                                        }
                                    }}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-bold"
                                >
                                    {allCategorias.map(c => (
                                        <option className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100" key={c.id} value={c.id}>
                                            {c.id}
                                        </option>
                                    ))}
                                    <option className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black" value="NOVA_CATEGORIA">
                                        + CRIAR NOVA CATEGORIA
                                    </option>
                                </select>
                            </div>
                            {isNovaCategoria && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                                        Nome da Nova Categoria <span className="text-[#E3000F]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={novaCategoriaNome}
                                        onChange={e => setNovaCategoriaNome(e.target.value)}
                                        className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm uppercase font-bold"
                                        placeholder="Ex: MANUAIS DE PROCEDIMENTO"
                                        required={isNovaCategoria}
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Link do PDF (Drive / Web) <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="https://..."
                                    required
                                />
                                <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                    Dica: Faça o upload do PDF no Google Drive da loja, clique em "Compartilhar", copie o link e cole aqui!
                                </p>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                    className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 text-sm"
                                >
                                    {editingId ? 'Salvar Edição' : 'Salvar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
