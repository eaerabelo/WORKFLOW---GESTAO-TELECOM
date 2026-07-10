import { db } from '../config/firebase.js';
import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrateAll() {
    try {
        console.log("Conectando ao Firebase Firestore...");
        const connection = await getOracleConnection();

        const stores = [
            { id: 'lapa', collection: 'vendas_lapa' },
            { id: 'calcadao', collection: 'vendas_calcadao' },
            { id: 'uniao_osasco', collection: 'vendas_uniao_osasco' }
        ];

        let totalInserted = 0;

        for (const store of stores) {
            console.log(`Migrando ${store.collection}...`);
            const vendasDocs = await db.collection(store.collection).get();
            console.log(`Encontradas ${vendasDocs.size} vendas em ${store.collection}.`);

            let storeInserted = 0;
            for (const doc of vendasDocs.docs) {
                const vendaId = doc.id;
                const venda = doc.data();
                
                // Tratar a data
                let dataVal = venda.data || '';
                
                await connection.execute(
                    `MERGE INTO VENDAS v
                    USING (SELECT :id_val AS ID FROM DUAL) src
                    ON (v.ID = src.ID)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            STORE_ID = :storeId, DATA_VENDA = :dataVenda, VENDEDOR = :vendedor, PRODUTO = :produto, RECEITA = :receita, DOCUMENT_DATA = :documentData
                    WHEN NOT MATCHED THEN
                        INSERT (ID, STORE_ID, DATA_VENDA, VENDEDOR, PRODUTO, RECEITA, DOCUMENT_DATA)
                        VALUES (:id_val, :storeId, :dataVenda, :vendedor, :produto, :receita, :documentData)`,
                    {
                        id_val: vendaId,
                        storeId: store.id,
                        dataVenda: dataVal,
                        vendedor: venda.vendedor || '',
                        produto: venda.produto || '',
                        receita: Number(venda.receita) || 0,
                        documentData: JSON.stringify(venda)
                    },
                    { autoCommit: true }
                );
                storeInserted++;
                totalInserted++;
            }
            console.log(`=> Sincronizado ${storeInserted} vendas para a loja ${store.id}.`);
        }
        
        console.log(`====> Sucesso: TOTAL DE ${totalInserted} VENDAS FORAM SINCRONIZADAS COM A ORACLE!`);
        
        // Let's count Oracle to verify
        for (const store of stores) {
            const countRes = await connection.execute(`SELECT COUNT(*) as QTD FROM VENDAS WHERE STORE_ID = :storeId`, [store.id]);
            console.log(`ORACLE VENDAS para ${store.id}: ${countRes.rows[0].QTD}`);
        }
        
        await closeOraclePool();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrateAll();
