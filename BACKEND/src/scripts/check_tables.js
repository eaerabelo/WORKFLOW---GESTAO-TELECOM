import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`SELECT table_name FROM user_tables`);
        console.log("TABLES:", res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
test();
