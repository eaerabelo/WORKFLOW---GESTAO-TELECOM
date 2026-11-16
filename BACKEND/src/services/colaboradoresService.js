// C:\PAINEL CLARO\painel-claro\BACKEND\src\services\colaboradoresService.js
import { getOracleConnection } from '../config/oracle.js';

export const normalizeName = (name) => {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(AFASTAD[OA]\)\s*/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
};

export const cleanPhone = (phone) => {
  return String(phone || '').replace(/\D/g, '');
};

const STOP_WORDS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);

const getSignificantTokens = (normName) => {
  return String(normName || '')
    .split(' ')
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
};

/**
 * Mapeia o cargo da planilha para o ROLE oficial do sistema
 */
export const mapearCargoParaRole = (cargoOriginal) => {
  const c = String(cargoOriginal || '').trim().toUpperCase();
  if (c === 'ADM' || c === 'ADMIN' || c.includes('ADMINISTR')) {
    return 'ADMINISTRAÇÃO';
  }
  if (c === 'GERENTE') {
    return 'GERENTE';
  }
  if (c.includes('SENIOR') || c.includes('SÊNIOR')) {
    if (c.includes('ANALISTA')) return 'ADMINISTRAÇÃO';
    return 'SENIOR';
  }
  if (c === 'GEEK') {
    return 'GEEK';
  }
  if (c.includes('COORDENADOR')) {
    return 'COORDENADOR';
  }
  if (c.includes('ESPECIALISTA')) {
    return 'ESPECIALISTA';
  }
  if (c.includes('ANALISTA')) {
    return 'ADMINISTRAÇÃO';
  }
  if (c.includes('ASSISTENTE')) {
    return 'ASSISTENTE RELACIONAMENTO';
  }
  return c || 'VENDEDOR';
};

let storeColChecked = false;
async function ensureStoreIdColumn(conn) {
  if (storeColChecked) return;
  try {
    await conn.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'ALTER TABLE COLABORADORES_BASE ADD (STORE_ID VARCHAR2(50))';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -1430 THEN
            NULL;
          END IF;
      END;
    `);
    storeColChecked = true;
  } catch (e) {
    // ignore
  }
}

const mapRowToColaborador = (row) => ({
  id: row.ID,
  nome: row.NOME,
  nomeNormalizado: row.NOME_NORMALIZADO,
  cargo: row.CARGO,
  role: mapearCargoParaRole(row.CARGO),
  numero: row.NUMERO,
  numeroLimpo: row.NUMERO_LIMPO,
  email: row.EMAIL,
  username: row.USERNAME,
  storeId: row.STORE_ID || null,
  status: row.STATUS,
  observacoes: row.OBSERVACOES
});

/**
 * Busca um colaborador na base pré-cadastrada pelo nome completo, primeiro+último nome ou telefone
 */
export async function findColaboradorPreCadastro({ nome = null, phone = null, email = null }) {
  const normName = nome ? normalizeName(nome) : null;
  const digits = phone ? cleanPhone(phone) : null;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;

  if (!normName && !digits && !cleanEmail) return null;

  const conn = await getOracleConnection();
  try {
    await ensureStoreIdColumn(conn);

    // 1. Busca Direta por Nome Completo Exato, Telefone Exato/Sufixo ou E-mail
    let sql = `
      SELECT 
        ID, NOME, NOME_NORMALIZADO, CARGO, NUMERO, NUMERO_LIMPO, EMAIL, USERNAME, STORE_ID, STATUS, OBSERVACOES 
      FROM COLABORADORES_BASE 
      WHERE 1=0
    `;
    const params = {};

    if (normName && normName.length >= 4) {
      sql += ` OR NOME_NORMALIZADO = :normName`;
      params.normName = normName;
    }

    if (digits && digits.length >= 8) {
      sql += ` OR NUMERO_LIMPO = :digits OR NUMERO_LIMPO LIKE :digitsLike`;
      params.digits = digits;
      params.digitsLike = `%${digits.slice(-8)}`;
    }

    if (cleanEmail) {
      sql += ` OR LOWER(EMAIL) = :cleanEmail`;
      params.cleanEmail = cleanEmail;
    }

    const result = await conn.execute(sql, params);
    if (result.rows && result.rows.length > 0) {
      // Se encontrou mais de um (ex: nome de um e telefone de outro, ou homônimo), prioriza match exato de nome ou telefone
      if (normName) {
        const exactNameMatch = result.rows.find(r => r.NOME_NORMALIZADO === normName);
        if (exactNameMatch) return mapRowToColaborador(exactNameMatch);
      }
      if (digits && digits.length >= 8) {
        const exactPhoneMatch = result.rows.find(r => r.NUMERO_LIMPO === digits || (r.NUMERO_LIMPO && r.NUMERO_LIMPO.endsWith(digits.slice(-8))));
        if (exactPhoneMatch) return mapRowToColaborador(exactPhoneMatch);
      }
      return mapRowToColaborador(result.rows[0]);
    }

    // 2. Se não encontrou por igualdade estrita mas informou Nome com pelo menos 2 palavras (ex: "HEMILY MONTEIRO" -> "HEMILY LOIANE ALVES MONTEIRO")
    if (normName && normName.length >= 5) {
      const inputTokens = getSignificantTokens(normName);
      if (inputTokens.length >= 2) {
        const firstToken = inputTokens[0];
        const lastToken = inputTokens[inputTokens.length - 1];

        // Busca todos os colaboradores cujo nome começa com o mesmo primeiro nome
        const candidatesRes = await conn.execute(
          `SELECT ID, NOME, NOME_NORMALIZADO, CARGO, NUMERO, NUMERO_LIMPO, EMAIL, USERNAME, STORE_ID, STATUS, OBSERVACOES
           FROM COLABORADORES_BASE
           WHERE NOME_NORMALIZADO LIKE :firstPrefix`,
          { firstPrefix: `${firstToken} %` }
        );

        if (candidatesRes.rows && candidatesRes.rows.length > 0) {
          // Filtra candidatos que possuem TODOS os tokens digitados na mesma sequência
          const matchingCandidates = candidatesRes.rows.filter(row => {
            const dbTokens = getSignificantTokens(row.NOME_NORMALIZADO);
            if (dbTokens.length === 0 || dbTokens[0] !== firstToken) return false;

            let searchIdx = 0;
            for (const t of inputTokens) {
              const foundIdx = dbTokens.indexOf(t, searchIdx);
              if (foundIdx === -1) return false;
              searchIdx = foundIdx + 1;
            }
            return true;
          });

          if (matchingCandidates.length === 1) {
            return mapRowToColaborador(matchingCandidates[0]);
          } else if (matchingCandidates.length > 1) {
            // Prioriza candidato cujo último sobrenome bate exatamente com o último token digitado
            const exactLastMatch = matchingCandidates.filter(row => {
              const dbTokens = getSignificantTokens(row.NOME_NORMALIZADO);
              return dbTokens[dbTokens.length - 1] === lastToken;
            });
            if (exactLastMatch.length === 1) {
              return mapRowToColaborador(exactLastMatch[0]);
            }
            return mapRowToColaborador(matchingCandidates[0]);
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar colaborador pré-cadastrado:', error);
    return null;
  } finally {
    await conn.close();
  }
}

/**
 * Atualiza o registro do colaborador pré-cadastrado salvando o e-mail, username e storeId após cadastro
 */
export async function vincularColaboradorAoCadastrar({ colabId = null, nome = null, phone = null, email, username, storeId = null }) {
  if (!email || !username) return false;
  const conn = await getOracleConnection();
  try {
    await ensureStoreIdColumn(conn);

    const cleanMail = String(email).trim().toLowerCase();
    const upperUser = String(username).trim().toUpperCase();

    if (colabId) {
      await conn.execute(
        `UPDATE COLABORADORES_BASE 
         SET EMAIL = :email, USERNAME = :username, STORE_ID = COALESCE(:storeId, STORE_ID), STATUS = 'ATIVO', ATUALIZADO_EM = SYSTIMESTAMP 
         WHERE ID = :colabId`,
        { email: cleanMail, username: upperUser, storeId: storeId || null, colabId },
        { autoCommit: true }
      );
      return true;
    }

    // Caso não tenha colabId direto, busca via findColaboradorPreCadastro
    const found = await findColaboradorPreCadastro({ nome, phone, email });
    if (found && found.id) {
      await conn.execute(
        `UPDATE COLABORADORES_BASE 
         SET EMAIL = :email, USERNAME = :username, STORE_ID = COALESCE(:storeId, STORE_ID), STATUS = 'ATIVO', ATUALIZADO_EM = SYSTIMESTAMP 
         WHERE ID = :colabId`,
        { email: cleanMail, username: upperUser, storeId: storeId || null, colabId: found.id },
        { autoCommit: true }
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao vincular e-mail e username ao colaborador pré-cadastrado:', error);
    return false;
  } finally {
    await conn.close();
  }
}
