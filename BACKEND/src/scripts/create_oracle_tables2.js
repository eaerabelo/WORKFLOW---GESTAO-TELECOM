import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function createTables() {
    try {
        const conn = await getOracleConnection();

        const tables = [
            `CREATE TABLE ESTOQUE (
                ID VARCHAR2(50) PRIMARY KEY,
                STORE_ID VARCHAR2(50),
                DOCUMENT_DATA CLOB
            )`,
            `CREATE TABLE REPROVADOS (
                ID VARCHAR2(50) PRIMARY KEY,
                STORE_ID VARCHAR2(50),
                DOCUMENT_DATA CLOB
            )`,
            `CREATE TABLE GEEK_DOCS (
                ID VARCHAR2(50) PRIMARY KEY,
                STORE_ID VARCHAR2(50),
                DOCUMENT_DATA CLOB
            )`,
            `CREATE TABLE CAMPANHAS (
                ID VARCHAR2(50) PRIMARY KEY,
                STORE_ID VARCHAR2(50),
                DOCUMENT_DATA CLOB
            )`,
            `CREATE TABLE CONFIGURACOES (
                STORE_ID VARCHAR2(50) PRIMARY KEY,
                DOCUMENT_DATA CLOB
            )`
        ];

        for (const sql of tables) {
            try {
                await conn.execute(sql);
                console.log(`Tabela criada com sucesso.`);
            } catch (e) {
                if (e.errorNum === 955) {
                    console.log(`Tabela já existe (ignorando).`);
                } else {
                    console.error(`Erro ao criar tabela:`, e.message);
                }
            }
        }
        
        await closeOraclePool();
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
createTables();
