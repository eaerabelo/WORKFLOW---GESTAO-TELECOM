import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X, Wrench } from 'lucide-react';

import imgVenda1 from '../assets/VENDAS_TUTORIAL.png';
import imgVenda2 from '../assets/VENDAS_TUTORIAL2.png';
import imgVenda3 from '../assets/VENDAS_TUTORIAL3.png';
import imgVenda4 from '../assets/VENDAS_TUTORIAL4.png';
import imgVenda5 from '../assets/VENDAS_TUTORIAL5.png';
import imgVenda6 from '../assets/VENDAS_TUTORIAL6.png';
import imgCombo1 from '../assets/COMBO_TUTORIAL.png';
import imgCombo2 from '../assets/COMBO_TUTORIAL2.png';
import imgCombo3 from '../assets/COMBO_TUTORIAL3.png';
import imgCombo4 from '../assets/COMBO_TUTORIAL4.png';
import imgCombo5 from '../assets/COMBO_TUTORIAL5.png';
import imgSistemas1 from '../assets/SISTEMAS_TUTORIAL.png';

// =========================================================================
// 📝 DADOS DOS TUTORIAIS (Insira seus prints e textos aqui depois!)
// =========================================================================
const TUTORIAIS_DATA = {
    'VENDA INDIVIDUAL': [
        {
            imagem: imgVenda1,
            titulo: '1. Iniciando o Registro',
            descricao: 'Na tela principal de Registro de Vendas Diárias, clique no botão vermelho "+ Nova Venda" localizado no canto superior direito para abrir o formulário de registro.'
        },
        {
            imagem: imgVenda2,
            titulo: '2. Selecionando a Modalidade',
            descricao: 'Na janela que se abrir, certifique-se de que a aba superior "VENDA INDIVIDUAL" esteja selecionada. Identifique os campos obrigatórios que precisarão ser preenchidos, como Vendedor, Produto Principal e CPF/CNPJ.'
        },
        {
            imagem: imgVenda3,
            titulo: '3. Informando o Vendedor',
            descricao: 'Com o contexto da venda marcado como "SINGLE", clique no campo "VENDEDOR" e escolha o nome do vendedor responsável pela venda na lista suspensa.'
        },
        {
            imagem: imgVenda4,
            titulo: '4. Escolhendo o Produto e Programas Adicionais',
            descricao: 'Clique no campo "PRODUTO PRINCIPAL" e selecione o plano ou item vendido (por exemplo, POS 50GB). Verifique se o campo "Receita" reflete o valor correto e, na seção inferior, informe se a venda possui algum programa adicional (marcando "NENHUM" caso não haja).'
        },
        {
            imagem: imgVenda5,
            titulo: '5. Preenchendo Dados do Cliente e Confirmando',
            descricao: 'Preencha os detalhes finais, como o "TIPO DE OPERAÇÃO" (ex: Ativação) e digite o "CPF / CNPJ" do cliente. Após revisar todas as informações na tela, clique no botão vermelho "Confirmar Venda" no canto inferior direito.'
        },
        {
            imagem: imgVenda6,
            titulo: '6. Validação do Registro',
            descricao: 'O formulário será fechado e o sistema exibirá uma notificação verde de "Venda registrada com sucesso!" no canto superior direito. O registro da nova venda aparecerá automaticamente como uma nova linha na sua tabela principal.'
        }
    ],
    'VENDA MÚLTIPLA (COMBO)': [
        {
            imagem: imgCombo1,
            titulo: '1. Acessando a Venda Múltipla',
            descricao: 'Após abrir a janela de nova venda, clique na aba "VENDA MÚLTIPLA (COMBO)" na parte superior. Note que, à direita, existe uma área chamada "RESUMO DO COMBO", que inicialmente indicará "Nenhum produto adicionado".'
        },
        {
            imagem: imgCombo2,
            titulo: '2. Selecionando o Primeiro Produto',
            descricao: 'No formulário à esquerda, clique no campo "PRODUTO" e escolha o primeiro plano ou serviço que fará parte do combo a partir da lista suspensa (ex: POS 500GB).'
        },
        {
            imagem: imgCombo3,
            titulo: '3. Detalhando a Operação e Inserindo no Resumo',
            descricao: 'Preencha as configurações específicas deste produto, definindo opções como o "TIPO DE OPERAÇÃO", a "OPERADORA" e se possui "M-PLAY". Ao terminar de preencher as regras do item, clique no botão preto "+ Adicionar Produto ao Combo" localizado na parte inferior. O item será transferido para a área de resumo à direita.'
        },
        {
            imagem: imgCombo4,
            titulo: '4. Adicionando Mais Itens e Finalizando o Combo',
            descricao: 'Repita os passos 2 e 3 para inserir os demais produtos da venda (a imagem mostra o resumo preenchido com três itens diferentes). Selecione o "VENDEDOR" responsável pela operação e, do lado direito, preencha os dados finais: "CPF / CNPJ DO TITULAR", número do "CONTRATO" (quando aplicável) e indique se há programas na aba "VENDA ADICIONAL". Clique no botão vermelho "Confirmar Venda Combo".'
        },
        {
            imagem: imgCombo5,
            titulo: '5. Visualização no Registro Geral',
            descricao: 'De volta à tela principal de Registro de Vendas Diárias, observe que os itens vendidos no combo não aparecem agrupados em uma única linha. O sistema registra cada produto do combo como uma linha individual na tabela, facilitando a visualização separada por tipo, receita e portabilidade para o mesmo cliente e vendedor.'
        }
    ],
    'CONTROLE DE ESTOQUE': [
        {
            imagem: 'https://via.placeholder.com/1000x500/171717/E3000F?text=Substituir+Pelo+Print+3',
            titulo: '1. Visualizando seus Chips',
            descricao: 'Ao abrir a aba de Simcards, o sistema foca automaticamente na sua prateleira de chips para facilitar a localização dos seriais.'
        }
    ],
    'FATOR RV (COMISSIONAMENTO)': [
        {
            imagem: 'https://via.placeholder.com/1000x500/171717/E3000F?text=Substituir+Pelo+Print+4',
            titulo: '1. Acompanhando o Bônus',
            descricao: 'Acompanhe as suas metas de Gross, Receita e Residencial para ver quanto falta para atingir a meta e habilitar seu bônus de pagamento.'
        }
    ],
    'SISTEMAS CLARO': [
        {
            imagem: imgSistemas1,
            titulo: '1. Acessando a Central de Sistemas',
            descricao: 'Ao acessar esta tela, você visualizará o "Portal de Sistemas Claro". Este ambiente funciona como um painel central (hub) cujo objetivo é fornecer acesso rápido e direto a todas as plataformas e ferramentas corporativas utilizadas na rotina.'
        }
    ]
};

export function Tutorial({ onClose, defaultTab, globalUser }) {
    const hasScheduleAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);
    const hasMetaAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO'].includes(globalUser?.role);
    const hasParcialAccess = ['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(globalUser?.role);
    const hasPricingAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);

    const modulosRaw = [
        'VENDA', 'CONTROLE-SIMCARD', 'FATOR RV', 'RESULTADO', 'COLABORADORES', 
        'META', 'ESCALA DE TRABALHO', 'UR-RESIDENCIAL', 'PROPOSTA', 'REPROVADOS', 
        'PARCIAL & FECHAMENTO', 'GEEK', 'SCRIPTS', 'CAMPANHAS', 'PRECIFICAÇÃO', 
        'SISTEMAS CLARO'
    ];

    const modulos = modulosRaw.filter(mod => {
        if (mod === 'META' && !hasMetaAccess) return false;
        if (mod === 'ESCALA DE TRABALHO' && !hasScheduleAccess) return false;
        if (mod === 'PARCIAL & FECHAMENTO' && !hasParcialAccess) return false;
        if (mod === 'PRECIFICAÇÃO' && !hasPricingAccess) return false;
        return true;
    });
    
    // Mapeia a aba atual do sistema para a aba correspondente do tutorial
    const initialMod = defaultTab === 'VENDA' ? 'VENDA INDIVIDUAL' : 
        defaultTab === 'CONTROLE-SIMCARD' ? 'CONTROLE DE ESTOQUE' : 
            defaultTab === 'FATOR RV' ? 'FATOR RV (COMISSIONAMENTO)' :
                defaultTab;

    const [moduloAtivo, setModuloAtivo] = useState(initialMod || 'VENDA INDIVIDUAL');
    const [slideAtual, setSlideAtual] = useState(0);

    useEffect(() => {
        setModuloAtivo(initialMod || 'VENDA INDIVIDUAL');
        setSlideAtual(0);
    }, [initialMod]);

    const slides = TUTORIAIS_DATA[moduloAtivo] || [];

    const proximoSlide = () => {
        setSlideAtual(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const slideAnterior = () => {
        setSlideAtual(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const mudarModulo = (modulo) => {
        setModuloAtivo(modulo);
        setSlideAtual(0);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col animate-fade-in transition-colors overflow-hidden">
                {/* CABEÇALHO */}
                <div className="p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Central de Treinamento (Tutoriais)</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Aprenda a utilizar os módulos do sistema passo a passo.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* ABAS (MENU DE MÓDULOS) */}
                <div className="flex overflow-x-auto bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 scrollbar-thin shrink-0 px-2 pb-1" onWheel={(e) => e.currentTarget.scrollLeft += e.deltaY}>
                    {['VENDA INDIVIDUAL', 'VENDA MÚLTIPLA (COMBO)', 'CONTROLE DE ESTOQUE', 'FATOR RV (COMISSIONAMENTO)', ...modulos.filter(m => m !== 'VENDA' && m !== 'CONTROLE-SIMCARD' && m !== 'FATOR RV')].map(mod => (
                        <button key={mod} onClick={() => mudarModulo(mod)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-[3px] rounded-t-sm ${moduloAtivo === mod ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
                            {mod}
                        </button>
                    ))}
                </div>

                {/* ÁREA DO CARROSSEL */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center bg-neutral-100/50 dark:bg-neutral-950/50">
                    {slides.length > 0 ? (
                        <div className="max-w-4xl w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
                            {/* IMAGEM COM CONTROLES */}
                            <div className="relative w-full aspect-video bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
                                <img src={slides[slideAtual].imagem} alt={slides[slideAtual].titulo} className="w-full h-full object-contain" />
                                
                                {slides.length > 1 && (
                                    <>
                                        <button onClick={slideAnterior} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md"><ChevronLeft size={24} /></button>
                                        <button onClick={proximoSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md"><ChevronRight size={24} /></button>
                                    </>
                                )}

                                {/* INDICADORES (BOLINHAS) */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 px-3 py-2 rounded-full backdrop-blur-md">
                                    {slides.map((_, idx) => (<button key={idx} onClick={() => setSlideAtual(idx)} className={`h-2 rounded-full transition-all shadow-sm ${slideAtual === idx ? 'bg-[#E3000F] w-6' : 'bg-white/60 hover:bg-white w-2'}`} />))}
                                </div>
                            </div>

                            {/* TEXTO DESCRITIVO */}
                            <div className="p-4 md:p-6 text-center bg-white dark:bg-neutral-900">
                                <span className="text-[#E3000F] font-black text-[10px] uppercase tracking-widest mb-1 block">Passo {slideAtual + 1} de {slides.length}</span>
                                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">{slides[slideAtual].titulo}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">{slides[slideAtual].descricao}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 max-w-lg">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
                                <Wrench size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Tutorial em Desenvolvimento</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                O guia passo a passo com imagens para o módulo <strong className="text-neutral-700 dark:text-neutral-300">{moduloAtivo}</strong> está sendo criado e estará disponível em breve.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 