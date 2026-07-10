# POLÍTICA DE SEGURANÇA DA INFORMAÇÃO (PSI)
**Sistema:** Painel de Gestão de Vendas

## 1. OBJETIVO
Esta política estabelece as diretrizes de segurança da informação para proteger a integridade, confidencialidade e disponibilidade dos dados processados no **Painel de Gestão de Vendas**, garantindo a conformidade com as normas da empresa e com a Lei Geral de Proteção de Dados (LGPD).

## 2. CONTROLE DE ACESSO E AUTENTICAÇÃO
* **Credenciais Únicas:** O acesso ao sistema é estritamente individual. É expressamente proibido o compartilhamento de senhas ou matrículas entre colaboradores.
* **Padrão de Matrícula:** Para garantir a rastreabilidade, apenas matrículas válidas iniciadas com `9` ou `F` são aceitas no registro.
* **E-mail Corporativo:** A criação de contas está restrita ao domínio corporativo da companhia (`@corporativo.com.br`). E-mails pessoais não são autorizados.
* **Sessão e Inatividade:** Para prevenir acessos indevidos em computadores de salão de vendas (terminais compartilhados), a sessão do usuário expira automaticamente após **30 minutos de inatividade** ou ao trocar de navegador.
* **Níveis de Privilégio (RBAC):** O sistema aplica o Princípio do Menor Privilégio. Vendedores só têm acesso aos próprios dados. Apenas Gestores e Seniores possuem permissões de exclusão e auditoria de terceiros.

## 3. PROTEÇÃO DE DADOS E PRIVACIDADE (LGPD)
* **Dados de Clientes:** Informações de Identificação Pessoal (PII), como CPF e CNPJ inseridos nas abas de "Venda" e "UR-Residencial", devem ser utilizados exclusivamente para o registro e validação da operação comercial.
* **Proibição de Exportação Não Autorizada:** A extração massiva de dados (Exportação para Excel) é uma ferramenta bloqueada sistemicamente para Vendedores e Seniores, sendo de uso exclusivo do GESTOR GERAL para fins de prestação de contas à diretoria.
* **Mascaramento:** A interface aplica máscaras automáticas nos campos de CPF/CNPJ e Telefones para evitar a exposição acidental do dado completo em telas abertas.

## 4. GESTÃO DE ESTOQUE E EXCLUSÕES
* **Rastreabilidade Logística:** A exclusão de linhas de inventário (Controle de Simcards) é bloqueada para Vendedores. Qualquer alteração ou exclusão de ICCID (Físico ou E-SIM) requer autenticação ou ação direta da Gerência/Supervisão.
* **Integridade Contábil:** Para evitar fraudes no fechamento de comissões, um Vendedor só pode alterar ou excluir uma venda que ele mesmo registrou. O sistema bloqueia a edição de vendas de terceiros.
* **Exclusão de Usuários (Soft Delete Parcial):** Quando um colaborador é desligado e o Gestor o remove do Cofre de Acessos, seus dados de escala e acessos são apagados, mas o seu **histórico de vendas é mantido inalterado** no Banco de Dados para garantir a integridade do DRE (Demonstrativo de Resultados) da loja.

## 5. COFRE DE ACESSOS E MASTER KEY
* A seção "Cofre de Acessos", que exibe credenciais da equipe, é invisível para usuários comuns.
* O acesso a esta seção pela Gerência exige o conhecimento de uma **Master Key** (Chave Mestra) de desenvolvimento. Esta chave não deve ser anotada em papéis físicos, post-its ou compartilhada em grupos de mensagens.

## 6. SEGURANÇA DA INFRAESTRUTURA E REDE
* **Criptografia em Trânsito:** Todo o tráfego de dados entre os terminais da loja e o banco de dados ocorre sob o protocolo HTTPS/TLS e conexão segura, impedindo a interceptação de dados na rede Wi-Fi.
* **Smart Diff (Anti-DDoS):** A plataforma possui proteção contra sobrecarga de requisições. O salvamento automático agrupa as mudanças locais e envia à nuvem em lotes de forma controlada (Debounce), garantindo estabilidade ao servidor.

## 7. USO ACEITÁVEL EM AMBIENTE DE LOJA
* **Bloqueio de Tela:** Ao se afastar do terminal de atendimento, o colaborador deve bloquear a tela do sistema ou efetuar o logout preventivo.
* **Uso do Wi-Fi para Clientes:** O QR Code disponível no painel serve exclusivamente para a rede de visitantes. A senha da rede corporativa da loja não deve ser compartilhada com clientes.

## 8. RESPOSTA A INCIDENTES
Qualquer suspeita de violação de credenciais, lançamentos indevidos de vendas ou acesso a dados de clientes fora do escopo operacional deve ser reportada imediatamente à Gerência da loja para auditoria via painel de Resultado e Cofre de Acessos.