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

/**
 * Busca um colaborador na base pré-cadastrada pelo nome ou telefone
 */
export async function findColaboradorPreCadastro({ nome = null, phone = null, email = null }) {
  const normName = nome ? normalizeName(nome) : null;
  const digits = phone ? cleanPhone(phone) : null;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;

  if (!normName && !digits && !cleanEmail) return null;

  const conn = await getOracleConnection();
  try {
    let sql = `
      SELECT 
        ID, NOME, NOME_NORMALIZADO, CARGO, NUMERO, NUMERO_LIMPO, EMAIL, USERNAME, STATUS, OBSERVACOES 
      FROM COLABORADORES_BASE 
      WHERE 1=0
    `;
    const params = {};

    if (normName && normName.length >= 4) {
      sql += ` OR NOME_NORMALIZADO = :normName`;
      params.normName = normName;
    }

    if (digits && digits.length >= 8) {
      // Aceita correspondência exata do telefone ou sufixo dos últimos 8/9 dígitos (DDD opcional)
      sql += ` OR NUMERO_LIMPO = :digits OR NUMERO_LIMPO LIKE :digitsLike`;
      params.digits = digits;
      params.digitsLike = `%${digits.slice(-8)}`;
    }

    if (cleanEmail) {
      sql += ` OR LOWER(EMAIL) = :cleanEmail`;
      params.cleanEmail = cleanEmail;
    }

    sql += ` FETCH FIRST 1 ROWS ONLY`;

    const result = await conn.execute(sql, params);
    if (!result.rows || result.rows.length === 0) {
      // Se não encontrou por igualdade estrita, tenta buscar se o nome informado contém o nome do cadastro ou vice-versa
      if (normName && normName.length >= 6) {
        const fuzzySql = `
          SELECT 
            ID, NOME, NOME_NORMALIZADO, CARGO, NUMERO, NUMERO_LIMPO, EMAIL, USERNAME, STATUS, OBSERVACOES 
          FROM COLABORADORES_BASE 
          WHERE :normName LIKE '%' || NOME_NORMALIZADO || '%' 
             OR NOME_NORMALIZADO LIKE '%' || :normName || '%'
          FETCH FIRST 1 ROWS ONLY
        `;
        const fuzzyRes = await conn.execute(fuzzySql, { normName });
        if (fuzzyRes.rows && fuzzyRes.rows.length > 0) {
          const row = fuzzyRes.rows[0];
          return {
            id: row.ID,
            nome: row.NOME,
            nomeNormalizado: row.NOME_NORMALIZADO,
            cargo: row.CARGO,
            role: mapearCargoParaRole(row.CARGO),
            numero: row.NUMERO,
            numeroLimpo: row.NUMERO_LIMPO,
            email: row.EMAIL,
            username: row.USERNAME,
            status: row.STATUS,
            observacoes: row.OBSERVACOES
          };
        }
      }
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.ID,
      nome: row.NOME,
      nomeNormalizado: row.NOME_NORMALIZADO,
      cargo: row.CARGO,
      role: mapearCargoParaRole(row.CARGO),
      numero: row.NUMERO,
      numeroLimpo: row.NUMERO_LIMPO,
      email: row.EMAIL,
      username: row.USERNAME,
      status: row.STATUS,
      observacoes: row.OBSERVACOES
    };
  } catch (error) {
    console.error('Erro ao buscar colaborador pré-cadastrado:', error);
    return null;
  } finally {
    await conn.close();
  }
}

/**
 * Atualiza o registro do colaborador pré-cadastrado salvando o e-mail e username após cadastro
 */
export async function vincularColaboradorAoCadastrar({ colabId = null, nome = null, phone = null, email, username }) {
  if (!email || !username) return false;
  const conn = await getOracleConnection();
  try {
    const cleanMail = String(email).trim().toLowerCase();
    const upperUser = String(username).trim().toUpperCase();

    if (colabId) {
      await conn.execute(
        `UPDATE COLABORADORES_BASE 
         SET EMAIL = :email, USERNAME = :username, STATUS = 'ATIVO', ATUALIZADO_EM = SYSTIMESTAMP 
         WHERE ID = :colabId`,
        { email: cleanMail, username: upperUser, colabId },
        { autoCommit: true }
      );
      return true;
    }

    const norm = nome ? normalizeName(nome) : null;
    const digits = phone ? cleanPhone(phone) : null;

    if (norm || digits) {
      let updateSql = `
        UPDATE COLABORADORES_BASE 
        SET EMAIL = :email, USERNAME = :username, STATUS = 'ATIVO', ATUALIZADO_EM = SYSTIMESTAMP 
        WHERE 1=0
      `;
      const params = { email: cleanMail, username: upperUser };

      if (norm) {
        updateSql += ` OR NOME_NORMALIZADO = :norm`;
        params.norm = norm;
      }
      if (digits) {
        updateSql += ` OR NUMERO_LIMPO = :digits`;
        params.digits = digits;
      }

      await conn.execute(updateSql, params, { autoCommit: true });
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
