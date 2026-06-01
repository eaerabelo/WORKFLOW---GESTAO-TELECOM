# Documentação de Módulos e Componentes

Este documento detalha a arquitetura de pastas e mapeia os principais arquivos do Frontend do sistema.

## 🗂️ Arquitetura de Pastas e Arquivos (Frontend)

```text
FRONTEND/
├── public/                 # Arquivos estáticos (favicon, manifest)
├── src/
│   ├── assets/             # Imagens, logos e ícones locais
│   ├── components/         # Módulos principais (Telas do sistema)
│   │   ├── App.jsx             # Contêiner Mestre (Roteamento, WebSocket, Layout)
│   │   ├── Login.jsx           # Autenticação e redefinição de senha
│   │   ├── Venda.jsx           # Formulário de lançamento de Vendas e Combos
│   │   ├── ControleSimcard.jsx # Planilha Excel-like para gestão de estoque
│   │   ├── Resultado.jsx       # Dashboard consolidado da loja
│   │   ├── Meta.jsx            # Definição e Histórico de Metas
│   │   ├── ParcialFechamento.jsx# Relatórios automáticos para WhatsApp
│   │   ├── FatorRvv.jsx        # Simulador de contracheque / Dicas
│   │   ├── Reprovados.jsx      # Histórico de Inviabilidades Técnicas/Crédito
│   │   ├── UrResidencial.jsx   # Gestão de Instalações e Status UR
│   │   ├── Colaboradores.jsx   # Desempenho individual e Ranking da equipe
│   │   ├── Geek.jsx            # Mural de Informações e PDFs (Módulo Geek)
│   │   ├── Campanha.jsx        # Gestão de Prêmios e Incentivos
│   │   ├── Scripts.jsx         # Textos padrões para cópia rápida
│   │   ├── Precificacao.jsx    # Gestão de preços (Em desenvolvimento)
│   │   ├── SistemasClaro.jsx   # Links rápidos
│   │   └── ProgressBar.jsx     # Componente visual genérico
│   ├── utils/              # Funções auxiliares
│   │   ├── constants.js        # Constantes (Metas, Preços Iniciais, Produtos)
│   │   ├── masks.js            # Máscaras de CPF, CNPJ, Moeda, Data
│   │   └── excelImporter.js    # Lógica de leitura de arquivos .xlsx
│   ├── index.css           # Configurações do Tailwind e Estilos Globais
│   └── main.jsx            # Ponto de inicialização do React
├── .env.osasco             # Variáveis de ambiente da Loja Osasco
├── .env.lapa               # Variáveis de ambiente da Loja Lapa
├── .env.calcadao           # Variáveis de ambiente da Loja Calçadão
├── package.json            # Dependências e scripts de execução
├── tailwind.config.js      # Configurações de design do TailwindCSS
└── vite.config.js          # Configuração do empacotador (Build/Dev Server)
```

## Detalhamento dos Componentes Core

### App.jsx (O Coração)
É o contêiner mestre. Controla o menu lateral, tema Dark/Light, renderização das abas e hospeda a conexão WebSocket e os métodos globais (`handleSetSalesData`, `handleUndo`). Aqui também reside o `Smart Diff`, que garante envios otimizados de dados para o Backend.

### Login.jsx
Lida com a autenticação e cadastro de novos usuários. Integra o **EmailJS** para o fluxo de "Esqueci minha Senha", onde um código de 4 dígitos é enviado para o e-mail corporativo do consultor.

### Venda.jsx
Formulário de entrada de faturamento. 
* Suporta "Venda Individual" e "Combo" (Carrinho de compras inteligente).
* Calcula automaticamente o valor da Receita com base no Produto e SubOpção escolhida.
* Contém botão de Importação/Exportação para a gestão carregar planilhas.

### ControleSimcard.jsx
Interface de "Planilha" estilo Excel.
* **Modo de Seleção Horizontal e Vertical**: Os usuários podem clicar, segurar e arrastar o mouse para selecionar várias células em colunas diferentes.
* O botão `Delete` esvazia todas as células selecionadas de uma vez, e o `Ctrl+Z` restaura erros.
* `Ctrl+C` e `Ctrl+V` nativos, permitindo que a gestão cole lotes inteiros de ICCIDs e CPFs diretamente do Excel mantendo as formatações.

### Resultado.jsx
Dashboard gerencial unificado.
* Mostra as vendas consolidadas (Run Rate diário) cruzando com a Meta total da Loja dividida pelos dias úteis.
* Calcula o Gross Total Diário, Pos Total, M-Play, Anexação de Acessórios e Conversão de Seguro.

### Meta.jsx
* **Definir**: Formulário exclusivo para o Gerente traçar os objetivos do mês para todos os produtos.
* **Histórico MxM e SxS**: Tabelas que comparam os faturamentos de meses (Mês x Mês) e semanas (Semana x Semana) passadas, gerando os percentuais de atingimento e crescimento coloridos.

### ParcialFechamento.jsx
Montador automático de relatórios em texto para o WhatsApp.
Puxa o dia atual de vendas e confronta com a "Necessidade Diária" baseada na Meta da loja, formatando tudo no padrão de cobrança da Claro de forma estruturada.

### FatorRvv.jsx
Simulador de contracheque e bússola de performance.
Dispara os dados das vendas para a API e retorna a provisão financeira baseada nas travas de Elegibilidade (Atingir 80% das 3 metas). Exibe mensagens motivacionais e estratégicas ("Dicas de Foco") caso alguma meta esteja atrasada, guiando o vendedor sobre o que ele precisa focar para alavancar seu resultado.