// C:\PAINEL CLARO\painel-claro\BACKEND\src\services\storeSpaceService.js
import oracledb from 'oracledb';
import { getOracleConnection } from '../config/oracle.js';
import { STORES, findStore } from '../config/stores.js';

let tableChecked = false;

export async function ensureLojasSistemaTable(conn) {
  if (tableChecked) return;
  try {
    await conn.execute(`
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE LOJAS_SISTEMA (
            STORE_ID VARCHAR2(50) PRIMARY KEY,
            CODE_ID VARCHAR2(20) NOT NULL,
            CODE_SAP VARCHAR2(20),
            NAME VARCHAR2(120) NOT NULL,
            STATUS VARCHAR2(20) DEFAULT ''ATIVA'',
            CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
            UPDATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
          )
        ';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);
    tableChecked = true;
  } catch (err) {
    console.error('Aviso ao verificar tabela LOJAS_SISTEMA:', err.message);
  }
}

/**
 * Garante que uma loja tenha seu espaço reservado na tabela CONFIGURACOES e LOJAS_SISTEMA no Oracle DB.
 * Nunca sobrescreve dados existentes em CONFIGURACOES caso a loja já possua dados salvos.
 */
export async function ensureStoreSpaceInDB(storeInput) {
  const matchedStore = typeof storeInput === 'object' && storeInput?.id
    ? storeInput
    : findStore(storeInput);

  if (!matchedStore) return null;

  const conn = await getOracleConnection();
  try {
    await ensureLojasSistemaTable(conn);

    // 1. Registra/Atualiza metadados na tabela LOJAS_SISTEMA
    await conn.execute(
      `MERGE INTO LOJAS_SISTEMA l
       USING (SELECT :storeId AS STORE_ID FROM DUAL) src
       ON (l.STORE_ID = src.STORE_ID)
       WHEN MATCHED THEN
         UPDATE SET CODE_ID = :codeId, CODE_SAP = :codeSap, NAME = :name, UPDATED_AT = SYSTIMESTAMP
       WHEN NOT MATCHED THEN
         INSERT (STORE_ID, CODE_ID, CODE_SAP, NAME, STATUS, CREATED_AT, UPDATED_AT)
         VALUES (:storeId, :codeId, :codeSap, :name, 'ATIVA', SYSTIMESTAMP, SYSTIMESTAMP)`,
      {
        storeId: matchedStore.id,
        codeId: matchedStore.code || 'DEV',
        codeSap: matchedStore.sap || '0000',
        name: matchedStore.name
      },
      { autoCommit: true }
    );

    // 2. Garante espaço reservado na tabela CONFIGURACOES (sem sobrescrever se já existir)
    const defaultConfigPayload = JSON.stringify({
      storeInfo: {
        id: matchedStore.id,
        name: matchedStore.name,
        code: matchedStore.code,
        sap: matchedStore.sap
      },
      goalsDB: {},
      scheduleData: {},
      monthlyOverrides: {},
      pricingData: {},
      profilesDB: {},
      userPreferences: {},
      usersDB: {
        ADM: { pass: 'DEV2026', role: 'ADMINISTRAÇÃO', name: 'Desenvolvedor Master' }
      }
    });

    await conn.execute(
      `MERGE INTO CONFIGURACOES c
       USING (SELECT :storeId AS STORE_ID FROM DUAL) src
       ON (c.STORE_ID = src.STORE_ID)
       WHEN NOT MATCHED THEN
         INSERT (ID, STORE_ID, DOCUMENT_DATA)
         VALUES ('config', :storeId, :docData)`,
      {
        storeId: matchedStore.id,
        docData: { val: defaultConfigPayload, type: oracledb.CLOB }
      },
      { autoCommit: true }
    );

    return matchedStore;
  } catch (error) {
    console.error(`Erro ao reservar espaço da loja ${matchedStore.id} no Oracle:`, error.message);
    return matchedStore;
  } finally {
    await conn.close();
  }
}

/**
 * Inicializa e reserva o espaço no banco de dados para TODAS as lojas cadastradas em STORES.
 */
export async function seedAllStoresSpacesInDB() {
  const results = [];
  for (const store of STORES) {
    const res = await ensureStoreSpaceInDB(store);
    if (res) results.push(res.id);
  }
  return results;
}
