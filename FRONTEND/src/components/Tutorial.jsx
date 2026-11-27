import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X, Wrench, ShieldCheck, ZoomIn } from 'lucide-react';

// Imagens Oficiais de Treinamento Validadas (Correspondentes às Telas Reais do Sistema)
import imgBoasVindas from '../assets/tutoriais/work_boasvindas.jpeg';
import imgRegras from '../assets/tutoriais/work_regras.jpeg';
import imgVendas from '../assets/tutoriais/work_vendas.jpeg';
import imgVendaConjunta from '../assets/tutoriais/work_vendaconjunta.jpeg';
import imgSimcards from '../assets/tutoriais/work_simcards.jpeg';
import imgGeek from '../assets/tutoriais/work_geek.jpeg';
import imgBundle from '../assets/tutoriais/work_budle.jpeg';
import imgParcial from '../assets/tutoriais/work_parcial.jpeg';
import imgReprovados from '../assets/tutoriais/work_reprovados.jpeg';
import imgRv from '../assets/tutoriais/work_rv.jpeg';
import imgGestao from '../assets/tutoriais/work_gestao.jpeg';
import imgMxM from '../assets/tutoriais/work_MxM.jpeg';
import imgSxS from '../assets/tutoriais/work_SxS.jpeg';
import imgDiagnostico from '../assets/tutoriais/work_diagnostico.jpeg';

const TUTORIAIS_DATA = {
    'REGRAS E TERMOS': [
        {
            imagem: imgRegras,
            titulo: 'Regras de Uso, Termos Oficiais e Padrões Operacionais',
            descricao: 'Conheça as principais definições (Workflow, Meta, Pacing, KPI), regras de uso diário, sigilo das informações e boas práticas para evitar sangria de dados e retrabalho na loja.'
        },
        {
            imagem: imgBoasVindas,
            titulo: 'Visão Geral — Entenda o Ecossistema WorkFlow',
            descricao: 'Resumo executivo de como o WorkFlow centraliza metas, vendas e indicadores da unidade para acelerar resultados e apoiar decisões com dados reais.'
        }
    ],
    'VENDA INDIVIDUAL': [
        {
            imagem: imgVendas,
            titulo: 'Registro de Vendas Diárias & Consulta Rápida',
            descricao: 'Utilize a busca rápida, o filtro de período e o botão "+ Nova Venda" para lançar vendas individuais (Single, Multi ou Multi 3P) e acompanhar os totalizadores no rodapé.'
        }
    ],
    'VENDA CONJUNTA (COMBO)': [
        {
            imagem: imgVendaConjunta,
            titulo: 'Lançamento de Venda Conjunta (Combo Multi / Device + Serviços)',
            descricao: 'Selecione a aba "VENDA CONJUNTA", adicione cada produto ao carrinho "+ Adicionar Produto ao Combo", confira o Resumo do Combo à direita, preencha os dados do cliente/contrato e clique em "Confirmar Venda Combo".'
        }
    ],
    'CONTROLE-SIMCARD': [
        {
            imagem: imgSimcards,
            titulo: 'Controle de Estoque de SIMCards (ICCID Físico & Virtual eSIM)',
            descricao: 'Gerencie os lotes de chips físicos e eSIM por vendedor, acompanhe o Selo Digital automático "EM USO" ao copiar um ICCID e exporte o inventário para Excel quando necessário.'
        }
    ],
    'GEEK': [
        {
            imagem: imgGeek,
            titulo: '1. Hub Geek — Ofertas Conjuntas & Materiais Técnicos',
            descricao: 'Navegue pelas ofertas por fabricante (Samsung, Motorola e Apple), filtre por categoria (Todos os Bundles, Relógios & Fones, Capas MagSafe e Lâmina Multi Friday) e consulte vigências e preços.'
        },
        {
            imagem: imgBundle,
            titulo: '2. Detalhamento de Bundles, Preços & Códigos SAP',
            descricao: 'Consulte rapidamente o preço promocional do Bundle versus o valor avulso, visualize todos os aparelhos elegíveis (COMPRE) e copie os códigos SAP oficiais com apenas 1 clique.'
        }
    ],
    'FATOR RV': [
        {
            imagem: imgRv,
            titulo: 'Simulador de Remuneração Variável (Fator RV)',
            descricao: 'Acompanhe a prévia estimada de remuneração variável, o status dos pisos mínimos de elegibilidade (Receita, Gross Móvel e Residencial), aceleradores M-Play e dicas de alavancagem.'
        }
    ],
    'PARCIAL & FECHAMENTO': [
        {
            imagem: imgParcial,
            titulo: 'Parcial Horária & Fechamento de Loja',
            descricao: 'Consolide automaticamente os indicadores realizados por hora e o fechamento completo do final do dia (Desempenho Móvel, Residencial, Aparelhos, Acessórios e Anexação) para envio imediato no WhatsApp.'
        }
    ],
    'REPROVADOS': [
        {
            imagem: imgReprovados,
            titulo: 'Inviabilidade Residencial & Mapa de Calor por CEP',
            descricao: 'Registre reprovações técnicas/crédito, identifique zonas de calor críticas por CEP no termômetro regional e abra a localização diretamente no Google Maps.'
        }
    ],
    'GESTÃO': [
        {
            imagem: imgGestao,
            titulo: '1. Gestão de Metas Mensais da Loja',
            descricao: 'Defina a Receita Global, os dias úteis (Móvel/Devices e Residencial/Fibra) e as metas por categoria. O sistema distribui automaticamente as metas entre os vendedores ativos.'
        },
        {
            imagem: imgMxM,
            titulo: '2. Histórico Comparativo Mês a Mês (MxM)',
            descricao: 'Compare a evolução do faturamento e dos indicadores realizados mês a mês frente às metas definidas, além de acessar a linha direta do painel de Resultado.'
        },
        {
            imagem: imgSxS,
            titulo: '3. Histórico Semana x Semana (SxS)',
            descricao: 'Acompanhe o desempenho faturado semana a semana (de quinta a quarta-feira), com percentuais automáticos de crescimento ou retração e consolidado do mês.'
        },
        {
            imagem: imgDiagnostico,
            titulo: '4. Diagnóstico Semanal & Planos de Ação',
            descricao: 'Analise quedas e ganhos entre semanas consecutivas, registre Causa Raiz e Plano de Ação da gestão e exporte apresentações prontas em PowerPoint (PPTX) ou Excel.'
        }
    ]
};

export function Tutorial({ onClose, defaultTab, globalUser }) {
    const userRoleUpper = String(globalUser?.role || 'VENDEDOR').trim().toUpperCase();
    const hasMetaAccess = [
        'GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'ADM', 'GEEK',
        'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO', 'COORDENADOR', 'ESPECIALISTA'
    ].includes(userRoleUpper);
    const hasParcialAccess = [
        'GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO',
        'ADMINISTRAÇÃO', 'ADM', 'COORDENADOR', 'ESPECIALISTA'
    ].includes(userRoleUpper);

    const orderedTabs = [
        'REGRAS E TERMOS',
        'VENDA INDIVIDUAL',
        'VENDA CONJUNTA (COMBO)',
        'CONTROLE-SIMCARD',
        'GEEK',
        'FATOR RV',
        ...(hasParcialAccess ? ['PARCIAL & FECHAMENTO'] : []),
        'REPROVADOS',
        ...(hasMetaAccess ? ['GESTÃO'] : [])
    ];

    const mapDefaultTabToTutorial = (tab) => {
        if (!tab) return 'REGRAS E TERMOS';
        if (tab === 'VENDA') return 'VENDA INDIVIDUAL';
        if (TUTORIAIS_DATA[tab]) return tab;
        return 'REGRAS E TERMOS';
    };

    const [moduloAtivo, setModuloAtivo] = useState(() => mapDefaultTabToTutorial(defaultTab));
    const [slideAtual, setSlideAtual] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    useEffect(() => {
        setModuloAtivo(mapDefaultTabToTutorial(defaultTab));
        setSlideAtual(0);
    }, [defaultTab]);

    const slides = TUTORIAIS_DATA[moduloAtivo] || TUTORIAIS_DATA['REGRAS E TERMOS'];
    const currentSlide = slides[slideAtual] || slides[0];

    const proximoSlide = () => {
        setSlideAtual((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const slideAnterior = () => {
        setSlideAtual((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const mudarModulo = (modulo) => {
        setModuloAtivo(modulo);
        setSlideAtual(0);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center no-print">
                <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] max-h-[860px] flex flex-col animate-fade-in transition-colors overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    {/* CABEÇALHO */}
                    <div className="px-4 py-3.5 md:px-6 md:py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/90 dark:bg-neutral-900 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/15 flex items-center justify-center text-[#E3000F]">
                                <BookOpen size={21} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
                                    Central de Treinamento & Regras WorkFlow
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                    Guias visuais passo a passo e regras oficiais dos módulos do sistema
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* MENU DE ABAS DOS MÓDULOS (COM DESTAQUE PARA REGRAS E TERMOS) */}
                    <div
                        className="flex overflow-x-auto bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 scrollbar-thin shrink-0 px-3 gap-1"
                        onWheel={(e) => {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }}
                    >
                        {orderedTabs.map((mod) => {
                            const isRegras = mod === 'REGRAS E TERMOS';
                            const isActive = moduloAtivo === mod;
                            return (
                                <button
                                    key={mod}
                                    type="button"
                                    onClick={() => mudarModulo(mod)}
                                    className={`px-3.5 py-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border-b-[3px] flex items-center gap-1.5 cursor-pointer ${
                                        isActive
                                            ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900'
                                            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    }`}
                                >
                                    {isRegras && <ShieldCheck size={14} className="text-[#E3000F] shrink-0" />}
                                    <span>{mod}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ÁREA DO CARROSSEL VISUAL */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center justify-between bg-neutral-100/70 dark:bg-neutral-950/70 gap-3">
                        {currentSlide ? (
                            <div className="max-w-5xl w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col flex-1 min-h-0">
                                {/* IMAGEM COM CONTROLES E ZOOM */}
                                <div className="relative flex-1 min-h-[260px] bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                                    <img
                                        src={currentSlide.imagem}
                                        alt={currentSlide.titulo}
                                        onClick={() => setIsZoomOpen(true)}
                                        className="w-full h-full max-h-[58vh] object-contain cursor-zoom-in select-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setIsZoomOpen(true)}
                                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/15 transition-all cursor-pointer"
                                        title="Ampliar imagem em tela cheia"
                                    >
                                        <ZoomIn size={14} />
                                        <span className="hidden sm:inline">Ampliar</span>
                                    </button>

                                    {slides.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={slideAnterior}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/55 hover:bg-[#E3000F] text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md cursor-pointer"
                                            >
                                                <ChevronLeft size={22} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={proximoSlide}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/55 hover:bg-[#E3000F] text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md cursor-pointer"
                                            >
                                                <ChevronRight size={22} />
                                            </button>
                                        </>
                                    )}

                                    {slides.length > 1 && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                            {slides.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSlideAtual(idx)}
                                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                                        slideAtual === idx
                                                            ? 'bg-[#E3000F] w-6'
                                                            : 'bg-white/60 hover:bg-white w-2'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* LEGENDA DESCRITIVA */}
                                <div className="px-4 py-3.5 sm:px-6 sm:py-4 text-center bg-white dark:bg-neutral-900 shrink-0">
                                    <span className="text-[#E3000F] font-black text-[10px] uppercase tracking-widest mb-0.5 block">
                                        {slides.length > 1
                                            ? `Guia ${slideAtual + 1} de ${slides.length} • ${moduloAtivo}`
                                            : `Guia Oficial • ${moduloAtivo}`}
                                    </span>
                                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-800 dark:text-neutral-100 mb-1">
                                        {currentSlide.titulo}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                                        {currentSlide.descricao}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 max-w-lg my-auto">
                                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
                                    <Wrench size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                                    Tutorial em Desenvolvimento
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    O guia passo a passo para o módulo <strong>{moduloAtivo}</strong> estará disponível em breve.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIGHTBOX DE AMPLIAÇÃO EM TELA CHEIA */}
            {isZoomOpen && currentSlide && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fade-in cursor-zoom-out no-print"
                    onClick={() => setIsZoomOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsZoomOpen(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={currentSlide.imagem}
                        alt={currentSlide.titulo}
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                </div>
            )}
        </>
    );
}
