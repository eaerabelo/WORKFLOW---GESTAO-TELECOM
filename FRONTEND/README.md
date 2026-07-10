# 🖥️ Frontend SPA - Painel de Gestão de Vendas (React + Vite)

Este é o diretório da Single Page Application (SPA) do **Painel de Gestão de Vendas**, uma interface de usuário extremamente rica, moderna e interativa desenvolvida com **React.js**, **Vite** e **Tailwind CSS**. 

O frontend foi projetado para operar com **alta performance, sincronização em tempo real (WebSockets)** e responsividade total, servindo como uma central completa de visualização e controle operacional para lojas do setor de telecomunicações.

---

## 🚀 Diferenciais de Destaque no GitHub

Para fins de portfólio e demonstração de engenharia de software de alta qualidade, este frontend apresenta os seguintes conceitos avançados:

1. **State Management Otimizado (Smart Diffing):**
   A aplicação rastreia o estado local dos lançamentos, estoque e propostas contra o estado em nuvem. O salvamento automático (Auto-Save) na API Oracle ocorre em segundo plano a cada 1,5 segundos utilizando um algoritmo de **Smart Diff**, que envia via rede apenas as propriedades e registros modificados, reduzindo drasticamente o consumo de banda e processamento do servidor.
2. **Sincronização Bidirecional Real-Time (WebSockets):**
   Integrado com **Socket.io-client**, o painel recebe atualizações instantâneas disparadas por outras máquinas ligadas à mesma loja na rede. As planilhas, dashboards e rankings são redesenhados em milissegundos sem necessidade de dar F5 na página.
3. **Isolamento de Estado (Local-Only Navigation):**
   Toda a navegação, filtros locais por vendedores, abertura de modais e inputs em formulários são mantidos em estados totalmente isolados. As interações de um usuário no salão de vendas nunca causam desvios visuais ou interrupções no painel de outro vendedor.
4. **Resiliência e Monitoramento Offline:**
   O frontend monitora ativamente o status da conexão socket e do banco de dados relacional. Caso a internet oscile ou caia, um banner flutuante de alerta é exibido imediatamente no cabeçalho e as operações de gravação são bloqueadas para evitar perda de dados local.
5. **Layouts Flexíveis e Widescreen:**
   As tabelas e gráficos gerenciais do módulo `Resultado` suportam eventos de duplo clique (Double-Click) para recolher os menus laterais, permitindo uma visualização expandida ideal para monitores do salão de vendas.
6. **Autenticação RBAC e Timeout Inteligente:**
   Implementação de controle de acessos (Role-Based Access Control) diretamente no roteador de visualizações do React. Além disso, a sessão expira automaticamente após 30 minutos de inatividade do mouse ou teclado em cada terminal, garantindo conformidade com regras rígidas de segurança corporativa.
7. **Estética Visual Premium & Glassmorphism:**
   Desenvolvido sob o conceito de design moderno, utilizando um tema escuro dinâmico (Dark Mode) armazenado localmente no navegador, transições suaves de 500ms, gradientes harmoniosos, contrastes balanceados e micro-animações interativas nos botões e KPI cards.

---

## 🗂️ Arquitetura de Pastas e Arquivos (Frontend)

```text
FRONTEND/
├── public/                 # Arquivos estáticos e ativos públicos do navegador
│   ├── DESKTOP_PAGE.jpeg   # Mockup visual da tela desktop
│   ├── MOBILE_PAGE.jpg     # Mockup visual responsivo mobile
│   ├── QR_CODEWIFI.png     # QR Code padrão do Wi-Fi para clientes
│   └── logo_WF.png         # Logo principal da plataforma
├── src/
│   ├── assets/             # Imagens e vetores específicos
│   ├── components/         # Módulos e Componentes React (Telas)
│   │   ├── App.jsx             # Contêiner Principal: WebSocket, Auto-Save, Roteamento e Layout
│   │   ├── Login.jsx           # Autenticação de usuário e recuperação de senha via EmailJS
│   │   ├── Venda.jsx           # Painel de Lançamento de Vendas de Aparelhos/Serviços e Combos
│   │   ├── ControleSimcard.jsx # Planilha interativa estilo Excel para controle de estoque de Chips
│   │   ├── Resultado.jsx       # Tabela de fechamento diário, DRE e Run Rate mensal consolidado
│   │   ├── Meta.jsx            # Módulo gerencial para cadastrar e distribuir metas diárias
│   │   ├── ParcialFechamento.jsx# Gerador de relatórios textuais formatados para envio via WhatsApp
│   │   ├── FatorRvv.jsx        # Simulador dinâmico de remuneração variável e comissões da equipe
│   │   ├── Reprovados.jsx      # Histórico de propostas inviabilizadas com busca de CEP via ViaCEP
│   │   ├── UrResidencial.jsx   # Acompanhamento logístico e status de instalações de banda larga/TV
│   │   ├── Colaboradores.jsx   # Gráficos de barra individuais, Hall da Fama e Gamificação da equipe
│   │   ├── Geek.jsx            # Mural digital contendo regulamentos, PDFs e metas de campanhas
│   │   ├── Campanha.jsx        # Painel de incentivos e campanhas internas de vendas
│   │   ├── Scripts.jsx         # Mural de textos pré-formatados com assinatura de usuário dinâmica
│   │   ├── Precificacao.jsx    # Módulo de cadastro e tabela de preços de serviços/aparelhos
│   │   ├── Sistemas.jsx        # Mosaico de atalhos rápidos para sistemas de vendas
│   │   ├── Acessos.jsx         # Tela de controle de usuários (Cofre de Senhas)
│   │   ├── Proposta.jsx        # Simulador de combos residenciais e gerador de orçamentos (PNG)
│   │   └── ProgressBar.jsx     # Componente visual para barras de progresso circulares e horizontais
│   ├── context/
│   │   └── PricingContext.jsx  # Gerenciamento de estado de preços com cache na inicialização
│   ├── services/
│   │   ├── api.js              # Interceptores do Axios e chamadas diretas REST
│   │   └── acessosService.js   # Funções de integração de usuários e controle de segurança
│   ├── styles/
│   │   └── ...                 # Arquivos de estilo CSS vanilla complementares por tela
│   ├── utils/              # Funções utilitárias e constantes
│   │   ├── constants.js        # Constantes globais (vendedores, produtos padrão, layouts)
│   │   ├── masks.js            # Formatadores de strings (CPF, CNPJ, Telefone, Moeda R$, Datas)
│   │   ├── nameFormatter.js    # Lógica inteligente para encurtar nomes preservando a estrutura
│   │   ├── stores.js           # Lista estática de Lojas (PDVs) suportadas pelo painel
│   │   └── excelImporter.js    # Mapeador dinâmico para importação de vendas via planilha Excel
│   ├── index.css           # Variáveis CSS globais e injeção do Tailwind CSS
│   └── main.jsx            # Ponto de entrada da aplicação (Root React Mount)
├── .env.osasco             # Configurações de ambiente locais para a Loja Osasco
├── .env.lapa               # Configurações de ambiente locais para a Loja Lapa
├── .env.calcadao           # Configurações de ambiente locais para a Loja Calçadão
├── firebase.json           # Configuração de rotas de Hosting do Firebase
├── tailwind.config.js      # Customização do tema e utilidades do Tailwind CSS
└── vite.config.js          # Configurações do Vite (porta local, HMR, plugins)
```

---

## ⚙️ Funcionalidades Executadas Exclusivamente pelo Frontend

A engenharia deste frontend processa localmente diversas tarefas para aliviar o backend:

* **Gerador de Imagem de Orçamento (Proposta):**
  Utiliza a biblioteca `html2canvas` para transformar o formulário de simulação de proposta do cliente em uma imagem consolidada (PNG) pronta para compartilhamento, economizando tráfego de geração de PDF no servidor.
* **Smart Excel Importer:**
  Com o auxílio da biblioteca `xlsx`, o frontend lê planilhas `.xlsx` importadas pela gerência, mapeia as colunas dinamicamente (Smart Column Mapping) e converte os dados em JSON estruturado localmente antes de disparar o upload ao banco de dados.
* **Motor do Simulador de Combos:**
  O módulo de `Proposta` calcula de forma independente os valores dos planos base, descontos por quantidade de serviços agregados, economia anual projetada e gera o link direto formatado para acionar o WhatsApp do cliente com 1-clique.
* **Máscaras e Validações Reativas:**
  Entrada de dados controlada por expressões regulares (Regex) em tempo real, cobrindo CPF, CNPJ, telefones, formatação monetária padrão BRL e validação de idade mínima para novos cadastros (18 anos).
* **Assinatura Dinâmica de Mensagens:**
  O módulo `Scripts` renderiza textos padrões e injeta automaticamente o nome, cargo e contatos do vendedor conectado na assinatura, fornecendo um botão de cópia rápida utilizando a API de Clipboard do navegador.

---

## 🛠️ Instalação e Execução Local

Siga os passos abaixo para rodar esta interface localmente:

1. **Instalar Dependências:**
   ```bash
   cd FRONTEND
   npm install
   ```

2. **Configurar as Variáveis de Ambiente:**
   Crie ou edite o arquivo `.env.osasco` (ou a loja que preferir) contendo o endpoint do seu backend:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_STORE_ID=uniao_osasco
   ```

3. **Rodar em Modo de Desenvolvimento (Vite HMR):**
   ```bash
   npm run dev:osasco
   # ou npm run dev:lapa
   # ou npm run dev:calcadao
   ```
   *Abra o endereço exibido no terminal (geralmente `http://localhost:5173`) no seu navegador.*

4. **Gerar Build de Produção:**
   ```bash
   npm run build
   ```
   Os arquivos finais otimizados e minificados serão gerados na pasta `/dist/`.
