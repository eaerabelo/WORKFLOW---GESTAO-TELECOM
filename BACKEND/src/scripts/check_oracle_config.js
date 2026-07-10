import { getOracleConnection, closeOraclePool } from '../config/oracle.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkConfig() {
    try {
        const conn = await getOracleConnection();
        const res = await conn.execute(`SELECT STORE_ID, DOCUMENT_DATA FROM CONFIGURACOES`);
        res.rows.forEach(r => {
            console.log(`STORE: ${r.STORE_ID}`);
            console.log(`Type: typeof r.DOCUMENT_DATA: ${typeof r.DOCUMENT_DATA}`);
            console.log(`Value: ${String(r.DOCUMENT_DATA).substring(0, 100)}`);
        });
    } catch(e) {
        console.error(e);
    } finally {
        await closeOraclePool();
        process.exit(0);
    }
}
checkConfig();
