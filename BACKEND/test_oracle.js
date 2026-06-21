import oracledb from 'oracledb';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Em modo Thin, a biblioteca usa o TNS_ADMIN para achar o tnsnames.ora e os arquivos da Wallet
process.env.TNS_ADMIN = join(__dirname, 'wallet_painelclaro');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function testConnection() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'ADMIN',
      password: '592761834Aa-',
      connectString: 'painelclaro_tp',
      walletLocation: join(__dirname, 'wallet_painelclaro'),
      walletPassword: '592761834Aa-'
    });

    console.log("✅ Conectado com sucesso ao Oracle Cloud!");

    // Testa a consulta da data atual no servidor Oracle
    const result = await connection.execute(`SELECT TO_CHAR(SYSDATE, 'DD-MON-YYYY HH24:MI:SS') AS current_time FROM DUAL`);
    console.log("🕒 Hora no servidor Oracle: ", result.rows[0].CURRENT_TIME);

  } catch (err) {
    console.error("❌ Erro na conexão:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar conexão", err);
      }
    }
  }
}

testConnection();
