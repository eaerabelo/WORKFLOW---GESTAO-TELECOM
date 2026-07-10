import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`SELECT * FROM VENDAS WHERE STORE_ID = 'uniao_osasco' AND (DATA_VENDA = '2026-06-21' OR DATA_VENDA = '21/06/2026')`);
        console.log("VENDAS DE HOJE NO ORACLE:", res.rows.length);
        if (res.rows.length > 0) {
            console.log(res.rows.map(r => ({id: r.ID, v: r.VENDEDOR, p: r.PRODUTO, r: r.RECEITA})));
        }
    } catch(e) {
        console.error(e);
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
test();
