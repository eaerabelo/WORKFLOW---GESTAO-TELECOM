import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function restoreOracle() {
    try {
        console.log("Conectando ao Oracle DB para Restauração...");
        const conn = await getOracleConnection();

        const backupPath = path.resolve('../BACKUP.JSON');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        console.log("Lendo BACKUP.JSON...");

        let totalVendas = 0;
        let totalEstoque = 0;
        let totalReprovados = 0;
        let totalGeekDocs = 0;
        let totalCampanhas = 0;
        let totalConfig = 0;

        for (const key in backupData) {
            const items = backupData[key];
            const isVendas = key.startsWith('vendas_');
            const isEstoque = key.startsWith('estoque_');
            const isReprovados = key.startsWith('reprovados_');
            const isGeekDocs = key.startsWith('geek_docs_');
            const isCampanhas = key.startsWith('campanhas_');
            const isLojas = key === 'lojas';

            // Extrair STORE_ID
            let storeId = 'uniao_osasco'; // fallback
            if (key.includes('lapa')) storeId = 'lapa';
            if (key.includes('calcadao')) storeId = 'calcadao';

            console.log(`Restaurando coleção: ${key} -> STORE_ID: ${storeId}`);

            for (const docId in items) {
                const docData = items[docId];

                if (isVendas) {
                    await conn.execute(
                        `MERGE INTO VENDAS v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DATA_VENDA = :dataVenda, VENDEDOR = :vendedor, PRODUTO = :produto, RECEITA = :receita, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DATA_VENDA, VENDEDOR, PRODUTO, RECEITA, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :dataVenda, :vendedor, :produto, :receita, :documentData)`,
                        {
                            id_val: String(docId),
                            storeId: storeId,
                            dataVenda: docData.data || '',
                            vendedor: docData.vendedor || '',
                            produto: docData.produto || '',
                            receita: Number(docData.receita) || 0,
                            documentData: JSON.stringify(docData)
                        },
                        { autoCommit: true }
                    );
                    totalVendas++;
                }

                else if (isEstoque) {
                    await conn.execute(
                        `MERGE INTO ESTOQUE v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        { id_val: String(docId), storeId: storeId, documentData: JSON.stringify(docData) },
                        { autoCommit: true }
                    );
                    totalEstoque++;
                }

                else if (isReprovados) {
                    await conn.execute(
                        `MERGE INTO REPROVADOS v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        { id_val: String(docId), storeId: storeId, documentData: JSON.stringify(docData) },
                        { autoCommit: true }
                    );
                    totalReprovados++;
                }

                else if (isGeekDocs) {
                    await conn.execute(
                        `MERGE INTO GEEK_DOCS v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        { id_val: String(docId), storeId: storeId, documentData: JSON.stringify(docData) },
                        { autoCommit: true }
                    );
                    totalGeekDocs++;
                }

                else if (isCampanhas) {
                    await conn.execute(
                        `MERGE INTO CAMPANHAS v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        { id_val: String(docId), storeId: storeId, documentData: JSON.stringify(docData) },
                        { autoCommit: true }
                    );
                    totalCampanhas++;
                }

                else if (isLojas) {
                    const sId = String(docId).replace('_config', '');
                    await conn.execute(
                        `MERGE INTO CONFIGURACOES c
                        USING (SELECT :storeId AS STORE_ID FROM DUAL) src
                        ON (c.STORE_ID = src.STORE_ID)
                        WHEN MATCHED THEN
                            UPDATE SET DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (STORE_ID, DOCUMENT_DATA) VALUES (:storeId, :documentData)`,
                        { storeId: sId, documentData: JSON.stringify(docData) },
                        { autoCommit: true }
                    );
                    totalConfig++;
                }
            }
        }

        console.log(`\n==== RESULTADO DO RESTORE ====`);
        console.log(`Vendas sincronizadas: ${totalVendas}`);
        console.log(`Estoque sincronizado: ${totalEstoque}`);
        console.log(`Reprovados sincronizados: ${totalReprovados}`);
        console.log(`Geek Docs sincronizados: ${totalGeekDocs}`);
        console.log(`Campanhas sincronizadas: ${totalCampanhas}`);
        console.log(`Configurações (lojas) sincronizadas: ${totalConfig}`);
        
        await closeOraclePool();
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
restoreOracle();
