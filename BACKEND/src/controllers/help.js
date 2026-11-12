import express from 'express';
import oracledb from 'oracledb';
import { getOracleConnection } from '../config/oracle.js';

const router = express.Router();

// ============================================================================
// BASE DE CONHECIMENTO: COMO FUNCIONA O SISTEMA (PERGUNTAS E RESPOSTAS)
// ============================================================================
const SYSTEM_FAQ = [
    {
        id: 'faq-01-venda-lancamento',
        module: 'VENDA',
        question: '1. Como lançar uma Venda Individual ou um Combo Múltiplo no sistema?',
        answer: 'Na seção VENDA, clique em "+ Nova Venda". Você pode escolher entre "Venda Individual" (para registrar um único produto rapidamente) ou "Venda Múltipla (Combo)" (para montar um carrinho com vários produtos da mesma família ou cliente). Selecione o formato (SINGLE, MULTI ou MULTI 3P) para que o sistema preencha automaticamente o valor tabelado. Por segurança e privacidade (LGPD), o sistema não solicita mais CPF na seção de Venda.',
        tips: [
            'Sempre confira se a flag de Portabilidade (SIM/NÃO) e M-Play estão marcadas corretamente antes de salvar.',
            'No modo Combo Múltiplo, todos os itens adicionados ao carrinho são registrados de uma só vez com o mesmo vendedor e data.'
        ]
    },
    {
        id: 'faq-02-venda-cidades-ur',
        module: 'VENDA',
        question: '2. Como o sistema identifica automaticamente a Cidade pelo código do Contrato Residencial?',
        answer: 'Ao lançar qualquer produto residencial (Fibra, TV+, TV-Box, Fixo ou Ponto Mesh) na seção VENDA, basta digitar o número do Contrato no formato 000-00000000-0. O sistema lê automaticamente os 3 primeiros dígitos (código da praça) e preenche a cidade correspondente sem precisar digitar manualmente.',
        tips: [
            'Códigos mapeados automaticamente: 924 = Osasco | 003 = São Paulo | 443 = Barueri | 533 = Carapicuíba.',
            'Se o código pertencer a outra praça, o campo Cidade fica liberado para preenchimento manual.'
        ]
    },
    {
        id: 'faq-03-venda-comissao-aparelho',
        module: 'VENDA',
        question: '3. Como funciona o cálculo de Receita líquida de Aparelhos, Acessórios e Seguro?',
        answer: 'Para produtos físicos (Aparelhos, Acessórios e Películas), você digita o Valor Bruto pago pelo cliente na nota e o sistema calcula automaticamente a Receita líquida que conta para sua meta: Acessórios e Películas convertem 20% do valor bruto; Aparelhos convertem 5% por padrão, mas sobem automaticamente para 6% quando vendidos junto com Seguro ou Trocafy!',
        tips: [
            'No modo Combo Múltiplo, ao incluir um Aparelho e um Seguro no mesmo carrinho, o sistema já aplica a alíquota turbinada de 6% sobre o aparelho automaticamente.'
        ]
    },
    {
        id: 'faq-04-venda-dependentes',
        module: 'VENDA',
        question: '4. Qual a diferença entre Dependente Pago, Dependente Grátis e Dependente Banda Larga?',
        answer: 'Ao selecionar o produto DEPENDENTE em uma venda Móvel, o sistema abre o seletor de subtipo: "Pago" (gera receita mensal de R$ 50,00 e soma no Gross), "Grátis / Inclusa" (receita R$ 0,00, mas contabiliza volume de linha ativada no Gross) e "Banda-Larga" (chip de dados vinculado ao pacote Pós).',
        tips: [
            'Registrar todos os dependentes corretamente aumenta seu volume de Gross Móvel e melhora seus indicadores na Visão 360.'
        ]
    },
    {
        id: 'faq-05-simcard-selo-digital',
        module: 'CONTROLE-SIMCARD',
        question: '5. Como funciona o Selo Digital "EM USO" ao copiar um ICCID na seção Controle Simcard?',
        answer: 'Na seção CONTROLE-SIMCARD, as caixinhas são dispostas na horizontal em lista vertical compacta. Assim que você clica no botão "Copiar" ao lado do ICCID ou seleciona a linha e pressiona Ctrl + C, o sistema copia o número para sua área de transferência e aplica instantaneamente o Selo Digital "EM USO" com seu Login e Nome (Ex: LOGIN 95802904 - MATHEUS RABELO).',
        tips: [
            'O selo evita que dois vendedores utilizem o mesmo chip ao mesmo tempo durante uma ativação ou portabilidade na loja.'
        ]
    },
    {
        id: 'faq-06-simcard-travas',
        module: 'CONTROLE-SIMCARD',
        question: '6. Quais são as 3 travas de segurança da seção Controle Simcard?',
        answer: 'O módulo de Controle Simcard possui 3 travas automáticas: (1) Trava de Duplicidade: impede o cadastro de qualquer ICCID (Chip/E-SIM) ou CAID (TV Box) que já exista no banco; (2) Trava de Data Local: a data de entrada é fixada automaticamente na data local do dia e não pode ser adulterada; (3) Trava de Remoção do Selo: vendedores não podem remover o selo "EM USO".',
        tips: [
            'Para remover um Selo Digital "EM USO" (caso o chip não tenha sido utilizado), apenas cargos de Liderança/ADM podem autorizar digitando Login e Senha na hora — e essa autorização vale exclusivamente para aquela remoção.'
        ]
    },
    {
        id: 'faq-07-simcard-lote',
        module: 'CONTROLE-SIMCARD',
        question: '7. Como dar entrada em vários Chips ou TV Box de uma vez usando o botão "+ Lote"?',
        answer: 'Clique em "+ Lote", escolha a categoria (Simcard Físico, E-SIM ou TV-Box) e cole ou bipe a sequência de códigos ICCID (20 dígitos começando com 8955) ou CAID (10 a 12 dígitos para TV Box), um por linha. O sistema valida o formato, bloqueia códigos repetidos e cria todas as caixinhas numeradas automaticamente.',
        tips: [
            'Você pode usar leitor de código de barras diretamente no campo de texto do Lote: cada leitura pula de linha automaticamente.'
        ]
    },
    {
        id: 'faq-08-visao360-dashboard',
        module: 'VISÃO 360',
        question: '8. Como interpretar os cards e o DASHBOARD dentro da seção VISÃO 360?',
        answer: 'Na tela inicial da VISÃO 360, cada colaborador possui um card com sua foto de perfil, medalhas de ranking (Top 1, Top 2, Top 3, Destaque Pós, Controle, Residencial, Aparelho e Acessórios) e resumo de Receita, Pós Total e UR Total. Ao clicar no seu card, abre-se o DASHBOARD com barras de atingimento de GROSS TOTAL, UR-RESIDENCIAL, DEVICES e SERVIÇOS ADICIONAIS.',
        tips: [
            'Vendedores visualizam livremente o próprio card; para abrir o detalhamento de outro colega, o sistema solicita autorização da Liderança.'
        ]
    },
    {
        id: 'faq-09-visao360-status-operacoes',
        module: 'VISÃO 360',
        question: '9. Como funciona a caixa de Status (Ativações, Migrações e Portabilidade) na VISÃO 360?',
        answer: 'Ao lado da caixa de Serviços Adicionais dentro do DASHBOARD da VISÃO 360, você encontra o painel de Status Operacional Móvel. Ele calcula automaticamente, com base nas suas vendas do mês, a quantidade exata e a porcentagem (%) de Ativações (linhas novas), Migrações (Pré para Controle/Pós) e Portabilidades (trazidas de outras operadoras) em barras visuais.',
        tips: [
            'Acompanhe sua barra de Portabilidade diariamente: ela é um dos principais termômetros de qualidade de vendas móveis.'
        ]
    },
    {
        id: 'faq-10-visao360-necessidade-diaria',
        module: 'VISÃO 360',
        question: '10. Como usar as abas "Desempenho Diário" e "Necessidade Diária" na VISÃO 360?',
        answer: 'Dentro do perfil de desempenho na VISÃO 360, a aba "Desempenho Diário" mostra uma planilha dia a dia (do dia 01 ao último dia do mês) com tudo o que você vendeu em cada data. Já a aba "Necessidade Diária" calcula quanto falta para bater 100% de cada indicador e divide pelos dias restantes de trabalho no mês.',
        tips: [
            'Consulte sua "Necessidade Diária" todo início de turno para saber exatamente quantos Pós, Controles, Fibras e R$ de Receita você precisa entregar no dia.'
        ]
    },
    {
        id: 'faq-11-ur-acompanhamento',
        module: 'UR-RESIDENCIAL',
        question: '11. Como gerenciar agendamentos e status de instalação na seção UR-RESIDENCIAL?',
        answer: 'Toda venda residencial registrada na aba VENDA é espelhada automaticamente na seção UR-RESIDENCIAL. Nela você acompanha o Número do Contrato, Cidade, Data de Instalação agendada, Período (Manhã ou Tarde), Forma de Pagamento (DCC ou Boleto) e altera o Status entre PENDENTE, INSTALADO ou CANCELADO.',
        tips: [
            'Todo dia 20 de cada mês o sistema emite um alerta automático lembrando os consultores de revisarem suas instalações pendentes antes do fechamento.'
        ]
    },
    {
        id: 'faq-12-fator-rv',
        module: 'FATOR RV',
        question: '12. Como o simulador "FATOR RV" calcula minha comissão e premiação estimada?',
        answer: 'Na seção FATOR RV, o sistema cruza suas vendas realizadas no mês com a régua de comissionamento e atingimento de metas da loja. Ele projeta seu fator multiplicador, mostra quanto cada família de produtos está gerando de remuneração variável e simula quanto você ganhará ao atingir os próximos degraus de meta (80%, 100%, 120%+).',
        tips: [
            'Use o FATOR RV para identificar qual indicador destrava o próximo patamar de multiplicador da sua comissão no mês.'
        ]
    },
    {
        id: 'faq-13-proposta',
        module: 'PROPOSTA',
        question: '13. Como montar uma Proposta Comercial profissional para apresentar ao cliente?',
        answer: 'Na seção PROPOSTA, você monta rapidamente um comparativo visual elegante entre o cenário atual do cliente e o novo pacote proposto (Móvel, Fibra, TV, Aparelhos e SVA). O sistema soma os benefícios, destaca a economia no Combo Multi e gera um layout limpo pronto para impressão ou apresentação na tela.',
        tips: [
            'Apresentar a proposta visual na tela aumenta a percepção de transparência e facilita o fechamento de pacotes completos (Multi 3P).'
        ]
    },
    {
        id: 'faq-14-reprovados',
        module: 'REPROVADOS',
        question: '14. Quando e como registrar um cliente na seção REPROVADOS?',
        answer: 'Sempre que uma tentativa de venda ou portabilidade for negada por score, restrição interna, pendência técnica (sem viabilidade de Fibra/CTO cheia) ou política de crédito, registre na seção REPROVADOS informando o produto pretendido e o motivo da reprovação. Isso permite que a gestão mapeie perdas de salão e tente reanálise de mesa quando cabível.',
        tips: [
            'Clientes reprovados no Pós-Pago por score muitas vezes aprovam no Controle Fácil/Cartão ou em planos Pré-Pago com recarga programada!'
        ]
    },
    {
        id: 'faq-15-escala-trabalho',
        module: 'ESCALA DE TRABALHO',
        question: '15. Como funcionam os turnos, folgas e categorias especiais na Escala de Trabalho?',
        answer: 'A seção ESCALA DE TRABALHO exibe o quadro horário da equipe, escalas de domingos/feriados e status diários. Além dos turnos de Abertura, Intermediário e Fechamento, o sistema conta com as categorias oficiais: FOLGA BANCO, FOLGA PREMIO, ATESTADO(A), TREINAMENTO, INTERMEDIARIO, AFASTADO(A) e FÉRIAS.',
        tips: [
            'Atenção ao aviso oficial no topo da tela: a escala está sempre sujeita a alterações conforme necessidade operacional da loja.',
            'Colaboradores com período de Férias ativo na tabela de usuários têm o login pausado automaticamente durante os dias de descanso.'
        ]
    },
    {
        id: 'faq-16-parcial-fechamento',
        module: 'PARCIAL & FECHAMENTO',
        question: '16. Como funciona o disparo da Parcial & Fechamento para o grupo de WhatsApp?',
        answer: 'Na seção PARCIAL & FECHAMENTO, a liderança visualiza o consolidado da loja (LP) em tempo real: Meta Mensal, Realizado no Dia, Acumulado no Mês, Gap (desvio) e Projeção de Fechamento (%). Ao clicar no botão de compartilhamento, o sistema gera o texto padronizado pronto para colar ou enviar direto no WhatsApp da regional/equipe.',
        tips: [
            'O sistema dispara notificações sonoras/visuais automáticas às 14h, 16h e 18h para lembrar o gestor do envio da parcial.'
        ]
    },
    {
        id: 'faq-17-resultado-loja',
        module: 'RESULTADO',
        question: '17. O que é exibido na seção RESULTADO e como exportar apresentações?',
        answer: 'A seção RESULTADO consolida o macro-desempenho da unidade com gráficos executivos, evolução mês a mês, mix de produtos e comparativo Meta x Realizado de toda a loja. Ela também permite exportar relatórios executivos e apresentações em PowerPoint (.pptx) prontas para reuniões gerenciais.',
        tips: [
            'Utilize o seletor de mês no topo da tela para comparar a evolução da loja entre meses anteriores e o mês atual.'
        ]
    },
    {
        id: 'faq-18-gestao-metas-precos',
        module: 'GESTÃO',
        question: '18. Como configurar as Metas do Mês e a Tabela de Preços na seção GESTÃO?',
        answer: 'Exclusiva para Gerência e Liderança, a seção GESTÃO permite definir o espelho de metas da loja para cada mês (Receita, Pós-Pago, Controle, Fibra, TV, Aparelhos, Acessórios, Películas, Seguros, M-Play, Trocafy e Mesh) e atualizar a Tabela de Preços oficial dos planos Móveis e Residenciais.',
        tips: [
            'Assim que o Gerente salva uma nova Meta ou atualiza a Tabela de Preços, todos os vendedores logados recebem uma notificação automática no sininho do topo!'
        ]
    },
    {
        id: 'faq-19-campanhas-geek-scripts',
        module: 'CAMPANHAS, GEEK & SCRIPTS',
        question: '19. Para que servem as seções CAMPANHAS, GEEK e SCRIPTS no menu lateral?',
        answer: '• CAMPANHAS: Divulga incentivos vigentes, prêmios relâmpago e anuncia os vencedores com alerta de troféu (🏆).\n• GEEK: Repositório técnico de procedimentos, tutoriais de configuração de aparelhos, e-SIM, TV Box e soluções rápidas.\n• SCRIPTS: Modelos prontos de mensagens de WhatsApp para abordagem ativa, pós-venda, cobrança preventiva e confirmação de instalação.',
        tips: [
            'Sempre que houver uma bola vermelha piscando ao lado de CAMPANHAS ou GEEK no menu lateral, significa que há um comunicado novo que você ainda não leu!'
        ]
    },
    {
        id: 'faq-20-sistemas-acessos',
        module: 'SISTEMAS & ACESSOS',
        question: '20. Como usar o hub de SISTEMAS e quem pode gerenciar a aba ACESSOS?',
        answer: 'A seção SISTEMAS funciona como um portal rápido com links diretos para todas as plataformas oficiais utilizadas no balcão (Sistemas de ativação, portabilidade, consulta de viabilidade, Trocafy, Seguro, etc.). Já a aba ACESSOS é restrita exclusivamente ao cargo de GERENTE para criação de novos logins, redefinição de senhas, troca de cargos e agendamento de férias.',
        tips: [
            'Na aba ACESSOS, o Gerente pode alterar o cargo ou redefinir dados de qualquer colaborador da unidade com salvamento imediato no banco Oracle.'
        ]
    },
    {
        id: 'faq-21-perfil-sincronizacao',
        module: 'PERFIL & DADOS PESSOAIS',
        question: '21. Como atualizar minha Foto, Nome e Destaque na tela de PERFIL sem duplicar meu card?',
        answer: 'Ao passar o mouse sobre seu nome no canto superior direito e clicar em "Perfil", você abre sua tela individual executiva. Nela você pode adicionar, trocar ou remover sua Foto de Perfil (que aparece na bolha do topo e no seu card da Visão 360), atualizar seus dados pessoais e escolher seu Indicador de Destaque do Ano/Mês.',
        tips: [
            'Se você corrigir ou alterar seu Nome na tela de Perfil e clicar em "Salvar Perfil", o sistema atualiza automaticamente seu cadastro e migra todas as suas vendas no banco de dados para o novo nome — sem criar outro card duplicado na Visão 360!'
        ]
    },
    {
        id: 'faq-22-atalhos-armazenamento',
        module: 'GERAL, ATALHOS & ARMAZENAMENTO',
        question: '22. Como funcionam o Desfazer (Ctrl + Z), o Modo Escuro, o QR Code Wi-Fi e o Armazenamento?',
        answer: 'No cabeçalho superior você conta com: (1) Botão Desfazer / atalho Ctrl + Z para recuperar exclusões acidentais de vendas ou simcards; (2) Botão QR Code Wi-Fi para exibir na tela e o cliente conectar na rede da loja na hora; (3) Alternador de Tema Claro/Escuro; e no rodapé do menu lateral o indicador discreto "ARMAZENAMENTO: X.XX MB / 20 GB" monitorando a saúde do banco Oracle.',
        tips: [
            'Dê duplo clique sobre o título da seção no topo da página para recolher/expandir a barra lateral instantaneamente.',
            'O sistema é totalmente responsivo e calibrado para uso em celulares (incluindo linha Samsung S25, S25+ e S25 Ultra).'
        ]
    }
];

// ============================================================================
// LABORATÓRIO LÚDICO DE ARGUMENTAÇÕES DE VENDAS (IDEIAS & QUEBRA DE OBJEÇÕES)
// ============================================================================
const DEFAULT_ARGUMENTACOES = [
    {
        id: 'arg-pos-1',
        category: 'PÓS-PAGO & UPGRADE',
        title: 'O Efeito "Liberdade Total" (De Controle para Pós)',
        badge: 'Alta Conversão',
        trigger: 'Ancoragem de Valor & Custo por Giga',
        scenario: 'Cliente possui plano Controle e diz que "não precisa de mais internet, o plano atual já dá conta".',
        pitch: '“Perfeito! Mas deixa eu te mostrar uma conta rápida: hoje no seu Controle você paga quase o mesmo valor por Giga, porém com aplicativos limitados. Por uma diferença menor que um café por semana, no Pós você ganha o dobro de franquia livre, Passaporte para usar no exterior e acesso prioritário na rede 5G+ sem travar no fim do mês.”',
        objectionHandler: 'Quando o cliente diz "não uso tudo isso", mostre que o Pós não é só quantidade de GB, mas estabilidade de sinal, streaming incluso e desconto real na troca de aparelho.',
        goldenTip: 'Compare sempre a diferença diária (ex: "menos de R$ 0,80 por dia") em vez do valor cheio mensal!'
    },
    {
        id: 'arg-combo-1',
        category: 'COMBO MULTI (CONVERGÊNCIA)',
        title: 'A Matemática Invisível do Multi (Móvel + Fibra)',
        badge: 'Campeão de Ticket',
        trigger: 'Economia Inteligente & Unificação',
        scenario: 'Cliente veio apenas resolver uma demanda de chip móvel ou pagar fatura e usa internet de bairro/concorrente em casa.',
        pitch: '“Sabia que você já tem um benefício pré-aprovado aqui no sistema só por ser nosso cliente móvel? Unificando a internet da sua casa no Multi, a sua velocidade de Fibra dobra, o seu plano de celular ganha bônus de internet na hora e o desconto nas duas faturas praticamente paga o upgrade sozinho!”',
        objectionHandler: 'Se o cliente disser "minha internet lá de casa está fidelizada", verifique a multa proporcional ou mostre que a economia mensal no Multi absorve a diferença em poucos meses.',
        goldenTip: 'Nunca pergunte "você quer colocar Fibra?". Pergunte: "Qual operadora você usa no Wi-Fi de casa hoje e quanto está investindo lá?".'
    },
    {
        id: 'arg-port-1',
        category: 'PORTABILIDADE',
        title: 'Desmistificando a Portabilidade sem Ficar Sem Sinal',
        badge: 'Conquista de Base',
        trigger: 'Segurança & Zero Atrito',
        scenario: 'Cliente da concorrência reclama do sinal/preço, mas tem medo de fazer portabilidade e perder o número de trabalho ou ficar sem linha.',
        pitch: '“Você continua com o seu exato mesmo número, com todos os seus contatos e WhatsApp intactos! A transição acontece de madrugada em poucos minutos, você já sai daqui com o chip configurado e ainda recebe o bônus exclusivo de boas-vindas de Portabilidade que quem já é da base não tem.”',
        objectionHandler: 'Destaque o "Bônus de Portabilidade" como um privilégio exclusivo para quem traz o número de outra operadora naquele dia.',
        goldenTip: 'Faça o teste de velocidade 5G na frente do cliente na loja para criar impacto visual imediato!'
    },
    {
        id: 'arg-seguro-1',
        category: 'SEGURO & PROTEÇÃO MÓVEL',
        title: 'Blindagem do Patrimônio de Bolso',
        badge: 'Rentabilidade Extra',
        trigger: 'Aversão à Perda & Tranquilidade',
        scenario: 'Cliente acabou de comprar um smartphone novo ou possui um aparelho de alto valor, mas hesita em incluir o Seguro.',
        pitch: '“Hoje o celular não é só um telefone: é o seu banco, suas fotos, seu trabalho e um patrimônio de milhares de reais andando no seu bolso. Com a Proteção Móvel, por uma fração mínima na fatura, se acontecer roubo, furto qualificado ou quebra acidental, você não precisa desembolsar outro aparelho inteiro do zero.”',
        objectionHandler: 'Se o cliente disser "eu sou muito cuidadoso", responda com empatia: "Com certeza você cuida bem, o seguro não é para o seu descuido, é para o imprevisto na rua que não depende da gente!".',
        goldenTip: 'Lembre-se: Aparelho vendido com Seguro eleva sua comissão de 5% para 6% sobre o valor bruto do aparelho!'
    },
    {
        id: 'arg-ur-1',
        category: 'FIBRA & TV BOX (UR)',
        title: 'Cinema em Casa & Wi-Fi em Todos os Cômodos (Mesh + Box)',
        badge: 'Experiência Casa',
        trigger: 'Demonstração Sensorial & Conforto Familiar',
        scenario: 'Cliente quer apenas a internet básica ou diz que "não assiste mais TV a cabo, só usa streaming".',
        pitch: '“Exatamente por você amar streaming que o TV Box / App faz tanto sentido! Em vez de pagar 4 ou 5 assinaturas separadas no cartão de crédito, aqui você reúne canais ao vivo, filmes, séries e os principais streamings em um único controle remoto por comando de voz — e com o Wi-Fi Mesh o sinal chega forte até no quarto mais distante.”',
        objectionHandler: 'Mostre na ponta do lápis quanto custam os streamings avulsos somados versus o valor integrado no pacote residencial.',
        goldenTip: 'Sempre pergunte: "Tem algum cômodo na sua casa onde o Wi-Fi fica fraco hoje?" — essa pergunta abre a venda de MESH na hora!'
    },
    {
        id: 'arg-trocafy-1',
        category: 'DEVICES & TROCAFY',
        title: 'Seu Aparelho Atual Vale Dinheiro na Entrada',
        badge: 'Fechamento Rápido',
        trigger: 'Desconto Imediato & Upgrade Inteligente',
        scenario: 'Cliente olha a vitrine de smartphones, gosta de um modelo novo, mas acha o valor total alto.',
        pitch: '“Você não precisa pagar o valor cheio desse aparelho! O smartphone que está na sua mão agora mesmo entra como parte do pagamento pelo nosso programa de recompra. A avaliação leva 3 minutinhos aqui na mesa e já abate o valor na hora para você sair de celular novo hoje.”',
        objectionHandler: 'Mesmo aparelhos com pequenas marcas de uso podem ser avaliados rapidamente, reduzindo a parcela no cartão.',
        goldenTip: 'Convide o cliente para fazer a simulação sem compromisso: quando ele vê o desconto real na tela, a decisão de compra acelera!'
    }
];

const validateArgumentacao = (body = {}) => {
    const title = String(body.title || '').trim();
    const category = String(body.category || 'PÓS-PAGO & UPGRADE').trim().toUpperCase();
    const scenario = String(body.scenario || '').trim();
    const pitch = String(body.pitch || '').trim();
    const objectionHandler = String(body.objectionHandler || '').trim();
    const goldenTip = String(body.goldenTip || '').trim();
    const trigger = String(body.trigger || 'Persuasão Consultiva').trim();
    const badge = String(body.badge || 'Dica da Equipe').trim();

    if (!title || title.length < 4) {
        return { isValid: false, error: 'Informe um título claro para a argumentação (mín. 4 caracteres).' };
    }
    if (!pitch || pitch.length < 10) {
        return { isValid: false, error: 'Informe a frase/roteiro de argumentação (mín. 10 caracteres).' };
    }

    return {
        isValid: true,
        data: {
            id: `custom-arg-${Date.now()}`,
            category,
            title,
            badge,
            trigger,
            scenario: scenario || 'Situação geral de atendimento consultivo em loja.',
            pitch,
            objectionHandler: objectionHandler || 'Escute o ponto principal do cliente, valide a dúvida e apresente o custo-benefício diário.',
            goldenTip: goldenTip || 'Mantenha postura confiante, sorriso na voz e personalize o exemplo para a rotina do cliente.',
            isCustom: true,
            createdAt: new Date().toISOString()
        }
    };
};

// ============================================================================
// ROTAS DA PÁGINA DE AJUDA E ARGUMENTAÇÕES
// ============================================================================
router.get('/', async (req, res) => {
    const storeId = String(req.query.storeId || req.headers['x-store-id'] || 'shopping_raposo').trim();
    let customArguments = [];

    let conn;
    try {
        conn = await getOracleConnection();
        const cfgResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE ID = 'config' AND STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );
        if (cfgResult.rows && cfgResult.rows.length > 0 && cfgResult.rows[0].DOCUMENT_DATA) {
            const parsed = JSON.parse(cfgResult.rows[0].DOCUMENT_DATA);
            if (Array.isArray(parsed.customArguments)) {
                customArguments = parsed.customArguments;
            }
        }
    } catch (e) {
        console.error('Aviso ao buscar argumentações customizadas (help.js):', e.message);
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }

    res.json({
        success: true,
        systemOverview: {
            headline: 'Central Inteligente de Ajuda & Laboratório de Argumentações',
            subtitle: 'Entenda cada detalhe de como o WorkFlow funciona e domine as melhores técnicas de persuasão para fechar mais vendas todos os dias.'
        },
        faqs: SYSTEM_FAQ,
        argumentacoes: [...customArguments, ...DEFAULT_ARGUMENTACOES]
    });
});

router.post('/argumentacao', async (req, res) => {
    const storeId = String(req.body.storeId || req.headers['x-store-id'] || 'shopping_raposo').trim();
    const validation = validateArgumentacao(req.body);

    if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
    }

    let conn;
    try {
        conn = await getOracleConnection();
        const cfgResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE ID = 'config' AND STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );

        let configObj = {};
        if (cfgResult.rows && cfgResult.rows.length > 0 && cfgResult.rows[0].DOCUMENT_DATA) {
            try { configObj = JSON.parse(cfgResult.rows[0].DOCUMENT_DATA); } catch (e) {}
        }

        const existing = Array.isArray(configObj.customArguments) ? configObj.customArguments : [];
        configObj.customArguments = [validation.data, ...existing];

        const jsonStr = JSON.stringify(configObj);
        await conn.execute(
            `MERGE INTO CONFIGURACOES c
             USING (SELECT 'config' AS ID, :s AS STORE_ID FROM dual) src
             ON (c.ID = src.ID AND c.STORE_ID = src.STORE_ID)
             WHEN MATCHED THEN
               UPDATE SET c.DOCUMENT_DATA = :doc
             WHEN NOT MATCHED THEN
               INSERT (ID, STORE_ID, DOCUMENT_DATA) VALUES ('config', :s, :doc)`,
            { s: storeId, doc: jsonStr },
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: 'Nova argumentação adicionada com sucesso!',
            argumentacao: validation.data
        });
    } catch (err) {
        console.error('Erro ao salvar argumentação (help.js):', err);
        res.status(500).json({ error: 'Erro ao salvar a argumentação no banco de dados.' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }
});

router.delete('/argumentacao/:id', async (req, res) => {
    const storeId = String(req.query.storeId || req.headers['x-store-id'] || 'shopping_raposo').trim();
    const targetId = String(req.params.id || '').trim();

    let conn;
    try {
        conn = await getOracleConnection();
        const cfgResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE ID = 'config' AND STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );

        let configObj = {};
        if (cfgResult.rows && cfgResult.rows.length > 0 && cfgResult.rows[0].DOCUMENT_DATA) {
            try { configObj = JSON.parse(cfgResult.rows[0].DOCUMENT_DATA); } catch (e) {}
        }

        if (Array.isArray(configObj.customArguments)) {
            configObj.customArguments = configObj.customArguments.filter(a => a.id !== targetId);
            await conn.execute(
                `UPDATE CONFIGURACOES SET DOCUMENT_DATA = :doc WHERE ID = 'config' AND STORE_ID = :s`,
                { doc: JSON.stringify(configObj), s: storeId },
                { autoCommit: true }
            );
        }

        res.json({ success: true, message: 'Argumentação removida com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir argumentação (help.js):', err);
        res.status(500).json({ error: 'Erro ao excluir a argumentação.' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }
});

export default router;
