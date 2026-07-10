import { getOracleConnection, closeOraclePool } from '../src/config/oracle.js';

const APP_USERS = {
    'ADM': { pass: 'DEV2026', role: 'ADMINISTRAÇÃO', name: 'Desenvolvedor Master', email: 'dev@claro.com.br' },
    'GERENTE': { pass: '00332890', role: 'GERENTE', name: 'Gerente Lider', email: 'gerente@claro.com.br' },
    'SENIOR': { pass: '00332890', role: 'SENIOR', name: 'Senior Vendas', email: 'senior@claro.com.br' },
    'GEEK': { pass: '00332890', role: 'GEEK', name: 'Suporte Geek', email: 'geek@claro.com.br' }
};

const stores = ['DEFAULT', 'uniao_osasco', 'calcadao', 'lapa', 'shopping_bourbon', 'shopping_butanta', 'shopping_higienopolis', 'shopping_villa_lobos', 'shopping_west_plaza'];

async function run() {
    let conn;
    try {
        conn = await getOracleConnection();
        
        // 1. Criar a Tabela
        try {
            await conn.execute(`
                CREATE TABLE USUARIOS (
                    USERNAME VARCHAR2(100) NOT NULL,
                    STORE_ID VARCHAR2(50) NOT NULL,
                    ROLE VARCHAR2(50) NOT NULL,
                    NAME VARCHAR2(150),
                    PASS VARCHAR2(255) NOT NULL,
                    PHONE VARCHAR2(50),
                    EMAIL VARCHAR2(150),
                    BIRTH_DATE VARCHAR2(20),
                    VACATION_START VARCHAR2(20),
                    VACATION_END VARCHAR2(20),
                    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (USERNAME, STORE_ID)
                )
            `);
            console.log("✅ Tabela USUARIOS criada com sucesso!");
        } catch (err) {
            if (err.errorNum === 955) {
                console.log("ℹ️ Tabela USUARIOS já existe.");
            } else {
                throw err;
            }
        }

        // 2. Inserir usuários padrão
        console.log("⏳ Inserindo usuários padrão...");
        for (let store of stores) {
            for (let [username, data] of Object.entries(APP_USERS)) {
                await conn.execute(
                    `MERGE INTO USUARIOS u
                    USING (SELECT :username AS USERNAME, :storeId AS STORE_ID FROM DUAL) src
                    ON (u.USERNAME = src.USERNAME AND u.STORE_ID = src.STORE_ID)
                    WHEN MATCHED THEN
                        UPDATE SET NAME = :name, ROLE = :role, PASS = :pass, EMAIL = :email
                    WHEN NOT MATCHED THEN
                        INSERT (USERNAME, STORE_ID, ROLE, NAME, PASS, EMAIL)
                        VALUES (:username, :storeId, :role, :name, :pass, :email)`,
                    {
                        username: username,
                        storeId: store,
                        role: data.role,
                        name: data.name,
                        pass: data.pass,
                        email: data.email
                    },
                    { autoCommit: true }
                );
            }
        }
        console.log("✅ Usuários padrão inseridos com sucesso!");

    } catch (e) {
        console.error("❌ Erro ao criar tabela:", e);
    } finally {
        if (conn) await closeOraclePool();
        process.exit(0);
    }
}

run();
