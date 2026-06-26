# Manual do Sistema - Painel Gestão Claro

Bem-vindo ao repositório oficial do **Painel de Gestão Claro**. 
Este sistema foi desenvolvido como uma Single Page Application (SPA) **Multi-Tenant**, projetado para revolucionar o acompanhamento de vendas, metas, escalas e auditorias de estoque em **múltiplas lojas e operações comerciais simultâneas**.

---

## 🚀 Tecnologias Utilizadas
- **Linguagem:** JavaScript (ES6+) / JSX
- **Backend:** Node.js (Express) com Cache de RAM + Socket.io (Tempo Real)
- **Framework/Biblioteca:** React.js
- **Bundler:** Vite (Extrema velocidade em HMR)
- **Estilização:** Tailwind CSS (Utility-first framework)
- **Ícones:** Lucide React
- **Inteligência Artificial:** API Google Gemini (Generative AI) nativa
- **Exportações:** XLSX (Excel) e Imagens via HTML2Canvas
- **Persistência de Dados:** Oracle Cloud Autonomous Database (Banco de Dados SQL de alta performance em Nuvem)
- **Multi-Tenant:** Isolamento completo de dados por loja guiado por variáveis de ambiente.

---

## 📌 Módulos do Sistema

A plataforma é dividida em módulos estratégicos baseados no Controle de Acesso Baseado em Função (RBAC - Gestor, Sênior/Equivalentes e Vendedor).

### 1. Vendas
O coração da operação. Permite o lançamento de vendas de aparelhos, acessórios, planos móveis e banda larga.
- *Diferenciais:* Auto-preenchimento restrito ao **Primeiro Nome** do Vendedor, cálculo dinâmico de comissionamento e bloqueio de preços para combinações padrão. Nova funcionalidade de **Venda Múltipla (Combo)** agindo como um carrinho inteligente para registrar vários serviços ao mesmo tempo, além de desmembrar automaticamente o Seguro de Aparelhos.
- *Recurso Adicional:* Ocultação inteligente de campos irrelevantes baseado no produto. Exportação/importação inteligente de planilhas Excel (Restrito à Gerência).

### 2. Resultado (Visão Global)
Acompanhamento macro da loja. Uma tabela gerencial que cruza todas as vendas por data e classifica em categorias complexas (Gross Dia, Migrações, Portabilidades). Permite o espelho instantâneo e a exportação do DRE em formato Excel. Conta com agrupamentos unificados para Pós-Pago Total e exibe volumes de aparelhos/acessórios fiéis ao estoque físico.

### 3. Colaboradores (Dashboards Individuais)
Mostra relatórios automáticos (Meta vs Realizado) da produção diária e mensal de cada vendedor em tempo real. Esta aba retém a visualização do **Nome Completo** para fins gerenciais.
- *Diferenciais:* Sistema nativo de Gamificação (**Hall da Fama**) que avalia e premia visivelmente o Top 1 em Receita e o Destaque em vendas Pós-Pago para engajamento da equipe, incluindo visão panorâmica de UR Total.

### 4. Metas
Módulo exclusivo da gerência para distribuir os alvos financeiros e quantitativos de Ativações Pós, Aparelhos, Controle e UR-Residencial, gerando o espelho que alimenta todo o painel.

### 5. Escala de Trabalho
Gerenciamento duplo (Semanal Fixo x Calendário Dinâmico) de horários, exibindo todos os usuários do sistema apenas pelo **Primeiro Nome** para visualização otimizada.
- *Diferenciais:* Cores de alerta para marcações de exceção como FALTA, ATESTADO, FÉRIAS, FERIADO e FOLGA. Dispõe de atalhos rápidos na edição como "Apagar Horário" ou "Voltar ao Padrão".

### 6. Controle Simcard (Estoque)
Gestão rigorosa de liberação de chips físicos e E-SIM, com amarração de autorização, dados de cliente, e regras rígidas contra exclusões não autorizadas (Modal de Cofre Master).
- *Diferenciais:* Inclusão "Em Lote" simultânea para simplificar o recebimento de inventários. Foco automático na aba do Vendedor quando ele acessa a tela, removendo atritos.

### 7. Fator RV (Simulador de Remuneração Variável)
Painel atuando como simulador das regras financeiras oficiais do IW para o vendedor. Calcula a elegibilidade tríplice (80% em Receita, Gross e Residencial) e as comissões por faixas.
- *Diferenciais:* Motor avançado (`rules.js`) que processa matematicamente regras como: Fatores Claro Multi (1.2x a 1.8x) atrelado diretamente à anexação do **M-Play**, Portabilidade (+30%), Upgrades e Bônus Acima da Meta (Etapa 3). Traz **Dicas de Foco** dinâmicas, alertas visuais informando ser uma simulação, e isola a representatividade financeira real de Aparelhos e Seguros.

### 8. UR-Residencial, Reprovados & Propostas
- **Residencial:** Acompanhamento logístico refinado com filtro exclusivo por Vendedores (Vendedores têm visão restrita apenas aos próprios contratos), formatação nativa de datas (BR) e máscara de edição para documentos (CPF/CNPJ).
- **Reprovados:** Lida com vendas perdidas (viabilidade de CEP ou crédito) utilizando uma API Externa (`ViaCEP`).
- **Propostas e Comparador IA:** Simulador de ofertas e comparativo visual (Lado a Lado) com cálculo de abatimento em combos. Traz integração com a **Inteligência Artificial Gemini** atuando como Consultor (Upsell). Integrado nativamente com botão de geração de orçamentos em formato **Imagem (PNG)** e atalho Flutuante pro **WhatsApp**.

### 9. Scripts (Textos Padrões)
Módulo de produtividade contendo textos padronizados e pré-montados para facilitar o registro de observações e solicitações em sistemas da Claro.
- *Diferenciais:* Assinatura dinâmica que preenche automaticamente o nome e cargo do usuário logado (ex: "MATHEUS RABELO / GERENTE"), botão de cópia rápida (1-click) para a área de transferência.

---

## 🛡️ Usabilidade, Concorrência e Monitoramento (Multi-usuários)
O sistema foi arquitetado para suportar múltiplos computadores operando simultaneamente no salão de vendas, garantindo uma experiência fluida e sem conflitos:
- **Monitoramento de Conexão em Tempo Real:** Uma camada de segurança (Tela Vermelha de Bloqueio) intercepta imediatamente qualquer queda de internet ou do banco Oracle, impedindo que os usuários façam vendas "no escuro". O painel retoma sozinho assim que a rede voltar.
- **Tamanho do Banco (Oracle DB):** O menu lateral exibe em tempo real o peso em MBs das tabelas do servidor Oracle para garantir transparência.
- **Isolamento Visual (Local State):** A navegação entre abas, preenchimento de formulários e abertura de modais ocorrem na memória local. A tela de um usuário nunca sofre interferência ou troca inesperada pelas ações de outro.
- **Collapse Dinâmico:** Seções recebem eventos de duplo clique (Double-Click) que recolhem filtros, proporcionando experiência Widescreen focada em dados.
- **Notificações Globais:** Um "Sininho" de lembretes no topo da interface alerta os vendedores caso o Gestor altere as metas do mês atual, e notifica o gestor sobre os prazos fixos para envio da Parcial.
- **Tolerância a Falhas (WSoD Proof):** Programação defensiva avançada com `Error Boundary` e checagens rígidas de tipo (Type-Safety), garantindo que bancos de dados mal preenchidos ou "sujos" não consigam derrubar o React.
- **Sincronização Real-Time:** Apenas os dados confirmados (salvar, editar, excluir) são transmitidos via rede, atualizando as tabelas e o estoque da loja inteira em milissegundos sem a necessidade de recarregar a página (F5).
- **Timeout Inteligente:** A regra de expiração de sessão por inatividade (30 minutos) monitora o mouse e o teclado de *cada* máquina de forma completamente isolada.
- **Anti-Conflito:** Janelas flutuantes e modais de edição em uso são protegidos contra fechamentos abruptos caso os dados de fundo sejam alterados por terceiros.
- **Modo Noturno (Dark Mode):** Alternância com transição suave (500ms) de tema claro/escuro via ícones Sun/Moon, armazenada na máquina local, com contraste rigoroso de tabelas e leitura limpa das listagens.
- **Acesso Rápido Wi-Fi:** Modal centralizado exibindo o QR Code da rede Wi-Fi da loja, disponível a qualquer momento no cabeçalho do painel para facilitar a conexão dos clientes na loja.
- **Custom Scrollbar UI:** Barras de rolagem horizontais (vermelho Claro) mais táteis para facilitar o scroll em monitores touch, além de verticais refinadas (4px).

---

## ⚙️ Regras de Negócio Oficiais
Todas as regras, lógicas de bloqueio, cálculos de receita e travas sistêmicas estão minuciosamente documentadas no arquivo interno: `RegrasdeNegocio.md`. **Leitura obrigatória** antes de implementar novas Features.

---

## 💻 Como Rodar o Sistema Localmente

O projeto agora requer a execução simultânea do Backend (Node.js) e do Frontend (React).

**1. Iniciar o Backend:**
Navegue até a pasta do backend:
```bash
cd BACKEND
npm install
npm run dev
```
*O backend será inicializado, conectará ao Oracle Cloud SQL e ouvirá na porta padrão.*

**2. Iniciar o Frontend (Multi-Tenant):**
Abra um novo terminal e navegue para a pasta frontend:
   ```bash
cd FRONTEND
   npm install
   # Execute a loja desejada através dos scripts dedicados:
   npm run dev:osasco
   # ou npm run dev:lapa
   # ou npm run dev:calcadao
   ```
O painel estará disponível no seu navegador apontando dinamicamente para o backend.

### Construir para Produção (Build)
Para gerar os artefatos otimizados, execute:
```bash
npm run build
```
Os arquivos consolidados ficarão dentro da pasta `/dist/`, prontos para serem hospedados (ex: Vercel, Netlify, AWS S3).

---

## 🗄️ Estrutura de Armazenamento
O sistema utiliza o **Oracle Cloud Autonomous Database** na nuvem com uma arquitetura robusta de schema flexível (colunas CLOB para JSON). As alterações são propagadas em Real-Time usando listeners e rotas do Node, gravadas de forma otimizada via **Smart Diff** e **Batch Writes**, sendo sincronizadas instantaneamente em todas as telas da loja para que nenhum colaborador trabalhe com informações desatualizadas.

---

## 🗂️ Arquitetura de Pastas e Arquivos

Abaixo está a árvore completa da arquitetura do projeto, separada por responsabilidade (Client e Server).

### Frontend (React + Vite)
```text
FRONTEND/
├── public/                 # Arquivos estáticos (favicon, manifest)
├── src/
│   ├── assets/             # Imagens, logos e ícones locais
│   ├── components/         # Módulos principais (Telas do sistema)
│   │   ├── App.jsx             # Contêiner Mestre (Roteamento, WebSocket, Layout, Smart Diff)
│   │   ├── Login.jsx           # Autenticação e redefinição de senha via EmailJS
│   │   ├── Venda.jsx           # Formulário de lançamento de Vendas e Combos
│   │   ├── ControleSimcard.jsx # Planilha Excel-like para gestão de estoque
│   │   ├── Resultado.jsx       # Dashboard consolidado da loja e run rate
│   │   ├── Meta.jsx            # Definição e Histórico de Metas
│   │   ├── ParcialFechamento.jsx# Relatórios automáticos para WhatsApp
│   │   ├── FatorRvv.jsx        # Simulador de contracheque e dicas gamificadas
│   │   ├── Reprovados.jsx      # Histórico de Inviabilidades Técnicas/Crédito
│   │   ├── UrResidencial.jsx   # Gestão de Instalações e Status UR
│   │   ├── Colaboradores.jsx   # Desempenho individual e Ranking da equipe
│   │   ├── Geek.jsx            # Mural de Informações e PDFs (Módulo Geek)
│   │   ├── Campanha.jsx        # Gestão de Prêmios e Incentivos
│   │   ├── Scripts.jsx         # Textos padrões para cópia rápida
│   │   ├── Precificacao.jsx    # Gestão de preços
│   │   ├── SistemasClaro.jsx   # Links rápidos
│   │   ├── Acessos.jsx         # Cofre de acessos e permissões (Master Key)
│   │   ├── Proposta.jsx        # Simulador de Orçamentos e Comparador
│   │   └── ProgressBar.jsx     # Componente visual genérico
│   ├── utils/              # Funções auxiliares
│   │   ├── constants.js        # Constantes (Metas, Preços Iniciais, Produtos)
│   │   ├── masks.js            # Máscaras de CPF, CNPJ, Moeda, Data
│   │   └── excelImporter.js    # Lógica de importação inteligente (Smart Mapper)
│   ├── index.css           # Configurações do Tailwind e Estilos Globais
│   └── main.jsx            # Ponto de inicialização do React
├── .env.osasco             # Variáveis de ambiente da Loja Osasco
├── .env.lapa               # Variáveis de ambiente da Loja Lapa
├── .env.calcadao           # Variáveis de ambiente da Loja Calçadão
├── package.json            # Dependências e scripts de execução
├── tailwind.config.js      # Configurações de design do TailwindCSS
└── vite.config.js          # Configuração do empacotador (Build/Dev Server)
```

### Backend (Node.js + Express)
```text
BACKEND/
├── src/
│   ├── server.js           # Ponto de inicialização (Middlewares, Rotas e API)
│   ├── socket.js           # Configuração de eventos do WebSocket (Tempo Real)
│   ├── db_oracle.js        # Pool de conexão com o Autonomous Database Oracle
│   ├── routes/             # Rotas segmentadas da API
│   │   ├── vendas.js       # Endpoints: GET /vendas, POST /vendas/sync
│   │   ├── simcards.js     # Endpoints de leitura e diff de estoque
│   │   └── ...             # Demais rotas (config, reprovados, etc)
│   └── controllers/        # Inteligência de negócio e processamentos em lote
├── .env                    # Chaves de API (Gemini), Senha Oracle (Oculto)
└── package.json            # Dependências do servidor (express, socket.io, oracledb)
```
