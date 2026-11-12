export const getLatestUpdate = async (req, res) => {
    try {
        const SYSTEM_UPDATES = {
            version: 'v2.5.0',
            title: 'NOVAS ATUALIZAÇÕES DO WORKFLOW',
            subtitle: 'Confira as últimas melhorias implementadas no painel, na tela de entrada e nos relatórios.',
            features: [
                {
                    icon: 'Lock',
                    color: 'text-[#E3000F]',
                    title: 'Segurança Reforçada na Tela de Entrada & 2FA',
                    desc: 'A tela de login, cadastro e recuperação de senha foi 100% estabilizada! Agora o código OTP de 4 dígitos via e-mail corporativo funciona com alta disponibilidade, validação de titularidade do colaborador e criptografia avançada Bcrypt.',
                    roles: ['ALL']
                },
                {
                    icon: 'LineChart',
                    color: 'text-blue-500',
                    title: 'Dashboard Loja Executivo & Gap de Meta',
                    desc: 'Nova visão executiva estilo Power BI na aba [Resultado]! Acompanhe o Termômetro do Mês, Run Rate, análise exclusiva de Gap de Meta deixada do dia anterior, comparativo dia a dia no que a loja melhorou e gráfico diário de evolução.',
                    roles: ['ALL']
                },
                {
                    icon: 'Rocket',
                    color: 'text-purple-500',
                    title: 'Portabilidade Segregada: Port-In Pós vs Controle',
                    desc: 'O painel de Resultado agora detalha a diferença exata de Portabilidade entre Port-In Pós e Port-In Controle, além das métricas dedicadas de M-Play Pós e M-Play Controle.',
                    roles: ['ALL']
                },
                {
                    icon: 'Target',
                    color: 'text-emerald-500',
                    title: 'Anexação & Rentabilidade: Receita Bruta e Normal',
                    desc: 'Métricas de anexação aprofundadas por aparelho vendido (1:1 Película, 3:1 Acessórios, 1:1 Seguro, 1:1 Trocafy e Claro UP/Upgrades), com acompanhamento de Receita Bruta e Normal de aparelhos e acessórios.',
                    roles: ['ALL']
                },
                {
                    icon: 'Users',
                    color: 'text-amber-500',
                    title: 'Novos Módulos: Perfil Individual & Central de Ajuda',
                    desc: 'Menu superior com pré-visualização de usuário e telas dedicadas: [Perfil] com busca automática de CEP, uniformes e Selo de Destaque automático; e [Ajuda] com 22 manuais passo a passo e scripts de argumentação de vendas.',
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
