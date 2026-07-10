import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`
            SELECT STORE_ID, DATA_VENDA, COUNT(*) AS TOTAL 
            FROM VENDAS 
            WHERE DATA_VENDA LIKE '%06/2026%' OR DATA_VENDA LIKE '2026-06-%'
            GROUP BY STORE_ID, DATA_VENDA
            ORDER BY STORE_ID, DATA_VENDA DESC
        `);
        
        const rows = res.rows;
        // Filtrando para os últimos dias na memória para evitar problemas com formato de data no WHERE
        const recent = rows.filter(r => 
            r.DATA_VENDA.includes('21/06') || r.DATA_VENDA.includes('2026-06-21') ||
            r.DATA_VENDA.includes('22/06') || r.DATA_VENDA.includes('2026-06-22') ||
            r.DATA_VENDA.includes('23/06') || r.DATA_VENDA.includes('2026-06-23')
        );
        
        console.log("VENDAS POR DIA E LOJA (DIAS 21, 22 E 23 DE JUNHO):");
        console.table(recent);
    } catch(e) { 
        console.error(e); 
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
test();
