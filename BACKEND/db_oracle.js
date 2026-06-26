import oracledb from 'oracledb';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configura o TNS_ADMIN para apontar para a pasta da Wallet extraída
process.env.TNS_ADMIN = join(__dirname, 'wallet_painelclaro');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

// Variável para armazenar o pool de conexões
let pool;

async function initOraclePool() {
  try {
    pool = await oracledb.createPool({
      user: 'ADMIN',
      password: process.env.ORACLE_PASSWORD,
      connectString: 'painelclaro_tp',
      walletLocation: join(__dirname, 'wallet_painelclaro'),
      walletPassword: process.env.ORACLE_PASSWORD,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2
    });
    console.log('✅ Pool de conexões do Oracle inicializado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao inicializar o Pool do Oracle: ', err);
  }
}

async function getOracleConnection() {
  if (!pool) {
    await initOraclePool();
  }
  return await pool.getConnection();
}

async function closeOraclePool() {
  if (pool) {
    await pool.close(10);
    console.log('Pool de conexões do Oracle fechado.');
  }
}

export { initOraclePool, getOracleConnection, closeOraclePool };
