# Past and Future - Histórico e Roadmap do Painel Claro Workflow

Este documento serve como a nossa **Única Fonte de Verdade (Single Source of Truth)** para registrar tudo o que já foi feito no sistema, o que está sendo atualizado no momento, e quais são os próximos passos planejados. **Este arquivo é prioridade máxima** e deve ser incrementado a cada nova alteração realizada.

---

## 🛠️ Visão Geral da Arquitetura

- **Frontend:** Desenvolvido em React + Vite. Hospedado no Firebase Hosting (`https://workflow-sistema.web.app`).
- **Backend:** Node.js + Express. Hospedado em uma VM na Oracle Cloud (`137.131.172.16`) na porta 3000, exposto via túnel reverso/Nginx.
- **Banco de Dados:** Oracle Autonomous Database. A comunicação é feita usando o driver `oracledb` em Thin mode, autenticado com a carteira de segurança (`wallet_painelclaro`).

---

## 📂 Tabelas no Banco de Dados Oracle

1. **USUARIOS:** Armazena usuários, senhas (Bcrypt/Texto plano legado), perfis, e dados de férias.
2. **VENDAS:** Registro detalhado de vendas com dados brutos em JSON (`DOCUMENT_DATA`) e colunas de consulta direta:
   - `ID` (VARCHAR2)
   - `STORE_ID` (VARCHAR2)
   - `DOCUMENT_DATA` (CLOB - JSON)
   - `CREATED_AT` (TIMESTAMP)
   - `DATA_VENDA` (VARCHAR2) — *Adicionado em 08/07/2026*
   - `VENDEDOR` (VARCHAR2) — *Adicionado em 08/07/2026*
   - `PRODUTO` (VARCHAR2) — *Adicionado em 08/07/2026*
   - `RECEITA` (NUMBER) — *Adicionado em 08/07/2026*
3. **ESTOQUE:** Controle de simcards em estoque.
4. **REPROVADOS:** Histórico de propostas ou cadastros recusados/pendentes.
5. **GEEK_DOCS:** Documentos e manuais da seção Geek.
6. **CAMPANHAS:** Campanhas e regras de incentivo ativas.
7. **CONFIGURACOES:** Armazena metadados globais, metas (`goalsDB`), escalas (`scheduleData`), e precificação (`pricingData`).

---

## 📜 Histórico de Modificações (O que já foi feito)

### 2026-06-25 a 2026-07-06 (Migração e Autenticação)

- **Migração do Firebase para Oracle:** Substituição das chamadas do Firestore por endpoints REST conectados ao Oracle DB.
- **Remoção de Campo de Loja no Login:** Simplificação do login. O usuário digita apenas Usuário e Senha, e o backend busca automaticamente no banco de dados a qual loja aquele usuário está vinculado.
- **Criptografia Bcrypt:** Proteção de senhas com Bcrypt. Senhas em texto puro são migradas automaticamente para hash Bcrypt na primeira autenticação bem-sucedida de cada usuário.
- **Ajustes de Fluxo 2FA:** Adição de código de confirmação no cadastro de novos usuários.
- **Rebranding:** Atualização estética da plataforma, cores corporativas Claro (vermelho/cinza) e aplicação do novo logotipo do painel.

### 2026-07-07 (Correções de Conectividade e Deploy)

- **API Dinâmica no Frontend:** Ajuste em `FRONTEND/src/services/api.js` para usar `VITE_API_URL` em produção e apontar para `localhost:3000` em ambiente de desenvolvimento local.
- **Processos PM2 na Oracle:** Limpeza de portas ocupadas na VM e reinicialização completa do backend sob o gerenciamento do PM2.
- **Instalação de Dependências:** Instalação do TypeScript (preparação futura) e configuração inicial do ambiente.

### 2026-07-08 (Hoje)

- **Correção no Envio do Zip do Backend:** Correção de bug no empacotamento onde a rota de colaboradores (`colaboradoresRoutes.js`) não estava sendo copiada para a VM. Backend atualizado e estabilizado.
- **Ajustes nos Toasts de Alerta:**
  - Removido o alerta nativo `"ALERTA CRÍTICO: Falha ao chamar a API!..."` em `api.js` por ser muito técnico, substituindo-o por tratamento silencioso e exibição amigável via Toast.
  - Modificada a posição do `<Toaster>` para `top-center` com deslocamento de `top: 80` (próximo à barra de pesquisa no topo central) em vez de `top-right`.
  - Removida a notificação de depuração `"Tentando enviar: User..."` no cadastro.
- **Resolução de Nome de Loja Dinâmico:** Atualização em `FRONTEND/src/utils/stores.js` criando a constante `STORES` e a função `getCurrentStore()`, eliminando o fallback fixo de `"LOJA CLARO"` e exibindo corretamente o nome e código reais (ex: `UNIÃO OSASCO - AT1M`) baseados no `storeId` do usuário logado.
- **Máscaras e Limitação nos Nomes dos Vendedores:**
  - Criado o utilitário `nameFormatter.js`.
  - Exibição de **Nome e Sobrenome** (Primeiro e Último) nas seções: **Proposta**, **Scripts** e **Fator RV**.
  - Exibição de **Somente o Primeiro Nome** nas seções: **Venda**, **Controle-Simcard**, **UR Residencial**, **Reprovados**, **Acessos** e **Escala de Trabalho**.
- **Correção de ReferenceError no Lançamento de Vendas:** Importação e desestruturação corretas de `pricingData` e `PRICING_MOVEL` obtidos a partir de `usePricing()` dentro do componente `Venda.jsx`.
- **Correção da Persistência de Vendas (Sync Oracle):**
  - Identificada falha de sincronização automática onde as vendas sumiam ao atualizar a página, causada pelo erro `ORA-00904: "DATA_VENDA": invalid identifier` no Oracle DB (as colunas estruturadas para o MERGE não existiam fisicamente na tabela).
  - Executado script SQL `alter_vendas.js` na Oracle Cloud adicionando as colunas `DATA_VENDA`, `VENDEDOR`, `PRODUTO` e `RECEITA` à tabela `VENDAS`.
  - Sistema de Auto-Save agora funcionando com persistência 100% garantida.
- **Resolução de Duplicidade de Vendedores no Dashboard de Colaboradores:**
  - Corrigido o bug onde o salvamento com primeiro nome criava um perfil duplicado (ex: "FULANO" e "FULANO SILVA") na aba de desempenho.
  - Revertidos os mapeamentos internos para manter o nome completo (`vendedor` do banco de dados) como valor real (chave/value) de referência em `Venda.jsx`, `ControleSimcard.jsx`, `UrResidencial.jsx` e `EscalaTrabalho.jsx`.
  - A formatação de **exibir apenas o primeiro nome** foi delegada exclusivamente para o nível de renderização JSX visual do Frontend, alinhando perfeitamente os dados e evitando perfis duplicados.
- **Carregamento Instantâneo de Vendas e Reprovados (Remoção Total de Restrições Mensais):**
  - Removido o filtro de datas das requisições do banco de dados na inicialização do app (`App.jsx`).
  - O seletor global de calendário foi **ocultado visivelmente** do cabeçalho da página em `App.jsx`.
  - Removidas as restrições mensais de exibição locais dos componentes de listagem/tabelas (`Venda.jsx`, `Reprovados.jsx` e `UrResidencial.jsx`). Agora estes componentes listam e permitem a busca de todos os dados históricos de uma única vez instantaneamente na memória.
  - Habilitados e preservados seletores locais apenas nos painéis específicos que necessitam estritamente de contextos mensais consolidados (como `Resultado.jsx` e `Colaboradores.jsx`), garantindo que possam alternar meses no próprio componente sem travar nem recarregar a rede.

### 2026-07-09 (Hoje)

- **Ajuste na Importação de Regras do Fator RV no Backend:**
  - Corrigido o caminho de importação das regras de negócio Claro no controlador `fatorRvController.js`, que estava buscando o arquivo `rules.js` na raiz da pasta `src/` em vez da pasta `src/utils/`.
  - A alteração reestabeleceu o funcionamento correto do cálculo do Fator RV no servidor remoto da Oracle Cloud.

---

## 📌 Status Atual e Próximos Passos (Futuro)

### 📋 Em Progresso

- [x] Correção de bugs visuais de nomes e alertas.
- [x] Persistência total de vendas no banco de dados Oracle.
- [ ] Monitoramento contínuo de logs de erro na VM para garantir estabilidade.

### 🔮 Futuro Planejado (Próximas Sprints)

1. **Migração completa para TypeScript (TS):** Adaptar arquivos `.js` e `.jsx` para `.ts` e `.tsx` para maior segurança e facilidade de manutenção de tipos.
2. **Adaptações Mobile com React Native:** Planejamento e modelagem da aplicação móvel para ser consumida pelos vendedores na rua e salão de vendas.
3. **Segurança Avançada:** Implementação de expiração de token JWT mais rigorosa, auditoria de acessos e ocultação de chaves sensíveis.
4. **Descomissionamento de arquivos antigos:** Limpeza de arquivos residuais e códigos órfãos que restaram da arquitetura legada baseada no Firebase.
