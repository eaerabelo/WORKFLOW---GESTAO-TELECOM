# 📝 Comentários sobre o Projeto (Painel Gestão de Vendas)

Este documento tem como objetivo apresentar as decisões técnicas tomadas durante o desenvolvimento da aplicação, bibliotecas utilizadas e possíveis evoluções.

---

## 🏗️ Explicação rápida da decisão da arquitetura utilizada e o porquê
A aplicação foi projetada utilizando uma arquitetura **Client-Server Serverless-ready**. Destaque especial para a evolução de um modelo tradicional de "banco direto no front" para a construção de uma **API RESTful completa**, que criamos sob medida para este projeto:

- **Frontend (SPA com React + Vite):** Escolhido pela reatividade instantânea, reaproveitamento de componentes e pela extrema velocidade de build (HMR do Vite). Como a aplicação possui muita manipulação de estado na mesma tela (Tabelas, Filtros, Modal), o React garante atualizações no DOM virtual sem recarregamentos desnecessários.
- **Construção de API RESTful Própria (Node.js + Express):** Desenvolvemos **do zero** uma API REST customizada para atuar como "middleware" entre o sistema e o banco. O Frontend consome nossas próprias rotas controladas (ex: `GET /api/vendas`, `POST /api/simcards/sync`).
- **Banco de Dados Relacional em Nuvem:** Migração completa de NoSQL (Firebase) para um banco de dados relacional. Isso garantiu zero gargalos de performance e eliminou os custos de limite de cotas. Utiliza colunas flexíveis com constraint JSON para absorver alterações estruturais livremente.
- **Servidor Compute VM:** Hospedagem permanente (Always Free) rodando Ubuntu Linux e Node.js via PM2. Eliminou travamentos e tempo de hibernação presentes em hospedagens gratuitas.
- **Tempo Real (Socket.io):** Adotado para propagar eventos e sincronizar as máquinas da loja em tempo real. Em um cenário de múltiplos vendedores, garante que estoques e comissões não sofram concorrência.
- **Smart Diff com Batching:** Uma inteligência criada para comparar as alterações locais em tela e enviá-las (`upserts` e `deletes`) para a nossa API REST apenas quando o usuário para de digitar (Debounce), economizando drasticamente o tráfego de rede.

---

## 📚 Lista de bibliotecas de terceiros utilizadas

**Frontend:**
- `react` / `react-dom` - Core da UI.
- `lucide-react` - Pacote de ícones minimalistas e modernos.
- `react-hot-toast` - Notificações (Toasts) acessíveis e elegantes.
- `xlsx` - Manipulação, importação e exportação de planilhas nativas do Excel.
- **MailerSend API** - Envio de e-mails OTP transacionais server-side seguro via nosso backend (Cadastro e Login com trava anti-spam).
- `socket.io-client` - Túnel bidirecional de web sockets.
- `tailwindcss` - Framework CSS utility-first que acelerou massivamente a estilização e responsividade (Dark Mode incluso).

**Backend:**
- `express` - Servidor web rápido e minimalista.
- `socket.io` - WebSockets para a comunicação real-time.
- `oracledb` - SDK oficial (Thin-mode) para integração de alta performance com a nuvem.
- `pm2` - Gerenciador de processos em produção no servidor Ubuntu.

---

## 🚀 O que você melhoraria se tivesse mais tempo
- **Testes Automatizados:** Implementaria testes unitários com Jest ou Vitest (focando principalmente no `rules.js` de comissões) e testes E2E com Cypress para cobrir fluxos críticos (Login, Venda, Reprovados).
- **Tipagem Forte:** Migraria gradualmente a base de código do JavaScript puro para **TypeScript**, visando aumentar a segurança durante a passagem de props complexos (ex: dados do vendedor e arrays da venda).
- **Virtualização de Listas:** Caso o volume de dados ultrapasse a casa de milhares no Frontend, aplicaria ferramentas como `react-window` para renderizar apenas os elementos visíveis das tabelas na tela.
- **State Management Centralizado:** Extrairia as lógicas de propagação manual via props para uma Store global usando Zustand ou Redux, limpando o componente `App.jsx`.

---

## ❌ Quais requisitos obrigatórios não foram entregues e o porquê
Nenhum requisito obrigatório foi deixado para trás. A aplicação cumpre com todos os requisitos estipulados de negócio: Controle de acessos (RBAC), operações completas de CRUD (Vendas, Estoque, Escala), integração externa (ViaCEP) e persistência escalável/Real-time.

---

## 💡 Features e Atualizações Recomendadas para o Negócio (Próximos Passos)
Pensando na evolução do produto como uma ferramenta estratégica para a companhia, recomendo as seguintes atualizações futuras:

- **Integração via RPA/APIs (Zero Double Entry):** Automatizar o espelhamento de dados com os sistemas oficiais da Operadora. Isso eliminaria o trabalho manual do vendedor (lançamento duplo) e validaria ativações e receitas instantaneamente.
- **Módulo de CRM Ativo (Pós-Venda):** Criar um motor de eventos que notifique o vendedor para entrar em contato com clientes que registraram combos há 11 meses. Isso automatizaria a retenção e o Upsell antes do fim da fidelidade.
- **Inteligência Artificial Preditiva:** Analisar o histórico massivo do painel de `Resultados` para prever os dias e horários de picos de movimento na loja. Isso revolucionaria o módulo de `Escala de Trabalho` (alocando a equipe nos turnos precisos) e evitaria ruptura de estoque de SIM Cards e aparelhos.
- **Auditoria de Caixa Automatizada:** Integração do sistema com APIs de gateways de pagamento (Maquininhas/PIX) para realizar a conciliação bancária, cruzando os pagamentos físicos reais com o que foi lançado no campo "Receita" na aba de Vendas.
- **Gamificação Financeira (WF Coins):** Evoluir o módulo de `Campanhas` para um sistema de carteira virtual. Bater metas passaria a gerar pontos acumulativos, que os vendedores poderiam trocar por benefícios como folgas, folgas aos sábados ou prêmios reais através de uma "Loja" dentro do painel.
- **Autenticação JWT (JSON Web Token):** Substituir o gerenciamento de sessão atual (baseado puramente no Front-end) por um sistema robusto de autenticação em que a nossa API Node.js gera e valida Tokens JWT. Isso blindaria completamente as rotas do Backend e permitiria revogação e controle rígido do tempo de vida das sessões.

---

🔗 **Link do Repositório:** [https://github.com/eaerabelo/WORKFLOW---GESTAO-TELECOM.git]