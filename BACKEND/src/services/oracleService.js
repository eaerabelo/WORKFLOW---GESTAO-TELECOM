import { getOracleConnection } from '../config/oracle.js';
// consultar vendas E OUTROS DADOS DANDO ERRO NO VENDEDOR 
export async function queryTable(tableName, storeId, startDate, endDate) {
    const conn = await getOracleConnection();
    try {
        let sql = `SELECT DOCUMENT_DATA FROM ${tableName} WHERE STORE_ID = :storeId`;
        let params = { storeId };

        const res = await conn.execute(sql, params);
        let items = res.rows.map(r => JSON.parse(r.DOCUMENT_DATA));

        if (startDate && endDate) {
            items = items.filter(v => {
                let dateIso = v.data || '';
                if (dateIso.includes('/')) {
                    dateIso = dateIso.split('/').reverse().join('-');
                }
                return dateIso >= startDate && dateIso <= endDate;
            });
        }
        return items;
    } finally {
        await conn.close();
    }
}

export async function syncTable(tableName, storeId, upserts, deletes) {
    const conn = await getOracleConnection();
    try {
        if (upserts && upserts.length > 0) {
            for (const item of upserts) {
                const itemId = String(item.id);
                if (tableName === 'VENDAS') {
                    await conn.execute(
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
                            id_val: itemId,
                            storeId: storeId,
                            dataVenda: item.data || '',
                            vendedor: item.vendedor || '',
                            produto: item.produto || '',
                            receita: Number(item.receita) || 0,
                            documentData: JSON.stringify(item)
                        },
                        { autoCommit: false }
                    );
                } else {
                    await conn.execute(
                        `MERGE INTO ${tableName} v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        {
                            id_val: itemId,
                            storeId: storeId,
                            documentData: JSON.stringify(item)
                        },
                        { autoCommit: false }
                    );
                }
            }
        }
        
        if (deletes && deletes.length > 0) {
            for (const id of deletes) {
                await conn.execute(`DELETE FROM ${tableName} WHERE ID = :id AND STORE_ID = :storeId`, { id: String(id), storeId }, { autoCommit: false });
            }
        }
        
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        await conn.close();
    }
}
