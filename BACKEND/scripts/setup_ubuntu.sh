#!/bin/bash
echo "==> Atualizando pacotes..."
sudo apt update

echo "==> Instalando Node.js (v20) e Git..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

echo "==> Instalando PM2 (Gerenciador de Processos)..."
sudo npm install -g pm2

echo "==> Criando pasta do projeto..."
mkdir -p ~/painelclaro/BACKEND

echo "==> SETUP FINALIZADO COM SUCESSO!"
