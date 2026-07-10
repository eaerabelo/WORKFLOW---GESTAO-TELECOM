import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkStores() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`SELECT STORE_ID, COUNT(*) as QTD FROM VENDAS GROUP BY STORE_ID`);
        console.log("VENDAS POR LOJA NA ORACLE:");
        console.log(res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
checkStores();
