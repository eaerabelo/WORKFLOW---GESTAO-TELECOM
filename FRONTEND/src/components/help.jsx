import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, HelpCircle, Sparkles, MessageSquareQuote, Lightbulb,
    Copy, Check, Search, ChevronDown, ChevronUp, Plus, Trash2, ShieldAlert, Zap, BookOpen, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchHelpAPI, createArgumentacaoAPI, deleteArgumentacaoAPI } from '../services/api.js';

export const Help = ({ globalUser, onBack }) => {
    const [activeSection, setActiveSection] = useState('COMO_FUNCIONA'); // 'COMO_FUNCIONA' | 'ARGUMENTACOES'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('TODOS');
    const [selectedFaqModule, setSelectedFaqModule] = useState('TODOS');
    const [openFaqId, setOpenFaqId] = useState('faq-01-venda-lancamento');
    const [expandAllFaqs, setExpandAllFaqs] = useState(true);
    const [copiedArgId, setCopiedArgId] = useState(null);

    const [faqs, setFaqs] = useState([]);
    const [argumentacoes, setArgumentacoes] = useState([]);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [savingArg, setSavingArg] = useState(false);

    const [newArg, setNewArg] = useState({
        category: 'PÓS-PAGO & UPGRADE',
        title: '',
        badge: 'Dica da Equipe',
        trigger: 'Persuasão Consultiva',
        scenario: '',
        pitch: '',
        objectionHandler: '',
        goldenTip: ''
    });

    const canManageCustom = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(
        String(globalUser?.role || '').toUpperCase()
    );

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchHelpAPI();
                if (mounted) {
                    if (Array.isArray(res?.faqs)) setFaqs(res.faqs);
                    if (Array.isArray(res?.argumentacoes)) setArgumentacoes(res.argumentacoes);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const categories = ['TODOS', ...Array.from(new Set(argumentacoes.map(a => a.category).filter(Boolean)))];
    const faqModules = ['TODOS', ...Array.from(new Set(faqs.map(f => f.module).filter(Boolean)))];

    const filteredFaqs = faqs.filter(f => {
        const matchMod = selectedFaqModule === 'TODOS' || f.module === selectedFaqModule;
        if (!matchMod) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(f.question || '').toLowerCase().includes(q) ||
            String(f.answer || '').toLowerCase().includes(q) ||
            String(f.module || '').toLowerCase().includes(q)
        );
    });

    const filteredArgs = argumentacoes.filter(a => {
        const matchCat = selectedCategory === 'TODOS' || a.category === selectedCategory;
        if (!matchCat) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(a.title || '').toLowerCase().includes(q) ||
            String(a.category || '').toLowerCase().includes(q) ||
            String(a.scenario || '').toLowerCase().includes(q) ||
            String(a.pitch || '').toLowerCase().includes(q) ||
            String(a.objectionHandler || '').toLowerCase().includes(q)
        );
    });

    const handleCopyPitch = (arg) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(arg.pitch).catch(() => {});
        }
        setCopiedArgId(arg.id);
        setTimeout(() => setCopiedArgId(prev => (prev === arg.id ? null : prev)), 2000);
        toast.success('Argumentação copiada! Pronta para usar no atendimento.');
    };

    const handleCreateArg = async (e) => {
        e.preventDefault();
        setSavingArg(true);
        try {
            const res = await createArgumentacaoAPI(newArg);
            if (res?.argumentacao) {
                setArgumentacoes(prev => [res.argumentacao, ...prev]);
                setIsNewModalOpen(false);
                setNewArg({
                    category: 'PÓS-PAGO & UPGRADE',
                    title: '',
                    badge: 'Dica da Equipe',
                    trigger: 'Persuasão Consultiva',
                    scenario: '',
                    pitch: '',
                    objectionHandler: '',
                    goldenTip: ''
                });
                toast.success('Nova ideia de argumentação publicada!');
            }
        } catch (err) {
            toast.error(err.message || 'Erro ao adicionar argumentação.');
        } finally {
            setSavingArg(false);
        }
    };

    const handleDeleteArg = async (id) => {
        try {
            await deleteArgumentacaoAPI(id);
            setArgumentacoes(prev => prev.filter(a => a.id !== id));
            toast.success('Argumentação removida.');
        } catch (err) {
            toast.error('Não foi possível remover.');
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#F7F7F8] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 flex flex-col animate-fade-in overflow-y-auto">
            {/* Barra Superior Minimalista (Tela Individual mantendo a mesma URL) */}
            <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E3000F] hover:text-white text-neutral-700 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                        <ArrowLeft size={15} />
                        <span>Voltar ao Painel</span>
                    </button>
                    <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                        Central de Ajuda & Laboratório de Argumentações
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all"
                    >
                        <Plus size={14} />
                        <span>Nova Argumentação</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                {/* Banner Principal Lúdico & Elegante */}
                <section className="rounded-3xl bg-gradient-to-r from-neutral-900 via-[#2b090e] to-[#E3000F] text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                        <Lightbulb size={170} />
                    </div>
                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={12} className="text-amber-300" />
                            <span>Guia Interativo & Arsenal de Vendas</span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase">
                            Domine o Sistema & Encante na Argumentação
                        </h1>
                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                            Alterne abaixo entre o manual rápido de <strong>Como Funciona o Sistema (já com respostas diretas)</strong> e o nosso <strong>Laboratório de Argumentações</strong> com frases de impacto, gatilhos mentais e contornos de objeções para cada produto.
                        </p>
                    </div>

                    {/* Seletor das 2 Experiências + Busca */}
                    <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/10 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setActiveSection('ARGUMENTACOES')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    activeSection === 'ARGUMENTACOES'
                                        ? 'bg-white text-[#E3000F] shadow-md'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <MessageSquareQuote size={15} />
                                <span>Argumentações de Vendas</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('COMO_FUNCIONA')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    activeSection === 'COMO_FUNCIONA'
                                        ? 'bg-white text-[#E3000F] shadow-md'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <BookOpen size={15} />
                                <span>Como Funciona o Sistema</span>
                            </button>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar dúvida, produto ou objeção..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/30 border border-white/20 text-xs font-medium text-white outline-none focus:border-white"
                            />
                        </div>
                    </div>
                </section>

                {/* ABA 1: LABORATÓRIO LÚDICO E ELEGANTE DE ARGUMENTAÇÕES */}
                {activeSection === 'ARGUMENTACOES' ? (
                    <section className="space-y-5">
                        {/* Filtro de Categorias */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                                        selectedCategory === cat
                                            ? 'bg-[#E3000F] text-white border-[#E3000F] shadow-md shadow-red-500/20'
                                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-[#E3000F]/40'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Cards Lúdicos de Argumentação */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filteredArgs.map((arg) => {
                                const isCopied = copiedArgId === arg.id;
                                return (
                                    <div
                                        key={arg.id}
                                        className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative group"
                                    >
                                        <div className="space-y-3.5">
                                            {/* Topo do Card: Categoria + Gatilho */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-[#E3000F]/15 text-[#E3000F] border border-red-200/60 dark:border-[#E3000F]/30">
                                                    {arg.category}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                                        <Zap size={11} />
                                                        <span>{arg.trigger}</span>
                                                    </span>
                                                    {arg.isCustom && canManageCustom && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteArg(arg.id)}
                                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Remover argumentação"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-base font-black text-neutral-900 dark:text-white leading-snug">
                                                {arg.title}
                                            </h3>

                                            {/* Cenário / Objeção do Cliente */}
                                            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 text-xs">
                                                <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">
                                                    Cenário / Objeção do Cliente:
                                                </span>
                                                <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                                                    {arg.scenario}
                                                </p>
                                            </div>

                                            {/* Frase de Impacto Pronta */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50/80 via-white to-red-50/40 dark:from-[#E3000F]/15 dark:via-neutral-900 dark:to-neutral-900 border border-[#E3000F]/30 relative">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#E3000F] flex items-center gap-1">
                                                        <MessageSquareQuote size={13} />
                                                        <span>Abordagem de Ouro (Fale ou Envie):</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyPitch(arg)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                                                            isCopied
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-[#E3000F] hover:bg-red-700 text-white'
                                                        }`}
                                                    >
                                                        {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                                                    </button>
                                                </div>
                                                <p className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-relaxed italic">
                                                    {arg.pitch}
                                                </p>
                                            </div>

                                            {/* Contorno de Objeção */}
                                            <div className="text-xs space-y-1">
                                                <span className="font-black uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                                    <ShieldAlert size={12} className="text-[#E3000F]" />
                                                    <span>Como Contornar a Objeção:</span>
                                                </span>
                                                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                    {arg.objectionHandler}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Dica de Ouro no Rodapé do Card */}
                                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                                            <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                            <span><strong>Pulo do Gato:</strong> {arg.goldenTip}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    /* ABA 2: COMO FUNCIONA O SISTEMA (PERGUNTAS JÁ COM RESPOSTAS) */
                    <section className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {faqModules.map((mod) => (
                                    <button
                                        key={mod}
                                        type="button"
                                        onClick={() => setSelectedFaqModule(mod)}
                                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                                            selectedFaqModule === mod
                                                ? 'bg-[#E3000F] text-white border-[#E3000F] shadow-md shadow-red-500/20'
                                                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-[#E3000F]/40'
                                        }`}
                                    >
                                        {mod}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpandAllFaqs(prev => !prev)}
                                className="px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:border-[#E3000F] hover:text-[#E3000F] transition-colors shrink-0 self-start sm:self-auto"
                            >
                                {expandAllFaqs ? 'Recolher Respostas' : `Expandir Todas (${filteredFaqs.length})`}
                            </button>
                        </div>

                        {filteredFaqs.map((faq) => {
                            const isOpen = expandAllFaqs || openFaqId === faq.id;
                            return (
                                <div
                                    key={faq.id}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (expandAllFaqs) {
                                                setExpandAllFaqs(false);
                                                setOpenFaqId(faq.id);
                                            } else {
                                                setOpenFaqId(isOpen ? null : faq.id);
                                            }
                                        }}
                                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-[#E3000F]/15 text-[#E3000F] shrink-0">
                                                {faq.module}
                                            </span>
                                            <h3 className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-100">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <span className="text-neutral-400 shrink-0">
                                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3 animate-fade-in">
                                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                            {Array.isArray(faq.tips) && faq.tips.length > 0 && (
                                                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 space-y-1.5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#E3000F] block">
                                                        Dicas Práticas deste Módulo:
                                                    </span>
                                                    <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300 list-disc list-inside">
                                                        {faq.tips.map((t, i) => (
                                                            <li key={i}>{t}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                )}
            </main>

            {/* Modal para Criar Nova Ideia de Argumentação */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60">
                            <div className="flex items-center gap-2">
                                <Lightbulb size={18} className="text-[#E3000F]" />
                                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                                    Compartilhar Nova Argumentação
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNewModalOpen(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateArg} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                        Categoria da Venda
                                    </label>
                                    <select
                                        value={newArg.category}
                                        onChange={(e) => setNewArg({ ...newArg, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                                    >
                                        <option value="PÓS-PAGO & UPGRADE">PÓS-PAGO & UPGRADE</option>
                                        <option value="COMBO MULTI (CONVERGÊNCIA)">COMBO MULTI (CONVERGÊNCIA)</option>
                                        <option value="PORTABILIDADE">PORTABILIDADE</option>
                                        <option value="SEGURO & PROTEÇÃO MÓVEL">SEGURO & PROTEÇÃO MÓVEL</option>
                                        <option value="FIBRA & TV BOX (UR)">FIBRA & TV BOX (UR)</option>
                                        <option value="DEVICES & TROCAFY">DEVICES & TROCAFY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                        Gatilho Mental
                                    </label>
                                    <input
                                        type="text"
                                        value={newArg.trigger}
                                        onChange={(e) => setNewArg({ ...newArg, trigger: e.target.value })}
                                        placeholder="Ex: Ancoragem de Valor"
                                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                    Título da Argumentação *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newArg.title}
                                    onChange={(e) => setNewArg({ ...newArg, title: e.target.value })}
                                    placeholder="Ex: Virada de Chave para Cliente Indeciso no Pós"
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                    Cenário / Objeção do Cliente
                                </label>
                                <input
                                    type="text"
                                    value={newArg.scenario}
                                    onChange={(e) => setNewArg({ ...newArg, scenario: e.target.value })}
                                    placeholder="O que o cliente costuma dizer antes dessa abordagem?"
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                    Frase de Impacto / Roteiro da Argumentação *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={newArg.pitch}
                                    onChange={(e) => setNewArg({ ...newArg, pitch: e.target.value })}
                                    placeholder="Escreva a fala persuasiva pronta para usar..."
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                                    Como Contornar a Objeção + Pulo do Gato
                                </label>
                                <input
                                    type="text"
                                    value={newArg.goldenTip}
                                    onChange={(e) => setNewArg({ ...newArg, goldenTip: e.target.value })}
                                    placeholder="Dica extra para fechar a venda..."
                                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingArg}
                                    className="px-5 py-2 rounded-xl bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    {savingArg ? 'Salvando...' : 'Publicar Argumentação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
