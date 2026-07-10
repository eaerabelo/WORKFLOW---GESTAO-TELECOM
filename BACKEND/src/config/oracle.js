import oracledb from 'oracledb';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './env.js';
// O QUE FAZ : Conecta com o banco de dados Oracle e exporta para o backend do arquivo .env para o arquivo app.js 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// O diretório deve ser absoluto onde estão os arquivos cwallet.sso e tnsnames.ora
process.env.TNS_ADMIN = join(__dirname, '../../wallet_painelclaro');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

// Variável para armazenar o pool de conexões
let pool;
// O QUE FAZ : Inicializa o pool de conexões do Oracle e exporta para o backend do arquivo .env para o arquivo app.js 
async function initOraclePool() {
  try {
    pool = await oracledb.createPool({
      user: "ADMIN",
      password: ENV.ORACLE_PASSWORD,
      connectString: "painelclaro_high",
      walletLocation: process.env.TNS_ADMIN,
      walletPassword: ENV.ORACLE_PASSWORD,
      poolMin: 1,
      poolMax: 10,
      poolIncrement: 2
    });
    console.log('✅ Pool de conexões do Oracle inicializado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao inicializar o Pool do Oracle: ', err);
  }
}
// O QUE FAZ : Retorna uma conexão com o banco de dados Oracle 
async function getOracleConnection() {
  if (!pool) {
    await initOraclePool();
  }
  return await pool.getConnection();
}
// O QUE FAZ : Fecha a conexão com o banco de dados Oracle 
async function closeOraclePool() {
  if (pool) {
    await pool.close(10);
    console.log('Pool de conexões do Oracle fechado.');
  }
}
// EXPORTA O POOL DE CONEXÕES DO ORACLE PARA O BACKEND DO ARQUIVO .env PARA O ARQUIVO APP.JS 
export { initOraclePool, getOracleConnection, closeOraclePool };
