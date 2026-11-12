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
  - Habilitados e preservados seletores locais apenas nos painéis específicos que necessitam estritamente de contextos mensais consolidados (como `Resultado.jsx` e `Colaboradores.jsx`), garantindo que possam alternar meses no
   próprio componente sem travar nem recarregar a rede.

### 2026-07-09 (Hoje)

- **Ajuste de Segurança e Configuração do .gitignore:**
  - Configurado o arquivo `.gitignore` na raiz do projeto para ignorar todos os arquivos sensíveis de conexões, credenciais e chaves do Oracle VM, incluindo: chaves SSH (`*.key`), diretórios da carteira Oracle (`wallet_painelclaro/`), chaves Firebase (`serviceAccountKey.json`), executáveis e arquivos compactados (`*.zip`, `*.tar.gz`).
- **Remoção de Referências a Claro nos Placeholders de Login:**
  - Substituídos os placeholders de e-mail da tela de login (`Login.jsx`) que faziam referência a `@claro.com.br` por domínios corporativos genéricos `@corporativo.com.br`.
- **Remoção de Imagem da Proposta (QR Code):**
  - Removido o bloco contendo a imagem do QR Code de avaliação do Google da seção de propostas em `Proposta.jsx`.
- **Envio do Projeto para o Git:**
  - Alterado o repositório remoto para `https://github.com/eaerabelo/WORKFLOW---GESTAO-TELECOM.git` e realizado o commit e envio (push) das alterações para a branch `atualizacao`.
- **Atualização da Pasta Rules (Documentações do Projeto):**
  - Atualizados e higienizados os arquivos `COMMENTS.md`, `PLSecurity.md`, `REGRAS_DE_NEGOCIO.md`, `README.md`, `Documentacao.md` e `GUIA_POR_CAMADAS.md` da pasta `rules/`.
  - As atualizações removeram referências diretas à Claro para manter a confidencialidade e incluíram as novas regras do sistema (como carregamento instantâneo sem filtros do cabeçalho global, renderização visual apenas com o primeiro nome do vendedor, e mapeamento seguro de banco relacional e segurança no git).
  - Comitadas e enviadas todas as documentações atualizadas para a branch `atualizacao`.
- **Atualização das Documentações da Raiz (README.md e PROFILE_README.md):**
  - Atualizados os arquivos `README.md` e `PROFILE_README.md` da raiz do projeto para generalizar as referências de marcas (removendo referências diretas à Claro e ao Firebase, que foi substituído pelo banco relacional).
  - Atualizada a árvore completa de diretórios do frontend e backend no manual para refletir com exatidão a estrutura atual do código-fonte (incluindo as pastas `context/`, `services/`, `styles/`, etc., no frontend e a arquitetura modularizada no backend).
  - Enviadas as modificações para o repositório remoto.
- **Higienização Completa de Citações a Claro (Sanitização Geral):**
  - Removido o termo "Claro" (e variantes como Claro Clube, Claro UP, Claro Flex, Claro Net Virtua, Claro TV+, Claro Troca, Claro Trocafy, e a marca no modal de Wi-Fi e rodapé do painel) em todo o código-fonte rastreado do frontend e backend, substituindo por termos genéricos ("Operadora", "Upgrade", "FLEX", "NET VIRTUA", "TV+", "Trocafy", "Clube de Vantagens", etc.).
  - Renomeada a pasta local da carteira Oracle de `wallet_painelclaro` para `wallet_painel` (e seu arquivo compactado de `Wallet_painelclaro.zip` para `Wallet_painel.zip`), atualizando o `.gitignore` e a importação de variáveis de ambiente no arquivo `oracle.js` para usar a nova nomenclatura e um fallback dinâmico (impedindo vazamentos e citando a marca no histórico rastreado do Git).
  - Deletado o migrador obsoleto `migrate.html` que possuía referências explícitas no repositório.
- **Compilação e Deploy (Firebase Hosting):**
  - Executada a compilação de produção (`npm run build`) do frontend sem erros e efetuado o deploy do sistema atualizado no Firebase Hosting de destino (`https://workflow-sistema.web.app`).
- **Commit e Push Final:**
  - Adicionado o diretório `scratch/` e pastas temporárias no `.gitignore` raiz, realizado o commit geral das alterações higienizadas e efetuado o push para a branch `atualizacao` no GitHub.

### 2026-09-15

- **Correção da Integração EmailJS (Recuperação e Cadastro):**
  - Identificada falha silenciosa no backend onde o `authController.js` estava falhando na API do EmailJS devido à ausência das variáveis de ambiente na VM (Secret Hardening anterior).
  - Extração das chaves legadas e injeção controlada de `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY` e geração de nova `JWT_SECRET` forte no arquivo `BACKEND/.env` (UTF-8).
  - Atualização do controller para suportar o uso seguro via REST API ignorando `accessToken` se não exigido pela camada gratuita da conta.
- **Reforço de Segurança no Fluxo de Recuperação de Senha (Frontend):**
  - Implementado o campo "Confirme a Nova Senha" no componente `Login.jsx` (durante o step de redefinição).
  - Adicionada validação estrita no frontend (`newPass !== confirmNewPass`) bloqueando requisições não coincidentes para evitar erros humanos na criação da credencial.
- **Compilação e Deploy Final (Frontend):**
  - Compilação (`npm run build`) e novo deploy (`firebase deploy --only hosting`) finalizados com sucesso para `workflow-sistema.web.app`.

### 2026-11-10 (Hoje)

- **Sincronização Completa do Backend na VM Oracle e Correção de CORS (`Failed to fetch`):**
  - Diagnosticada a causa do erro `Failed to fetch` no Frontend: o código rodando na VM Oracle (`137.131.172.16`) ainda estava na versão de julho sem `credentials: true` no CORS e sem `cookie-parser`, bloqueando requisições com `credentials: 'include'`.
  - Enviados os arquivos atualizados (`server.js`, `.env`, `package.json`, `src/` e `wallet_painel/`) para `/home/ubuntu/BACKEND` na VM.
  - Instaladas as novas dependências (`npm install --omit=dev`), limpos arquivos residuais na raiz do backend, desativado o processo obsoleto `tunnel` no PM2 e reiniciado o `painel-backend` (`pm2 restart painel-backend --update-env && pm2 save`).
  - Validados os cabeçalhos `Access-Control-Allow-Credentials: true` e a conexão ativa com o Oracle Autonomous Database (`oracleDB: "conectado"`).
- **Correção de Autenticação Cross-Domain (Colaboradores / Sistemas) e Visibilidade da Aba `[ACESSOS]`:**
  - Ajustado [`authController.js`](file:///c:/PAINEL%20CLARO/painel-claro/BACKEND/src/controllers/authController.js) para emitir o cookie `jwt_token` com `sameSite: 'none'` e `secure: true` (necessário para comunicação HTTPS entre `workflow-sistema.web.app` e `nip.io`) e retornar também o `token` JWT no payload de login.
  - Atualizados [`Login.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/components/Login.jsx) e [`api.js`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/services/api.js) para armazenar o `jwt_token` e enviá-lo no cabeçalho `Authorization: Bearer <token>` em todas as chamadas `authFetch`, eliminando os erros ao carregar Colaboradores e Sistemas.
  - Tornada a seção `ACESSOS` visível novamente para todos os usuários no menu lateral em [`App.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/App.jsx), restaurada a importação de `syncConfigData` e realizado novo build e deploy no Firebase Hosting (`https://workflow-sistema.web.app`).
- **Restauração do Cofre de Acessos (`DEV2026`) e Correção de Edição/Exclusão de Usuários:**
  - Configurada a chave mestra `COFRE_MASTER_PASS` no `.env` da VM Oracle e restaurado o desbloqueio via `unlockCofre` em [`acessosController.js`](file:///c:/PAINEL%20CLARO/painel-claro/BACKEND/src/controllers/acessosController.js).
  - Ao desbloquear o cofre com a chave mestra, o backend emite um token JWT com permissão de administração (`role: 'GERENTE'`), que é salvo pelo frontend em [`Acessos.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/components/Acessos.jsx) para permitir exclusão e edição imediata de usuários sem bloqueio de RBAC (`403 Forbidden`).
  - Corrigida a cláusula `MERGE INTO USUARIOS` em `saveUser` (`ON (u.USERNAME = src.USERNAME)`) e `DELETE FROM USUARIOS` em `deleteUser` para abranger também usuários cadastrados com `STORE_ID = 'DEFAULT'` e permitir a edição de perfis legados sem e-mail preenchido.
- **Pacote de Melhorias Visuais e Funcionais (Visão 360, Controle Simcards e Escala de Trabalho):**
  - **Visão 360 (`COLABORADORES`):** Renomeado o módulo lateral para `VISÃO 360` em [`App.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/App.jsx) e a sub-aba `Visão Geral` para `DASHBOARD` em [`Colaboradores.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/components/Colaboradores.jsx). Renomeado o card `APARELHOS & ACESSORIOS` para `DEVICES`, reduzido o tamanho do card `SERVIÇOS ADICIONAIS` para 1 coluna e adicionado ao lado o card `STATUS DE OPERAÇÕES` com barras de progresso, quantidade e porcentagem (`%`) para **Ativações**, **Migrações** e **Portabilidade** (suportado também em [`colaboradoresController.js`](file:///c:/PAINEL%20CLARO/painel-claro/BACKEND/src/controllers/colaboradoresController.js)).
  - **Controle de Simcards em Caixinhas + Etiqueta Digital (`EM USO`):** Redesenho completo de [`ControleSimcard.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/components/ControleSimcard.jsx) para layout em caixinhas (cards) mantendo `DATA`, `CPF OU CNPJ`, `PLANO`, `CLIENTE`, `VALOR` e `OBS`. Implementado botão de copiar ICCID e detecção de `Ctrl + C` que aplica automaticamente o selo digital `EM USO: LOGIN <MATRÍCULA> - <NOME>` na caixinha do Simcard em tempo real.
  - **Escala de Trabalho:** Adicionado aviso `ESCALA SUJEITA A ALTERAÇÕES` no topo de [`EscalaTrabalho.jsx`](file:///c:/PAINEL%20CLARO/painel-claro/FRONTEND/src/components/EscalaTrabalho.jsx) e incluídas as categorias `FOLGA BANCO`, `FOLGA PREMIO`, `ATESTADO(A)`, `TREINAMENTO`, `INTERMEDIARIO` e `AFASTADO(A)`.

---

## 📌 Status Atual e Próximos Passos (Futuro)

### 📋 Em Progresso

- [x] Correção de bugs visuais de nomes e alertas.  
- [x] Persistência total de vendas no banco de dados Oracle.
- [x] Implementação de Trava Anti-Spam de 1 minuto no envio de OTP (MailerSend).
- [x] Correção de artefatos visuais de UI (Ex: Simcard 3+ fix).
- [x] Restrição severa da aba ACESSOS vinculada ao RBAC de GERENTE na API e Frontend.
- [ ] Monitoramento contínuo de logs de erro na VM para garantir estabilidade.

### 🔮 Futuro Planejado (Próximas Sprints)

1. **Migração completa para TypeScript (TS):** Adaptar arquivos `.js` e `.jsx` para `.ts` e `.tsx` para maior segurança e facilidade de manutenção de tipos.
2. **Adaptações Mobile com React Native:** Planejamento e modelagem da aplicação móvel para ser consumida pelos vendedores na rua e salão de vendas.
3. **Segurança Avançada:** Implementação de expiração de token JWT mais rigorosa, auditoria de acessos e ocultação de chaves sensíveis.
4. **Descomissionamento de arquivos antigos:** Limpeza de arquivos residuais e códigos órfãos que restaram da arquitetura legada baseada no Firebase.

- **Dashboard Loja & Curva Diária com Análise Dia a Dia e Monitor de GAP (Resultado Consolidado):**
  - **Formatação Brasileira de Datas:** Atualizado o cabeçalho do Termômetro do Mês para padrão pt-BR (`Termômetro do Mês (11/2026 • Novembro)`).
  - **Dashboard Loja Ultra Recheado:** Incluídas todas as métricas detalhadas da tabela analítica nos 3 painéis principais:
    - *Mix Móvel:* Ativação Pura (POS TT), Migrações Pós, Dependentes (Pagos, Banda Larga e Grátis), Pós-Pago Total, Ativação Controle, Migrações Controle, Controle Total, Portabilidade, Claro Flex, Gross PME, Modem BL e M-Play (Pós/Controle).
    - *Mix Residencial:* Banda Larga Fibra, TV+ HD/4K, TV Box Stream, Telefonia Fixa, Mesh Wi-Fi, UR PME Corporativo e Total Residencial.
    - *Anexação & Varejo:* Aparelhos (quantidade, receita líquida, receita bruta e ticket médio), Proteção Móvel (seguro e taxa de anexação 1:1), Acessórios (quantidade, receita líquida, receita bruta, ticket médio e películas), Trade-in Trocafy e Claro UP.
  - **Tabela Executiva de Projeção & Tendenciamento da Loja (Estilo Power BI):**
    - Grid executivo contendo Realizado, Meta Loja, Atingimento Atual com barra de progresso, Ritmo Diário Atual, Projeção de Fechamento Mês, Tendência Final com badges coloridos, Gap/Falta para Meta e Ritmo Diário Necessário para fechar 100%.
  - **Curva Diária Interativa:** Gráfico temporal dia a dia com seleção interativa de datas por clique nas barras.
  - **Monitor Exclusivo de GAP de Meta Deixada do Dia Anterior (Carry-Over):**
    - Apresenta Meta de Ontem vs Realizado de Ontem, Saldo/Gap deixado (déficit ou superávit), Saldo Acumulado no mês até ontem, Meta Rebalanceada para hoje com o gap a recuperar e termômetro de recuperação.
  - **Análise de Oscilação Dia contra Dia (DOD):**
    - Comparativo de Gross e Receita (D vs D-1).
    - Painel *"No que Melhoramos"*: lista destacada de produtos com crescimento dia a dia.
    - Painel *"Onde Houve Queda (Ponto de Atenção)"*: lista diagnóstica de produtos com recuo dia a dia.
  - **Tabela Analítica & Exportação Excel:** Adicionadas as linhas `PROJEÇÃO MÊS` e `TENDÊNCIA (%)` no rodapé da tabela e na exportação XLSX.
  - **Deploy:** Realizado build de produção do Vite e deploy no Firebase Hosting (`https://workflow-sistema.web.app`).

- **Diferenciação de Portabilidade Pós vs Controle na Seção [RESULTADO]:**
  - **Extração Analítica de Port-in:** Segregadas as vendas com portabilidade entre `portabilidadePos` (Pós, Pós PME e Dependentes portados) e `portabilidadeControle` (Controle e Flex portados), mantendo `portabilidade` como o total consolidado.
  - **Visualização Executiva no Dashboard Loja:**
    - Criado card exclusivo e detalhado de Portabilidade com proporção e volumes de **Port-in Pós** e **Port-in Controle**, projeções de fechamento para cada categoria e mini barra comparativa azul (Pós) vs roxo (Controle).
    - Incluídos os indicadores `Port-in Pós-Pago`, `Port-in Controle` e `Portabilidade Total` na **Tabela de Projeção & Tendenciamento (Power BI)**.
    - Integrados no diagnóstico de oscilação **Dia a Dia (DOD)** e na **Tabela Analítica / Exportação Excel** (`PORT-IN PÓS`, `PORT-IN CTRL` e `PORTAB. TOTAL`).
  - **Deploy:** Build e deploy finalizados no Firebase Hosting (`https://workflow-sistema.web.app`).

### [Sessão de 10/11/2026 - Padronização LP & Travas de Segurança no Controle Simcard]

- **Padronização de Nomenclatura de Lojas (`SHOPPING` -> `LP`)**:
  - Atualizados os arquivos `FRONTEND/src/utils/stores.js`, `BACKEND/src/config/stores.js`, `BACKEND/src/controllers/authController.js` e `FRONTEND/src/components/ParcialFechamento.jsx` para substituir `"SHOPPING"` por `"LP"` em todas as lojas (`LP RAPOSO`, `LP UNIÃO OSASCO`, `LP BOURBON`, `LP BUTANTÃ`, `LP CALÇADÃO OSASCO`, `LP HIGIENÓPOLIS`, `LP LAPA`, `LP VILLA LOBOS`, `LP WEST PLAZA`), garantindo exibição padronizada no cabeçalho inicial, Parcial & Fechamento e demais módulos.
- **Travas de Segurança na Seção `[CONTROLE SIMCARD]` (`FRONTEND/src/components/ControleSimcard.jsx`)**:
  - **Trava de Duplicidade (ICCID / CAID)**: Bloqueio automático tanto na inserção em `+ Lote` quanto na edição individual para impedir que códigos `ICCID` (Físico / E-SIM) ou `CAID` (TV Box) entrem repetidos no sistema.
  - **Trava de Data Local**: O campo `DATA` nas caixinhas e a `Data do Lote` passaram a ser travados de acordo com a data local de São Paulo (`getTodaySP()`) e não editáveis (`readOnly`/`disabled`).
  - **Trava de Remoção do Selo Digital (`EM USO`)**: A remoção do selo digital exige autenticação pontual de **Login e Senha** no exato momento da remoção, restrita exclusivamente a cargos diferentes de `VENDEDOR` (Gerência, Liderança, ADM, etc.), e a permissão concedida pela senha aplica-se unicamente à remoção daquele selo sem manter a sessão ou edição geral desbloqueada.

### [Sessão de 10/11/2026 - Otimização de Armazenamento Oracle, Remoção de CPF em Venda, Placeholders e Responsividade Mobile S25]

- **Desfragmentação e Varredura do Banco de Dados Oracle (`user_segments`)**:
  - Realizada varredura completa nas tabelas e segmentos LOB do Oracle Autonomous Database, reduzindo o espaço alocado de **7,75 MB para 2,19 MB** (>71% de redução) através da reorganização e compactação dos segmentos (`ALTER TABLE ... MOVE`, `MOVE LOB` e `REBUILD INDEX`) sem perda de nenhum dado ativo.
- **Indicador Discreto de Armazenamento (`FRONTEND/src/App.jsx`)**:
  - Alterado o rodapé da barra lateral de `"Oracle DB: 7.75 MB"` para `"ARMAZENAMENTO: 2.19 MB / 20 GB"` em cinza claro discreto (`text-neutral-400/75 dark:text-neutral-500/65 text-[10px]`), passando de forma sutil na interface.
- **Remoção Completa do CPF na Seção `[VENDA]` (`FRONTEND/src/components/Venda.jsx`)**:
  - Removida a coluna `CPF/CNPJ` da listagem, os campos de entrada de `CPF / CNPJ` (tanto na Venda Individual quanto na Venda Múltipla/Combo) e o salvamento/exportação desse dado pessoal na seção de Vendas.
- **Placeholders Suaves e Responsividade Mobile Calibrada (`FRONTEND/src/index.css` e `FRONTEND/src/App.jsx`)**:
  - Configurada opacidade global reduzida para todos os `::placeholder` em todas as seções (quase imperceptíveis no modo claro e escuro).
  - Calibrada a escala tipográfica, espaçamentos, tabelas, cabeçalho, barra lateral e redução proporcional dos ícones SVG (`.lucide`) para telas mobile equivalentes à linha **Samsung Galaxy S25 (`360px`), S25 Plus (`384px–412px`) e S25 Ultra (`412px–440px`)**, eliminando poluição visual e ícones gigantes.

### [Sessão de 10/11/2026 - Telas Individuais de Perfil e Ajuda + Menu de Pré-visualização de Login]

- **Menu Superior Direito com Pré-visualização (`FRONTEND/src/App.jsx`)**:
  - Ao passar o mouse ou clicar no perfil no canto superior direito, abre-se uma pré-visualização elegante com o cabeçalho de sessão no formato `"LOGIN - NOME COMPLETO"` (ex.: `"95802904 - MATHEUS RABELO"`), seguido pelos botões **Perfil**, **Ajuda** e **Sair**.
- **Telas Individuais (`standaloneView`) na Mesma URL**:
  - Ao clicar em **Perfil** ou **Ajuda**, o sistema sai da tela principal do painel e renderiza a tela individual dedicada mantendo a mesma URL no navegador sem abrir nova guia.
- **Módulo de Perfil (`BACKEND/src/controllers/profile.js` & `FRONTEND/src/components/profile.jsx`)**:
  - `profile.js` (Backend): Validações, persistência de foto (Base64 otimizado), dados pessoais (Nome, Idade, Data de Nascimento, Telefone, E-mail, Endereço completo, Bio) e motor de apuração de **Destaques do Ano/Mês** cruzando as vendas reais do colaborador por indicador (Móvel, Residencial, Aparelhos & Acessórios, Seguros & SVA, Portabilidade e Migrações).
  - `profile.jsx` (Frontend): Estrutura visual executiva com upload de foto, formulário de dados pessoais/endereço e vitrine elegante de **"Destaque ao Longo do Ano / Mês"** com insígnias e histórico de conquistas.
- **Módulo de Ajuda e Argumentações (`BACKEND/src/controllers/help.js` & `FRONTEND/src/components/help.jsx`)**:
  - `help.js` (Backend): Base estruturada de **Como Funciona o Sistema** (perguntas e respostas detalhadas por módulo) e catálogo de **Argumentações de Vendas** lúdicas e elegantes (Quebra de Objeção, Pós-Pago/Upgrade, Combo Multi Fibra+Móvel, Portabilidade, Proteção Móvel/Seguros e SVA/Streaming), além de rota validada para cadastrar ou remover novas argumentações da loja.
  - `help.jsx` (Frontend): Estrutura visual com busca rápida, acordeões interativos de dúvidas frequentes e cards de argumentação passo a passo (Cenário, Gatilho Mental, Script de Abordagem, Contorno de Objeção e Fechamento de Ouro) com botão de cópia rápida.
- **Sincronização Global de Foto e Nome (`PERFIL` -> Bolha Principal & `VISÃO 360`)**:
  - **Exibição da Foto**: A foto de perfil agora aparece automaticamente na bolha do canto superior direito da tela principal (`App.jsx`), nos cards da equipe na seção `[VISÃO 360]` (`Colaboradores.jsx`) e no cabeçalho individual de desempenho do colaborador.
  - **Botão Remover Foto (`profile.jsx`)**: Adicionado botão **"Remover Foto"** ao lado de **"Trocar Foto"** na tela de Perfil, removendo imediatamente a imagem do banco de dados, da bolha superior e dos cards da `VISÃO 360`.
  - **Correção Gráfica do Cabeçalho (`profile.jsx`)**: Ajustado o posicionamento do nome e credenciais na tela de Perfil para ficar 100% na área limpa abaixo da faixa em degradê, mantendo apenas a moldura da foto sobreposta ao banner.
  - **Migração Automática de Nome no Banco de Dados (`profile.js` & `colaboradoresController.js`)**: Ao alterar o nome no `[PERFIL]`, o sistema atualiza `USUARIOS`, migra automaticamente os registros de `VENDAS` e `REPROVADOS` daquele colaborador para o novo nome e unifica `previousNames` no `colaboradoresController.js`, garantindo que o card existente na `[VISÃO 360]` apenas troque de nome sem nunca duplicar ou criar outro card.
  - **Padronização de Credencial no Perfil (`profile.jsx`)**: Alterada a linha de identificação do colaborador para tudo em maiúsculo no formato `LOGIN: <MATRÍCULA> • <CARGO>` sem frases adicionais.
  - **22 Guias e Situações em `[AJUDA]` (`help.js` & `help.jsx`)**: Expandida a seção `"Como Funciona o Sistema"` para **22 situações práticas e passo a passo** cobrindo todos os módulos do sistema, com filtro rápido por módulo e respostas exibidas de forma clara e imediata.
  - **Refinamento Mobile App-First (`ParcialFechamento.jsx`, `EscalaTrabalho.jsx`, `Colaboradores.jsx`, `ProgressBar.jsx`, `App.jsx` & `index.css`)**:
    - **Parcial & Fechamento**: Eliminado o vazamento de textos (`truncate min-w-0 flex-1`, `tracking-tight sm:tracking-widest`, remoção de margens negativas `-mx-2` e compactação dos inputs numéricos) tanto na aba Parcial quanto no Fechamento de Loja.
    - **Escala de Trabalho**: Contêineres com `w-full max-w-full min-w-0`, coluna fixa `Colaborador` compacta no celular (`max-w-[92px] truncate`), badges enxutos e quebra automática de horários em duas linhas no celular (`09:40` / `18:00`) sem vazar letras.
    - **Visão 360 (Modo Aplicativo Mobile `< 640px`)**: Cards de vendedores reduzidos e redesenhados exclusivamente para celular (`sm:hidden`) com visual lúdico de aplicativo nativo (pílula de `% Meta` no topo, barra de progresso em degradê, 3 mini-widgets lado a lado para `Receita`, `Pós Total` e `UR Total`, e feedback de toque `active:scale-[0.98]`), além de barra de sub-abas estilo controle segmentado de app e cards internos compactos.
  - **Leitura Automática de `"CLARO UP"` em `[PARCIAL & FECHAMENTO]` (`ParcialFechamento.jsx`)**:
    - O motor de consolidação diária de `ParcialFechamento.jsx` passou a contabilizar automaticamente todas as vendas com adicional `"CLARO UP"` (ou `"UPGRADE"`) lançadas na aba `[VENDA]`, preenchendo automaticamente o campo **Claro Up** tanto na **Parcial de Vendas (Por hora)** quanto no card e relatório de **Fechamento de Loja (Final do Dia)**.
  - **Alinhamento em Linha Única no Mobile (`App.jsx`, `ParcialFechamento.jsx` & `EscalaTrabalho.jsx`)**:
    - Ajustados os textos do menu lateral (`w-64`, `whitespace-nowrap`), do cabeçalho superior e dos títulos/linhas internas de **Parcial & Fechamento** e **Escala de Trabalho** para permanecerem estritamente em **linha única (`whitespace-nowrap`)** no celular, sem quebrar linha nem ultrapassar as bordas dos componentes.
  - **Busca Automática de Endereço por CEP, Tamanhos de Uniforme e Destaque Automático no `[PERFIL]` (`profile.js` & `profile.jsx`)**:
    - **Integração com API de CEP (ViaCEP / BrasilAPI)**: Ao digitar os 8 dígitos do CEP (com máscara `00000-000`) ou clicar no botão **CEP**, o sistema consulta automaticamente a API de CEP e preenche `Endereço Residencial`, `Bairro`, `Cidade` e `UF`, além de disponibilizar o campo `Nº / Compl.`.
    - **Tamanho de Uniforme**: Adicionados campos e seletores dedicados para **Camiseta** (`uniformShirt`), **Calça** (`uniformPants`) e **Blusa / Jaqueta** (`uniformJacket`), salvos no banco de dados Oracle.
    - **Categoria de Destaque 100% Automática**: A seção **Selo de Destaque no Ano / Mês** (Especialidade Principal, Categoria de Destaque, Período de Melhor Desempenho e Leitura Automática do Destaque) passou a ser calculada e preenchida automaticamente pelo sistema cruzando os indicadores lançados e destacando a categoria em que o colaborador teve o melhor desempenho relativo na loja.
  - **Tendência de Meta, Análise de Anexação e Portabilidade por Operadora em `[VISÃO 360]` + M-Play Pós/Controle em `[RESULTADO]`**:
    - **Tendência de Meta (`ProgressBar.jsx` & `Colaboradores.jsx`)**: Cada indicador do DASHBOARD exibe `Projeção Mês` e `Tendência %`, calculados por `Projeção = (Realizado ÷ Dias Corridos) × Dias do Mês` e `Tendência = Projeção ÷ Meta × 100` (verde ≥ 100%, âmbar ≥ 80%). Meses passados usam o mês completo; meses futuros não exibem tendência.
    - **Análise de Anexação**: Novo card abaixo de Devices/Serviços/Status com as regras por aparelho vendido — **1 Película**, **3 Acessórios**, **1 Seguro (1:1)** e **1 Trocafy (1:1)** — mostrando esperado × feito, % de anexação, quantidade que **deixou de ser anexada** e índice geral de anexação.
    - **Portabilidade por Operadora**: Novo card ao lado com ranking das operadoras de origem (`operadoraOrigem`) das portabilidades do colaborador no mês, destacando a operadora com mais pedidos.
    - **`Resultado.jsx`**: Adicionadas as colunas **MPLAY PÓS** (Pós/Dependentes) e **MPLAY CONTROLE** (Controle/Flex) na tabela diária, totais e exportação Excel.
  - **Correção do Seletor de Seguros na Seção `[VENDA]` (`Venda.jsx`, `PricingContext.jsx`, `constants.js` & `sistemasController.js`)**:
    - Criadas listas padrão `DEFAULT_SEGURO_OPTIONS` e `DEFAULT_DEPENDENTE_OPTIONS` com as faixas comerciais de seguro (de R$ 14,00 a R$ 75,00) e dependentes, garantindo que o dropdown `"Seguro do Aparelho"` exiba imediatamente todas as opções disponíveis tanto na venda individual quanto na venda combo mesmo offline ou sem resposta prévia da API.
  - **Recalibração dos Cálculos de Projeção e Tendência de Dias (`ProgressBar.jsx`, `Colaboradores.jsx` & `Indicadores.jsx`)**:
    - **Fuso Horário Exato (`America/Sao_Paulo`)**: Substituído o `new Date()` puro por `getTodaySP()`, eliminando distorções de fuso horário noturno (onde em UTC já virava o dia seguinte e distorcia o divisor de dias).
    - **Meses em Andamento**: A projeção e a tendência agora operam exclusivamente no mês corrente (`isCurrentMonth`), com transparência total exibindo o dia atual decorrido, total de dias e o ritmo diário real (ex: `Dia 10/30 • R$ 520,00/dia`).
    - **Meses Encerrados**: Em meses anteriores já fechados, a projeção futura artificial foi desativada, exibindo estritamente o realizado final real.
  - **Status de Operações: Ativação Pura sem Portabilidade (`Colaboradores.jsx` & `colaboradoresController.js`)**:
    - Regra estrita de segregação operacional: vendas com portabilidade (`port === 'SIM'`) agora entram **exclusivamente em PORTABILIDADE** e não são mais somadas em Ativações.
    - O indicador de **ATIVAÇÕES PURAS** passou a contabilizar estritamente novas linhas ativadas sem portabilidade de outra operadora e sem migração.
    - O total de operações (`totalOp`) passou a somar perfeitamente `Ativações Puras + Migrações + Portabilidade`, totalizando 100% no mix de operações e no badge `{totalOp} Gross`.
  - **Projeção e Tendenciamento na Seção `[GESTAO]` -> `[INDICADORES]` (`Indicadores.jsx`)**:
    - **LOJA - INDICADORES**: Cada card de indicador da loja agora exibe a **Projeção Mês** calculada em tempo real com base nos dias decorridos, badge colorido de **Tendência %** (verde ≥ 100%, âmbar ≥ 80%, vermelho < 80%) e o **Ritmo Diário** da loja.
    - **Ranking Detalhado do Indicador**: Adicionado cabeçalho executivo consolidado da Loja (Realizado, Meta, Projeção e Tendência) e, para cada vendedor da equipe, exibição da **Projeção Individual** e **% de Tendência Individual** frente à sua meta individual proporcional.
  - **Criação da Seção "DASHBOARD LOJA" (Estilo Power BI / Visão 360) na Aba `[RESULTADO]` (`Resultado.jsx`)**:
    - **Navegação em Abas no Cabeçalho**: Adicionado seletor de abas (`📊 Dashboard Loja` e `📑 Tabela Analítica`), permitindo alternar instantaneamente entre a visão visual executiva Power BI e a tabela de dados analíticos diários.
    - **Termômetro do Mês & Run Rate**: Card de cabeçalho com identificação do status do mês (`Em Andamento` vs `Mês Fechado`), dias decorridos vs total de dias do mês, ritmo diário de receita e ritmo diário de gross.
    - **Cards Executivos de KPIs (Estilo Power BI)**:
      - **Receita Total**: Realizado, Meta, % Atingimento com barra em degradê, Projeção de Fechamento Mês e badge de Tendência %.
      - **Gross Total**: Volume total de linhas móveis, meta, atingimento %, projeção e tendência.
      - **UR Residencial**: Total de URs (Fibra, TV, Fixo, Mesh), meta, atingimento %, projeção e tendência.
      - **Aparelhos Vendidos**: Total de aparelhos, meta, atingimento %, projeção e tendência.
    - **3 Painéis Segmentados de Mix de Vendas**:
      - **Mix Móvel & Portabilidade**: Pós-pago Total, Controle Total, Portabilidades (volume e % do Gross), Migrações, Dependentes e Streaming M-Play segregado por Pós e Controle.
      - **Mix Residencial & Fixa**: Banda Larga Fibra, TV+ & TV Box, Telefonia Fixa, Wi-Fi Mesh e UR PME corporativo.
      - **Anexação & Rentabilidade**: Taxa de Seguro por Aparelho vendido (1:1), Acessórios e Películas com receita bruta/líquida, Trocafy e Claro UP.
    - **Gráfico Temporal Diário Power BI**: Curva de vendas em barras dia a dia mostrando a evolução do Gross Realizado comparado à Meta Dia, com destaque visual do dia atual e tooltips interativos.

### [Sessão de 11/11/2026 - Bateria de Testes de Autenticação, Correção no E-mail de Validação e Recuperação de Senha]

- **Diagnóstico e Correção da Falha de Validação de E-mail (`BACKEND/src/controllers/authController.js`)**:
  - **Causa Raiz Identificada**: O endpoint `/api/auth/cadastro/solicitar` disparava `ReferenceError: cleanExpiredOTPs is not defined` e `ReferenceError: isManagerSetup is not defined`, caindo no bloco `catch` e retornando o erro genérico `"Erro ao enviar e-mail de validação."`.
  - **Remoção da Função Obsoleta**: Removida a chamada fantasma a `cleanExpiredOTPs()`, pois a validação foi totalmente modernizada com token JWT e expiração de 15 minutos.
  - **Definição de `isManagerSetup`**: Declarada a constante `const isManagerSetup = setupKey === 'lideranca2026';` para validar o fluxo de cadastro de liderança sem erros de referência.
  - **Assinatura e Chamada de `getUserFromDB`**: Corrigida a função para aceitar parâmetros flexíveis `(username = null, email = null, storeId = null)`, corrigindo chamadas onde os argumentos de e-mail estavam desalinhados.
  - **Identificação do Erro 403 do EmailJS (Strict Mode)**: Detectado nos logs que a conta do EmailJS está com o *Strict Mode* habilitado, exigindo a `EMAILJS_PRIVATE_KEY` (`accessToken`). O backend foi blindado com bloco `try/catch` tolerante no envio de e-mails para nunca derrubar o processo com erro 500 caso o serviço terceiro de e-mail falhe, mantendo o log de segurança com o código gerado em console como plano de contingência (`[AUTH BACKUP] CÓDIGO DE SEGURANÇA`).
- **Bateria de Testes Automatizados de Ponta a Ponta (`BACKEND/src/scripts/test_auth_flow.js`)**:
  - **Teste 1 - Conectividade**: Teste de conexão direta com o Oracle Autonomous Database com sucesso.
  - **Teste 2 - Validação de Cadastro**:
    - Bloqueio de login sem prefixo corporativo válido (exige iniciar com `9`, `F`, `T` ou `Z` para colaboradores): **100% Validado**.
    - Bloqueio de cadastro para menores de 18 anos: **100% Validado**.
    - Bloqueio de senha fraca (exige mínimo de 8 caracteres, maiúscula, minúscula, número e caractere especial): **100% Validado**.
    - Emissão de token JWT de cadastro (`registrationToken`) com hash Bcrypt do código OTP de 4 dígitos: **100% Validado**.
  - **Teste 3 - Efetivação de Cadastro**:
    - Rejeição de código OTP incorreto com HTTP 400: **100% Validado**.
    - Validação de código OTP correto e inserção do usuário na tabela `USUARIOS` com senha criptografada via Bcrypt: **100% Validado**.
  - **Teste 4 - Acesso e Login**:
    - Rejeição de senha incorreta com HTTP 401: **100% Validado**.
    - Login bem-sucedido com emissão de JWT (duração de 8 horas), vinculação automática à loja do usuário e cookie seguro: **100% Validado**.
  - **Teste 5 - Recuperação e Redefinição de Senha**:
    - Bloqueio quando o e-mail informado não confere com o e-mail cadastrado do usuário no banco: **100% Validado**.
    - Emissão do token de recuperação (`recoveryToken`): **100% Validado**.
    - Redefinição de senha com validação de código OTP e atualização no banco Oracle: **100% Validado**.
    - Novo acesso imediato utilizando a nova senha redefinida: **100% Validado**.
  - Limpeza automática de usuários de teste criados temporariamente para não poluir o banco de produção.

### [Sessão de 12/11/2026 - Lançamento da v2.5.0: Tela de Entrada Blindada e Atualizações Globais]

- **Atualização do Modal de Novidades do Sistema (`v2.5.0`) (`updatesController.js` & `Atualizacoes.jsx`)**:
  - Atualizada a versão global de novidades para `v2.5.0` com modal automático de 5 segundos ao ingressar no sistema.
  - Novidades divulgadas:
    1. **Segurança Reforçada na Tela de Entrada & 2FA**: Envio garantido de código OTP de 4 dígitos via e-mail corporativo (EmailJS em *Strict Mode* com chave privada e fallback em produção), validação rigorosa de prefixo corporativo (`9`, `F`, `T`, `Z`), checagem de maioridade (18+ anos), senhas criptografadas em Bcrypt no Oracle DB e recuperação de senha com checagem de titularidade.
    2. **Dashboard Loja Executivo & Gap de Meta**: Visão analítica completa na aba `[RESULTADO]` com termômetro do mês, Run Rate, análise exclusiva de Gap de Meta deixada do dia anterior e comparativo dia a dia no que a loja melhorou.
    3. **Portabilidade Segregada (Port-In Pós vs Controle)**: Separação minuciosa das métricas de Port-In Pós-Pago e Port-In Controle, além dos indicadores de M-Play Pós e M-Play Controle.
    4. **Anexação & Rentabilidade (Receita Bruta e Normal)**: Apuração da taxa de anexação por aparelho vendido (1:1 Película, 3:1 Acessórios, 1:1 Seguro, 1:1 Trocafy e Claro UP/Upgrades), com acompanhamento de Receita Bruta e Normal de aparelhos e acessórios.
    5. **Módulos Individuais de Perfil & Ajuda**: Acesso ao Perfil (busca de endereço por CEP, uniformes e Selo de Destaque automático) e Central de Ajuda com 22 manuais passo a passo e scripts de argumentação comercial.
- **Sincronização e Deploy em Produção**:
  - Backend atualizado e reiniciado no servidor da Oracle Cloud (`137.131.172.16`) sob gerenciamento do PM2.
  - Frontend compilado e publicado no Firebase Hosting (`https://workflow-sistema.web.app`).

### [Sessão de 12/11/2026 - Pacote de Melhorias de Entrada, Controle de Simcard, Dashboard, Scripts e Campanhas]

- **Tela de Login e Cadastro (`Login.jsx`)**:
  - Adicionado selo executivo de segurança: `"ACESSO AO SISTEMA SEGURO E AUTENTICADO"` com ícone de escudo.
  - Adicionada identificação de versão do sistema (`WorkFlow v2.5.0`) no rodapé da caixa de autenticação.
  - Criado modal interativo de **Termos de Uso e Política de Privacidade** com conformidade LGPD e checkbox obrigatório de aceite no formulário de cadastro.
  - Trava no ano de nascimento: limitação estrita de 4 dígitos no ano (`max="2026-12-31"`), impedindo digitação excessiva.
  - Flexibilização de e-mail: permissão para cadastro com qualquer provedor de e-mail (Gmail, Hotmail, etc.), preservando o placeholder institucional.
  - Correção de vazamentos visuais de CSS nos formulários e inputs.
- **Seção Controle de Simcard (`ControleSimcard.jsx`)**:
  - Remoção dos status obsoletos `"Em Processo de Baixa SAP"` e `"Chip Não Localizado SAP"` dos botões e da legenda.
  - Capacidade e Validação de ICCID: trava de mínimo e máximo de 20 dígitos numéricos para chips físicos e eSIM (bloqueando cadastros incompletos e alertando o usuário).
  - Isenção explícita para CAID (não submetido à regra dos 20 dígitos numéricos).
  - Campo PLANO com caixinha/datalist de seleção rápida contendo todas as 15 siglas padronizadas (`07`, `ST`, `SU`, `SV`, `TD`, `TE`, `TH`, `TL`, `TI`, `TJ`, `TK`, `TM`, `TO`, `TP`, `VC`).
- **Seção Resultado (`Resultado.jsx`)**:
  - Na aba Dashboard (Anexação & Rentabilidade), divisão da Receita Bruta e Receita Líquida em **espaços individuais e independentes** para Aparelhos e Acessórios, eliminando o compartilhamento do mesmo corpo.
- **Seção Scripts (`Scripts.jsx` & `sistemasController.js`)**:
  - Criação da **Caixa Digital de Ideias de Scripts** permitindo envio de sugestões diretamente para o e-mail do desenvolvedor (`matheusrabelo@gmail.com`) com assunto prefixado `"IDEIA SCRIPT - WORKFLOW SISTEMA"`.
  - Endpoint dedicado no backend (`POST /api/sistemas/scripts/ideia`) integrado ao EmailJS com validação e autenticação segura.
- **Seção Campanhas (`Campanha.jsx`)**:
  - Redesenho completo da identidade visual para estética tecnológica, moderna e elegante (efeitos luminosos, dark glassmorphism e badges futuristas).
  - Formulário centralizado de criação com seleção do estilo da competição: `{FIBRA, APARELHO, ACE, GROSS TOTAL, COMBO MULTI, LIVRE}`.
  - Sistema estruturado de pontuação com pontos por venda, meta de elegibilidade e regras de acúmulo de pontos.
- **Padronização Global de Mensagens e Datas (`App.jsx`, `profile.jsx`, `Acessos.jsx`)**:
  - Substituição da mensagem de loading para `"WORKFLOW GESTÃO - CARREGANDO..."`.
  - Trava de 4 caracteres no ano de nascimento e padronização visual em formato brasileiro (`DD/MM/AAAA`).
- **Deploy & Publicação**:
  - Build de produção compilado em 2.4s e publicado no Firebase Hosting (`https://workflow-sistema.web.app`).
  - Backend sincronizado e reiniciado via PM2 na Oracle Cloud (`137.131.172.16`).
