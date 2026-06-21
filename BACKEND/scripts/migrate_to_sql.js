import { db } from '../firebase.js';
import { getOracleConnection, closeOraclePool } from '../db_oracle.js';

// Usaremos uma tabela com a mesma flexibilidade do Firebase: salvando como JSON no Oracle.
// Isso garante compatibilidade total de trás para frente.
const TABLES_TO_CREATE = [
  "CREATE TABLE vendas (id VARCHAR2(255), store_id VARCHAR2(100), document_data CLOB CONSTRAINT vendas_ensure_json CHECK (document_data IS JSON), CONSTRAINT vendas_pk PRIMARY KEY (id, store_id))",
  "CREATE TABLE estoque (id VARCHAR2(255), store_id VARCHAR2(100), document_data CLOB CONSTRAINT estoque_ensure_json CHECK (document_data IS JSON), CONSTRAINT estoque_pk PRIMARY KEY (id, store_id))",
  "CREATE TABLE reprovados (id VARCHAR2(255), store_id VARCHAR2(100), document_data CLOB CONSTRAINT reprovados_ensure_json CHECK (document_data IS JSON), CONSTRAINT reprovados_pk PRIMARY KEY (id, store_id))",
  "CREATE TABLE geek_docs (id VARCHAR2(255), store_id VARCHAR2(100), document_data CLOB CONSTRAINT geek_docs_ensure_json CHECK (document_data IS JSON), CONSTRAINT geek_docs_pk PRIMARY KEY (id, store_id))",
  "CREATE TABLE campanhas (id VARCHAR2(255), store_id VARCHAR2(100), document_data CLOB CONSTRAINT campanhas_ensure_json CHECK (document_data IS JSON), CONSTRAINT campanhas_pk PRIMARY KEY (id, store_id))",
  "CREATE TABLE configuracoes (store_id VARCHAR2(100) PRIMARY KEY, document_data CLOB CONSTRAINT config_ensure_json CHECK (document_data IS JSON))"
];

const STORES = ['lapa', 'uniao_osasco', 'calcadao'];

async function createTables(connection) {
  for (const query of TABLES_TO_CREATE) {
    try {
      await connection.execute(query);
      console.log(`✅ Tabela criada: ${query.split(' ')[2]}`);
    } catch (err) {
      if (err.errorNum === 955) {
        console.log(`Aviso: Tabela ${query.split(' ')[2]} já existe.`);
      } else {
        console.error(`Erro ao criar tabela: `, err);
      }
    }
  }
}

async function migrateCollection(connection, collectionName, tableName, storeId) {
  console.log(`🔄 Iniciando migração de ${collectionName}...`);
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`Nenhum dado encontrado na coleção ${collectionName}.`);
      return;
    }

    let count = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const jsonData = JSON.stringify(data);
      const docId = doc.id;
      
      const insertSql = `
        MERGE INTO ${tableName} t
        USING (SELECT :id AS id, :store_id AS store_id, TO_CLOB(:document_data) AS document_data FROM DUAL) src
        ON (t.id = src.id AND t.store_id = src.store_id)
        WHEN MATCHED THEN
          UPDATE SET t.document_data = src.document_data
        WHEN NOT MATCHED THEN
          INSERT (id, store_id, document_data) VALUES (src.id, src.store_id, src.document_data)
      `;
      
      await connection.execute(insertSql, {
        id: String(docId),
        store_id: storeId,
        document_data: jsonData
      }, { autoCommit: true });
      
      count++;
    }
    console.log(`✅ Migração concluída: ${count} documentos transferidos de ${collectionName} para ${tableName} (${storeId}).`);
    
  } catch (err) {
    console.error(`❌ Erro ao migrar ${collectionName}:`, err);
  }
}

async function migrateConfig(connection, storeId) {
  try {
    const doc = await db.collection('lojas').doc(`${storeId}_config`).get();
    if (doc.exists) {
      const jsonData = JSON.stringify(doc.data());
      const insertSql = `
        MERGE INTO configuracoes t
        USING (SELECT :store_id AS store_id, TO_CLOB(:document_data) AS document_data FROM DUAL) src
        ON (t.store_id = src.store_id)
        WHEN MATCHED THEN
          UPDATE SET t.document_data = src.document_data
        WHEN NOT MATCHED THEN
          INSERT (store_id, document_data) VALUES (src.store_id, src.document_data)
      `;
      await connection.execute(insertSql, { store_id: storeId, document_data: jsonData }, { autoCommit: true });
      console.log(`✅ Configuração de ${storeId} migrada para Oracle.`);
    }
  } catch(e) {
    console.error(`Erro ao migrar config de ${storeId}:`, e);
  }
}

async function startMigration() {
  const connection = await getOracleConnection();
  if (!connection) return;

  console.log("=== INICIANDO MIGRAÇÃO DO FIREBASE PARA ORACLE CLOUD ===");
  
  await createTables(connection);

  for (const storeId of STORES) {
    console.log(`\n--- Migrando dados da loja: ${storeId.toUpperCase()} ---`);
    await migrateCollection(connection, `vendas_${storeId}`, 'vendas', storeId);
    await migrateCollection(connection, `estoque_${storeId}`, 'estoque', storeId);
    await migrateCollection(connection, `reprovados_${storeId}`, 'reprovados', storeId);
    await migrateCollection(connection, `geek_docs_${storeId}`, 'geek_docs', storeId);
    await migrateCollection(connection, `campanhas_${storeId}`, 'campanhas', storeId);
    await migrateConfig(connection, storeId);
  }

  await closeOraclePool();
  console.log("\n🚀 TODAS AS MIGRAÇÕES FORAM FINALIZADAS!");
  process.exit(0);
}

startMigration();
