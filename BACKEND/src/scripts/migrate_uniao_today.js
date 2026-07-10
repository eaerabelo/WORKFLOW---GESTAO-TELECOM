import { db } from '../config/firebase.js';
import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    try {
        console.log("Conectando ao Firebase Firestore...");
        
        let vendasDocs = await db.collection('vendas_uniao_osasco').where('data', 'in', ['2026-06-21', '21/06/2026']).get();
        
        if (vendasDocs.empty) {
            console.log("Nenhuma venda encontrada na colecao 'vendas_uniao_osasco' com a data 2026-06-21 ou 21/06/2026.");
            process.exit(0);
        }

        console.log(`Foram encontradas ${vendasDocs.size} vendas.`);
        const connection = await getOracleConnection();
        
        let inserted = 0;
        for (const doc of vendasDocs.docs) {
            const vendaId = doc.id;
            const venda = doc.data();
            
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
                    storeId: 'uniao_osasco',
                    dataVenda: venda.data || '21/06/2026',
                    vendedor: venda.vendedor || '',
                    produto: venda.produto || '',
                    receita: Number(venda.receita) || 0,
                    documentData: JSON.stringify(venda)
                },
                { autoCommit: true }
            );
            inserted++;
        }
        console.log(`Sucesso: ${inserted} vendas migradas para a Oracle!`);
        await closeOraclePool();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
