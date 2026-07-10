import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`SELECT * FROM VENDAS WHERE STORE_ID = 'uniao_osasco'`);
        console.log("VENDAS:", res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
test();
