import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function fixConfig() {
    try {
        console.log("Corrigindo CONFIGURACOES...");
        const conn = await getOracleConnection();
        const backupPath = path.resolve('../BACKUP.JSON');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        if (backupData.lojas) {
            for (const docId in backupData.lojas) {
                const sId = String(docId).replace('_config', '');
                const docData = backupData.lojas[docId];
                const strData = JSON.stringify(docData);
                console.log(`Atualizando ${sId} com string de tamanho: ${strData.length}`);

                await conn.execute(
                    `MERGE INTO CONFIGURACOES c
                    USING (SELECT :storeId AS STORE_ID FROM DUAL) src
                    ON (c.STORE_ID = src.STORE_ID)
                    WHEN MATCHED THEN
                        UPDATE SET DOCUMENT_DATA = :documentData
                    WHEN NOT MATCHED THEN
                        INSERT (STORE_ID, DOCUMENT_DATA) VALUES (:storeId, :documentData)`,
                    { 
                        storeId: sId, 
                        documentData: strData
                    },
                    { autoCommit: true }
                );
            }
            console.log("Correção concluída!");
        } else {
            console.log("Não achou config no backup");
        }
        await closeOraclePool();
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
fixConfig();
