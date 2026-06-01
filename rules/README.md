# Painel de Gestão Claro - Multi-Tenant

Este é o repositório do Frontend do Painel de Gestão Claro. O sistema evoluiu para uma arquitetura "Multi-Tenant", o que significa que o mesmo código-fonte serve para gerenciar múltiplas lojas (Osasco, Lapa, Calçadão), isolando os dados de cada uma no backend.

## 🚀 Como Executar o Projeto Localmente

Como o projeto agora é dinâmico, você deve informar ao Vite qual loja deseja simular usando os atalhos criados no `package.json`.

1. Abra o terminal na pasta `FRONTEND`.
2. Instale as dependências (se for a primeira vez):
   `npm install`
3. Rode o servidor de testes para uma loja específica:
   `npm run dev:osasco`
   `npm run dev:lapa`
   `npm run dev:calcadao`

## 🌍 Como Fazer o Deploy (Publicar Alterações)

Para enviar as atualizações visuais e de código para a internet de forma isolada para cada loja, utilize os comandos do Firebase Target:

`npm run deploy:osasco`
`npm run deploy:lapa`
`npm run deploy:calcadao`

## ⚙️ Variáveis de Ambiente (.env)

O projeto utiliza arquivos `.env` separados para cada loja (ex: `.env.osasco`). 
Eles precisam conter:

* `VITE_API_URL`: O link do backend hospedado no Render (Ex: `https://backend-painel-claro.onrender.com`).
* `VITE_STORE_NAME`: Nome da loja exibido no cabeçalho (Ex: `CLARO UNIÃO OSASCO`).
* `VITE_STORE_CODE`: Código PDV da loja (Ex: `AT1M`).

## 🛠️ Tecnologias Utilizadas

* **React (Vite)**: Framework principal para a construção da interface.
* **Tailwind CSS**: Estilização rápida e responsiva, com suporte a Dark/Light Mode.
* **Lucide React**: Biblioteca de ícones vetoriais levíssimos.
* **Socket.io-Client**: Conexão WebSocket para receber atualizações do banco de dados em Tempo Real.
* **HTML2Canvas**: Para capturar a Proposta e gerar imagens PNG automáticas.
* **XLSX (SheetJS)**: Para exportação e importação inteligente de dados do Excel.

---

**Desenvolvido por Matheus Rabelo**
*Focado na otimização da rotina comercial, gerencial e administrativa de equipes de telecomunicações.*