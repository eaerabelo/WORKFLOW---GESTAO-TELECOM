# DOCUMENTO DE REGRAS DE NEGÓCIO - PAINEL DE GESTÃO CLARO

## 1. SISTEMA DE AUTENTICAÇÃO E HIERARQUIA (RBAC)

- **REGRA 1:** O acesso ao sistema é protegido por uma tela de autenticação obrigatória. Nenhum módulo pode ser acessado sem que o usuário forneça uma credencial válida (matrícula e senha).
- **REGRA 1.1:** Novos usuários que não possuem acesso podem se registrar diretamente na tela de login, sendo-lhes atribuído automaticamente o nível de acesso "VENDEDOR".
- **REGRA 1.2:** A sessão de usuário sobrevive a recarregamentos de página (F5) mantendo a permanência na tela principal (Vendas). Ela expira em exatos 30 minutos ou se houver troca de navegador, obrigando novo login.
- **REGRA 1.3:** Para um registro bem-sucedido, a matrícula informada pelo colaborador DEVE obrigatoriamente iniciar com o número "9" ou com a letra "F".
- **REGRA 1.4:** O cadastro de novos usuários exige que o e-mail informado pertença obrigatoriamente à companhia, terminando com o domínio "@claro.com.br".
- **REGRA 2:** O sistema possui perfis de hierarquia de acesso: GESTOR, SENIOR (e equivalentes: ASSISTENTE RELACIONAMENTO, ADMINISTRAÇÃO, JOVEM APRENDIZ, GEEK) e VENDEDOR.
- **REGRA 2.1:** Nas telas operacionais (Venda, Controle Simcard, Reprovados, UR-Residencial), as listas de colaboradores exibem apenas o PRIMEIRO NOME do usuário e ocultam ativamente os usuários com cargos de GESTOR e SÊNIOR (exibindo apenas os Vendedores).
- **REGRA 3:** O GESTOR GERAL possui acesso irrestrito a todos os módulos, podendo editar, excluir e sobrepor qualquer dado do sistema.
- **REGRA 4:** Os perfis SÊNIOR e equivalentes possuem nível de supervisão e backoffice, com acesso livre ao controle de estoque, edição de escalas, definição de metas e exclusão de vendas de terceiros, não tendo acesso apenas ao Cofre de Acessos.
- **REGRA 5:** O VENDEDOR possui o menor nível de acesso. Não pode excluir vendas, não edita estoque, não visualiza a aba de Metas Globais e, na aba de equipe, é bloqueado de visualizar os resultados numéricos de outros vendedores.
- **REGRA 6:** A área "Cofre de Acessos" é oculta ativamente da barra lateral para perfis de Vendedor e Sênior. Somente o usuário GESTOR consegue visualizar a seção e, ainda assim, o sistema exige obrigatoriamente a credencial de desenvolvedor para desbloquear a tela.
- **REGRA 6.1:** Ao apagar um usuário registrado através do Cofre de Acessos (ação permitida apenas ao GESTOR), o sistema deve remover integralmente seu nome das listagens e limpar seus registros nas seções de Escala de Trabalho e Reprovados (buscando tanto pelo Nome Completo quanto pelo Primeiro Nome). O sistema DEVE manter exclusivamente o histórico de vendas atrelado a ele, para não corromper os registros contábeis da operação. A data de nascimento dos usuários também pode ser gerida por este módulo.
- **REGRA 6.2:** O Cofre de Acessos conta com identificação cromática onde cada um dos 7 níveis de acesso (Gerente, Sênior, Assistente, Administração, Jovem Aprendiz, Geek e Vendedor) possui uma "tag" de cor exclusiva para rápido reconhecimento visual da hierarquia.

## 2. MÓDULO DE VENDAS

- **REGRA 7:** Não é permitido registrar ou enviar vendas utilizando uma data futura. O limite máximo do calendário é o dia corrente.
- **REGRA 8:** Ao abrir o modal de "Nova Venda" com um usuário VENDEDOR logado, o campo "Vendedor" deve ser preenchido automaticamente com seu PRIMEIRO NOME e travado para edição.
- **REGRA 9:** Se a venda envolver produtos comissionados, o campo "Receita" muda sua lógica para ler o "Valor Bruto" da venda. A comissão é fracionada dinamicamente: 5% para Aparelhos Celulares (subindo para 6% se o adicional de "Seguro" estiver vinculado) e 15% para Acessórios e Películas. Serviços de Telecom (Pós, Controle, Fibra) computam 100% do valor para o Run Rate.
- **REGRA 10:** A Receita (preço) é preenchida e bloqueada automaticamente se a combinação de Produto + Tipo de Combo + Especificação for encontrada na tabela de preços do sistema. Caso contrário, o campo fica livre para digitação.
- **REGRA 11:** Vendas de produtos móveis (Pós, Controle, etc.) exigem obrigatoriamente que o usuário informe o "Tipo de Operação" (Ativação ou Migração), além dos campos de "M-Play" e "Portabilidade". Para serviços residenciais, o "Tipo de Operação" não é exigido/oculto, mas o campo de "M-Play" também é exibido para preenchimento. Para produtos físicos (Aparelhos, Acessórios), esses campos são ocultos da interface. A tabela de listagem exibe a coluna "Operação".
- **REGRA 11.1:** Na venda de um "APARELHO", caso o adicional "SEGURO" seja selecionado na caixa flutuante, o sistema desmembra a venda ao salvar, registrando automaticamente uma linha adicional e individual para o produto "SEGURO". A comissão de 6% sobre o aparelho original é preservada, e a palavra "Seguro" é ocultada da coluna de adicionais do aparelho na interface para melhor leitura visual.
- **REGRA 11.2:** A tela de Vendas conta com um "Modo Combo" (Venda Múltipla). O vendedor pode adicionar vários serviços (ex: Pós + 3 Dependentes + Fibra + TV) em um carrinho de compras. O sistema exige a especificação do titular, compartilha o contrato residencial entre as linhas necessárias, e salva todos os produtos simultaneamente e de forma desmembrada na base de dados.
- **REGRA 12:** A edição de uma venda já lançada (botão Lápis) ou a exclusão (botão Lixeira) só é permitida ao GESTOR, aos perfis de liderança/backoffice (SÊNIOR e equivalentes) ou ao VENDEDOR que foi o autor exato daquela venda. Se for outro vendedor, as ações ficam bloqueadas (Cadeado). No rodapé, o sistema consolida o sumário diário/mensal de vendas na tela e o somatório da Receita (baseado sempre na receita comissionada da venda, sem a coloração de destaque verde da meta para diferenciação).
- **REGRA 13:** A tabela de visualização exibe as vendas pertencentes ao Mês Selecionado no seletor global do sistema. A barra de pesquisa possui uma inteligência abrangente para filtrar as vendas listadas por Vendedor, Produto, CPF/CNPJ, Adicionais (ex: Trocafy, Seguro), Portabilidade, M-Play e Tipo de Operação.
- **REGRA 13.1:** O filtro de datas inicializa com a "Data de Início" vazia e a "Data Final" com o dia corrente, trazendo por padrão todas as vendas até hoje para o período selecionado. O rodapé da tabela também consolida o volume total de M-Play vendido.
- **REGRA 13.1:** A importação e exportação em Excel são **exclusivos do perfil GESTOR** para proteção dos dados da loja. O sistema possui uma inteligência de mapeamento (Smart Mapper) que converte automaticamente formatações antigas e lê datas seriais.

## 3. MÓDULO UR-RESIDENCIAL (ACOMPANHAMENTO)

- **REGRA 14:** O painel UR-Residencial é alimentado de forma passiva e automática. Toda venda cadastrada no módulo de "Vendas" que pertença à família de produtos residenciais (e possua contrato) é espelhada aqui. O formato de visualização segue estilo planilha (Excel), semelhante ao Controle de Simcards.
- **REGRA 15:** O campo "Data de Instalação" é o único calendário em todo o sistema liberado para selecionar datas futuras.
- **REGRA 16:** O campo "Status" possui 3 opções exclusivas e coloridas: PEND.DE INSTALAÇÃO (Amarelo), CONECTADO (Verde) ou CANCELADO (Vermelho). O campo "Agendamento" restringe-se a faixas (08:00 A 12:00, 12:00 A 15:00, 15:00 A 18:00). O campo "Ação" restringe-se a (REAGENDADO, RETENÇÃO EM FALTA, DESISTIU).
- **REGRA 17:** O GESTOR GERAL e SÊNIOR têm visão de todas as pendências e podem filtrar por qualquer consultor. Já o VENDEDOR ao acessar a aba, visualizará apenas as suas próprias vendas (o filtro fica travado em seu nome e protegido com um cadeado de sigilo). 
- **REGRA 17.1:** O GESTOR GERAL é o único perfil autorizado a apagar um registro de venda ou a modificar os dados do "Contrato" e do "CPF/CNPJ" do cliente por esta tela. Perfis menores encontram esses campos bloqueados (Cursor Not Allowed) e não visualizam o botão de apagar.
- **REGRA 18:** Os campos de "Produto" e "Vendedor" são travados com opções restritas. A aba conta com um filtro rápido por "Vendedor", formatação de CPF/CNPJ automática durante a edição e leitura de datas forçada no padrão brasileiro (DD/MM/AAAA).
- **REGRA 19:** A aba carrega dinamicamente as vendas do dia 1 a 30/31 do mês vigente. Após a virada do mês, o sistema salva as informações que podem ser consultadas a qualquer momento através do botão/filtro de meses salvo na página.

## 4. MÓDULO CONTROLE DE SIMCARDS E ESTOQUE

- **REGRA 20:** Apenas contas de GESTOR ou SÊNIOR (e equivalentes) podem excluir uma linha inteira da planilha de chips ou editar os campos de número de série (Físico ou E-SIM). Se um vendedor tentar clicar nessas áreas, um modal será aberto exigindo que um superior autorize a edição.
- **REGRA 20.1:** Ao acessar a seção Controle Simcard, caso o usuário tenha o papel de VENDEDOR, a aba correspondente ao seu próprio estoque (buscando o seu primeiro nome) é ativada e focada automaticamente.
- **REGRA 21:** Na inclusão de Lote, os ICCIDs de chip Físico e E-SIM inseridos simultaneamente ocupam a mesma linha de cadastro se suas quebras de linha forem correspondentes.
- **REGRA 22:** Todo novo lote de chip criado carrega a regra automática de precificação unitária base padronizada e travada (valor fixo inserido por padrão no banco).
- **REGRA 23:** O campo de "Plano" exibe em cascata exatamente as mesmas opções cadastradas ativamente nas tabelas da loja (Móveis, Dependentes, Flex, etc).
- **REGRA 24:** O campo de "Pagamento" é bloqueado para receber apenas os canais aceitos no caixa (Cartões, Pix, Dinheiro, Lpay, Link).

## 5. MÓDULO DE METAS GLOBAIS E COLABORADORES

- **REGRA 25:** O preenchimento da matriz de metas globais da loja é de acesso exclusivo do GESTOR.
- **REGRA 26:** A construção do painel de metas é feita com base na META TOTAL DA LOJA. O gestor informa o montante global da operação para aquele mês, e o sistema se encarrega de dividir matematicamente pela quantidade de consultores ativos no painel para estipular as metas individuais.
- **REGRA 27:** O Dashboard individual da equipe (aba Colaboradores) gera relatórios "Meta vs Realizado" em tempo real. Esta aba é uma das únicas que exibe o Nome Completo dos usuários para fins de gestão.
- **REGRA 27.1:** O Dashboard possui um motor de Gamificação/Ranking em tempo real. O sistema calcula invisivelmente as vendas de todos os vendedores e coroa (👑) o Top 1 em Receita Total da Loja e premia (🥇) o Destaque com o maior volume em vendas Pós-Pago. As insígnias são visíveis a todos na equipe.
- **REGRA 28:** Perfis de Vendedor acessam a aba Colaboradores sob uma barreira de restrição: eles conseguem abrir somente a própria foto para visualizar o próprio placar de vendas.

## 6. MÓDULO DE ESCALA DE TRABALHO

- **REGRA 29:** A escala tem dois painéis paralelos. O painel superior lida com os horários fixos semanais. O painel inferior espelha um calendário do mês corrido, utilizado para registrar ausências ou exceções à regra semanal.
- **REGRA 30:** Qualquer perfil possui autorização de leitura da escala (Somente Leitura) para checar seus dias de trabalho.
- **REGRA 31:** Somente o perfil de GESTOR detém o privilégio de edição (clique ativo nas células) para sobrepor horários, cadastrar folgas, férias ou atestados médicos de qualquer colaborador.
- **REGRA 31.1:** A Escala exibe todos os colaboradores registrados (incluindo Gestores e Seniores), mas formata a listagem utilizando apenas o Primeiro Nome para deixar a interface enxuta.
- **REGRA 31.2:** Ao editar um dia no mês, a Gestão possui dois atalhos rápidos: "Apagar Horário" (salva a célula como vazia) e "Voltar ao Padrão" (remove a exceção e resgata automaticamente a regra fixa semanal atrelada àquele dia da semana).
- **REGRA 31.1:** O calendário de exceções do mês sobrepõe a regra padrão semanal sempre que status como "FALTA", "ATESTADO", "FÉRIAS", "FERIADO" ou "FOLGA" são informados. O sistema pinta essas ocorrências com cores de alerta específicas.

## 7. BANCO DE DADOS E ARMAZENAMENTO

- **REGRA 32:** O sistema adota uma arquitetura Client-Server com **Backend Node.js** e **Oracle Cloud Autonomous Database**. O Backend mantém os dados cacheados na memória RAM (Cache-First) para zerar a latência de leitura e impedir sobrecargas no banco de dados relacional. O Firebase (Firestore) foi completamente descontinuado do sistema, mantendo apenas o Firebase Hosting para a entrega estática do frontend.
- **REGRA 33:** As ações de salvar, editar e excluir disparam a função de autossave para o servidor Node via requisições REST. Há um sistema de "Smart Diff com Debounce" que aguarda 1,5 segundos de inatividade, compara as mudanças locais com o estado inicial e envia as atualizações otimizadas (`upserts` e `deletes`) via API para o Backend, que processa a gravação de forma massiva e segura (`Batching` / Lote) no banco Oracle.
- **REGRA 34:** A plataforma opera com Sincronização em Tempo Real usando **Socket.io**. O Backend intercepta qualquer alteração gravada e dispara eventos instantâneos (`vendas-atualizadas`) para todas as telas logadas na loja, informando a atualização de forma assíncrona.
- **REGRA 34.1:** **Monitoramento de Banco e Conexão:** A tela do usuário exibe em tempo real o uso do armazenamento em MBs no Oracle Database no menu lateral. Caso o servidor sofra queda de rede ou do próprio banco, o Frontend (App.jsx) ativa o alerta vermelho "Offline" sobrepondo todas as telas, bloqueando lançamentos perdidos no escuro.
- **REGRA 35:** A captura dos dados implementa um **Carregamento Sob Demanda**. O frontend consome os dados do Backend filtrando rigorosamente "Vendas" e "Reprovados" pela data de início e fim (`start` e `end`) do mês selecionado pelo seletor de Mês Global.
- **REGRA 35.1:** A ordenação dos dados baixados do banco emprega uma "Inteligência Cronológica", ordenando os itens primariamente pela data física registrada pelo usuário, e utilizando a Ordem de Lançamento (ID) apenas como método de desempate, impedindo assim o embaralhamento da tabela com lançamentos retroativos.
- **REGRA 35.2:** O sistema conta com uma Central de Notificações global e rastreável. Dispara alertas ("Sininho" e Toasts) na tela para: Atualização de Metas, Horário de Parcial (Gestores), Novas Campanhas Lançadas e Ganhadores de Campanhas anunciados.

## 8. MÓDULO DE REPROVADOS (RESIDENCIAL)

- **REGRA 36:** A aba de "Reprovados" armazena propostas de vendas de serviços residenciais que não puderam ser concluídas por motivos técnicos ou de crédito.
- **REGRA 37:** O campo "Motivos" é rigidamente restrito às opções: CRÉDITO REPROVADO, REPROVADO, CABEAMENTO ou SOMENTE HFC.
- **REGRA 38:** O formulário conta com preenchimento inteligente de CEP via integração (API ViaCEP), que preenche automaticamente o Logradouro, focado preferencialmente no estado de São Paulo.
- **REGRA 38.1:** Se o CEP pertencer a outro estado (UF diferente de 'SP'), o sistema alerta através de um pop-up que o endereço "Não pertence ao estado de SP", embora permita a digitação.
- **REGRA 38.2:** O campo "Vendedor" nesta tela lista apenas os Vendedores (ocultando Gestão) identificados pelo Primeiro Nome.
- **REGRA 39:** A criação e edição de um registro respeita a hierarquia do usuário logado (O Vendedor tem seu nome travado na inclusão e não pode excluir ou alterar registros de outros usuários).

## 9. MÓDULO RESULTADO (VISÃO GERAL)

- **REGRA 40:** O módulo "Resultado" é de acesso público (Somente Leitura) para todos os perfis, servindo como um extrato diário no formato "Mês a Mês" de todas as vendas da loja. A distribuição da meta por dia no cálculo do "Run Rate" obedece à regra de "Traffic Target": Peso 1 de Segunda a Sexta e Peso 2 aos Sábados e Domingos.
- **REGRA 41:** A tabela estilo Excel agrupa automaticamente as vendas diárias com cálculos aprofundados: 
  - **POS TT:** Somente Ativações de "Pós" e "Pós Multi" (exclui Migrações).
  - **MIGRAÇÃO-PÓS:** Vendas de "Pós" e "Pós Multi" classificadas como Migração.
  - **MIGRAÇÃO-CONTROLE:** Vendas de "Controle" e "Flex" com subtipo Migração.
  - **DEP PG / DEP GRÁTIS:** Contagem separada de dependentes pagos e gratuitos.
  - **PORTAB. POS/CTRL:** Total de vendas móveis (Pós/Controle) com Portabilidade = SIM.
  - **REC. ACESSÓRIOS / REC. APARELHOS:** Consolida a receita exata proveniente dessas categorias (com ou sem seguro).
  - **BL:** Soma todas as vendas correspondentes a BL ou BANDA LARGA.
  - **GROSS DIA:** Calcula todos os serviços móveis do dia (Pós, Controle, Dependentes, Flex, Banda Larga e PME).
  - **PÓS-PAGO / CONTROLE:** O totalizador de "Pós-Pago" diário engloba Pós, Migrações, Dependentes (pagos e gratuitos) e Banda Larga.
- **REGRA 41.1:** A contagem de volumes físicos de Aparelhos, Acessórios e Películas nas tabelas de Resultados e Dashboards espelha exatamente a quantidade bruta lançada pelo vendedor (Aparelhos UN e Acessórios UN). O cálculo do Ticket Médio é realizado sobre essa quantidade real física (PHC), para evitar perda de dados e garantir acuracidade total do estoque da loja.
- **REGRA 42:** O campo Acessórios consolida automaticamente as vendas de Acessórios e Películas. No rodapé do módulo, duas linhas fixas ("TOTAL" e "META LOJA") consolidam os resultados totais do mês corrente.

## 10. MÓDULO DE PROPOSTAS (SIMULADOR)

- **REGRA 43:** A aba de propostas atua como uma "Calculadora de Combos" para o Vendedor realizar orçamentos rápidos para os clientes.
- **REGRA 44:** O cálculo identifica automaticamente o modelo do combo: SINGLE (um único serviço), MULTI (Móvel + 1 Serviço Residencial) ou MULTI 3P (Móvel + 2 Serviços Residenciais).
- **REGRA 45:** O Simulador utiliza gatilhos visuais de conversão. Se uma proposta forma um pacote MULTI, o sistema assume que o preço tabelado solto seria 35% mais caro e multiplica a diferença projetada por 12 meses, emitindo o alerta "Economia de R$ X ao ano!".
- **REGRA 46:** As propostas podem ser renderizadas localmente e baixadas como Imagens de alta resolução (via html2canvas) ou enviadas diretamente via WhatsApp contendo uma formatação de texto comercial amigável.

## 11. INTERFACE E ACESSIBILIDADE
- **REGRA 47:** O sistema possui suporte nativo ao Modo Noturno (Dark Mode) com transição de cores suave (500ms). A preferência do usuário é salva no `localStorage` do navegador e aplica um CSS adaptativo em todas as telas, preservando a visibilidade e o conforto visual.
- **REGRA 47.1:** Ocultação de UI (Focus Mode): Um duplo clique duplo (Double-Click) nos títulos das seções recolhe filtros e campos de controle (Minimizar) expandindo a visão das tabelas. O menu lateral se recolhe automaticamente ao clicar duplamente no cabeçalho ou ao clicar repetidamente na aba ativa atual.

## 12. MÓDULO DE PARCIAL E FECHAMENTO

- **REGRA 48:** A seção de Parcial & Fechamento possui **Acesso Estrito à Gerência**. Outros perfis verão a página bloqueada.
- **REGRA 49:** O módulo possui integração de dados fluída, varrendo as vendas do dia e categorizando-as perfeitamente em Gross (Titulares, Dependentes Pagos, Banda Larga, Flex), Gross PME, Convergência Residencial, Aparelhos, Portabilidade, Ativações e Migrações.
- **REGRA 50:** O sistema calcula de forma autônoma Indicadores-Chave de Desempenho (KPIs): Ticket Médio de Acessórios, Taxa de Anexação (%) sobre aparelhos e Taxa de Conversão de Seguro (%).
- **REGRA 51:** A tela possui botões de exportação (One-Click Share) que mesclam as automações calculadas com os dados inseridos manualmente pelo Gestor (Fluxo de Senhas, Boost, Churn) num template de texto formatado, invocando a Web API do WhatsApp instantaneamente.

## 13. MÓDULO GEEK (CENTRAL DE DOCUMENTOS)

- **REGRA 52:** A seção [GEEK] atua como uma biblioteca virtual para os consultores acessarem PDFs e Documentos da operação, agrupados em categorias ("BOOK DE OFERTAS", "MÓDULOS BUNDLE", etc).
- **REGRA 53:** Para preservar o limite de peso de 1MB por documento no banco de dados Firestore, a arquitetura exige a inserção de uma URL externa. A tela dispõe de categorias predefinidas e possui um motor reativo que permite a "Criação de Novas Categorias" (escrevendo seu nome no banco) dinamicamente.
- **REGRA 54:** O privilégio de Adicionar e Excluir "balões" de documentos é restrito aos perfis GEEK, ADMINISTRAÇÃO e GERENTE. Os Vendedores possuem apenas permissão de visualização.

## 14. MÓDULO SCRIPTS (TEXTOS PADRÕES)

- **REGRA 55:** A aba de "Scripts" é de acesso público (Somente Leitura) para todos os perfis. Ela fornece textos pré-montados para facilitar a cópia e colagem em sistemas da operadora.
- **REGRA 56:** A assinatura de cada script é dinâmica. O sistema capta automaticamente o Nome e a identificação do usuário atualmente logado para compor o rodapé da mensagem de forma padronizada antes da cópia.

## 15. ATALHOS GLOBAIS (CABEÇALHO)

- **REGRA 57:** O ícone de Wi-Fi, localizado no cabeçalho global, abre um modal de visualização contendo um QR Code pré-configurado. Qualquer usuário logado, independente da hierarquia, possui permissão para acionar este modal e exibi-lo ao cliente no salão de vendas.

## 16. MÓDULO FATOR RV (SIMULADOR E PRÉVIA DE COMISSIONAMENTO)

- **REGRA 58:** O módulo "Fator RV" atua como um SIMULADOR das regras oficiais do IW. Processa matematicamente a prévia baseando-se nas cartilhas operacionais (Etapas 1, 2 e 3). Um aviso destacado em vermelho avisa que o sistema do IW continua sendo o canal primário e definitivo.
- **REGRA 59:** O Vendedor tem acesso bloqueado ao seletor de usuários na tela, visualizando exclusivamente o seu próprio fator de remuneração. O Gestor pode simular o fator de qualquer colaborador.
- **REGRA 60 (ELEGIBILIDADE E TETO):** O recebimento de qualquer comissão está atrelado à elegibilidade primária: bater **80,00% simultaneamente em 3 indicadores** (Receita, Gross Total e Residencial). Se algum indicador ficar abaixo de 80%, o Fator é zerado. Há também o limitador monetário (Teto) de R$ 6.000,00 aplicável na comissão final.
- **REGRA 61 (RECEITA E FAIXAS):** O multiplicador de ganho (Etapa 2) funciona por faixas de atingimento na meta de Receita: Abaixo de 80% (0%), de 80 a 99% (4,5%), 100 a 119% (7%), 120 a 149% (9%) e a partir de 150% (11%).
- **REGRA 62 (ACELERADORES M-PLAY):** Vendas atreladas ao Claro Multi disparam multiplicadores (1.2x a 1.8x), escalonados **EXCLUSIVAMENTE** pelo atingimento da meta de anexação do **M-Play** (100%, 130%, 160%). O multiplicador só se aplica à venda combo se ela tiver o M-Play marcado como "SIM". Caso contrário, o fator mantém-se em 1.0x. A Portabilidade traz bônus fixo de +30%.
- **REGRA 63 (BÔNUS E EXCEÇÕES PME):** O Dashboard contém "Dicas de Foco" dinâmicas que alteram seu tom de abordagem (Alerta <50%, Formal 50-69%, Encorajador >=70%) para engajar o vendedor. Vendas PME e Flex Recarga não compõem as metas quantitativas (Gross), mas somam integralmente na Receita (Fator 100%).
- **REGRA 64 (BÔNUS ACIMA DA META):** Se o atingimento de determinados produtos (Pós, Fibra e TV) passar de 100%, é acrescentado ao Vendedor um Bônus Unitário Variável de R$10 por venda. Se passar de 115%, remunera R$15 por venda na Etapa 3.
- **REGRA 65 (NPS):** O painel do Fator RV fornece um indicador interativo para inserção da Nota NPS (Qualidade). Caso o índice inserido seja maior ou igual a 8.0, o sistema adiciona passivamente o bônus de 5,00% sobre o total da RV.