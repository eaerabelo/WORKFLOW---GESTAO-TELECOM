export const getLatestUpdate = async (req, res) => {
    try {
        const SYSTEM_UPDATES = {
            version: 'v2.4.0',
            title: 'NOVAS ATUALIZAÇÕES DO PAINEL',
            subtitle: 'Confira as últimas melhorias implementadas no painel para facilitar sua rotina.',
            features: [
                {
                    icon: 'Lock',
                    color: 'text-purple-500',
                    title: 'Mais Segurança no Cadastro (2FA)',
                    desc: 'Protegemos o WorkFlow! Agora, toda vez que uma nova conta for solicitada, será exigido um PIN de acesso de 4 dígitos enviado ao e-mail corporativo para confirmar a identidade antes de liberar o Login.',
                    roles: ['ALL']
                },
                {
                    icon: 'Calculator',
                    color: 'text-[#E3000F]',
                    title: 'Novo Motor de Comissionamento Inteligente',
                    desc: 'A tela de Fator RV foi revolucionada! Agora o sistema calcula comissões de forma cirúrgica para cada cargo (Gestor, Sênior, Geek, Admin, Assistente de Relacionamento). Planos e Aparelhos possuem pesos diferentes, e Gestores puxam a comissão com base na Receita da Loja.',
                    roles: ['ALL']
                },
                {
                    icon: 'BookOpen',
                    color: 'text-blue-500',
                    title: 'Transparência nas Regras (Seu Cargo)',
                    desc: 'Na aba Fator RV, adicionamos um novo bloco chamado "Regras de Comissionamento" que se adapta magicamente ao seu perfil. Lá você encontra mastigado quais são seus pisos, tetos, travas de qualidade (NPS) e os percentuais que você ganha em cada cenário!',
                    roles: ['ALL']
                },
                {
                    icon: 'Sparkles',
                    color: 'text-yellow-500',
                    title: 'Automação na Tabela de Simcard',
                    desc: 'A aba "FALTAS" foi renomeada para "ACOMPANHAR". E tem mais: ao pintar um Simcard de Amarelo ou Vermelho na tabela principal, o sistema agora move a linha automaticamente para a tabela ACOMPANHAR, limpando a visão dos vendedores instantaneamente!',
                    roles: ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK']
                },
                {
                    icon: 'Users',
                    color: 'text-green-500',
                    title: 'Contagem de Vendedores (Desempenho)',
                    desc: 'Na aba de Desempenho da Equipe, adicionamos uma insígnia vermelha no topo informando exatamente qual o tamanho da força de vendas (quantidade de vendedores) atuando naquele mês específico.',
                    roles: ['ALL']
                }
            ]
        };

        res.status(200).json(SYSTEM_UPDATES);
    } catch (error) {
        console.error('Erro ao buscar atualizações:', error);
        res.status(500).json({ error: 'Erro interno ao buscar atualizações.' });
    }
};
