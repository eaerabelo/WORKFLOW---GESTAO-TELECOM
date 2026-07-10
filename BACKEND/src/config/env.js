// O QUE FAZ : Carrega as variáveis do arquivo .env
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();
// EXPORTA AS VARIÁVEIS PARA O BACKEND DO ARQUIVO .env PARA O ARQUIVO APP.JS 
export const ENV = {
    PORT: process.env.PORT || 3000,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STORE_ID: process.env.STORE_ID,
    ORACLE_PASSWORD: process.env.ORACLE_PASSWORD,
    ORACLE_CONNECT_STRING: process.env.ORACLE_CONNECT_STRING || 'db_high',
    NODE_ENV: process.env.NODE_ENV || 'development'
};
