import { getOracleConnection } from '../config/oracle.js';

export const saveUser = async (req, res) => {
    let conn;
    try {
        const storeId = req.storeId; // via middleware requireStoreId
        const { editingUsername, userData } = req.body;

        // Validações básicas de negócio
        if (!userData || !userData.name || !userData.username || !userData.password || !userData.email) {
            return res.status(400).json({ error: "Preencha todos os campos obrigatórios!" });
        }

        if (!userData.email.toLowerCase().includes("@")) {
            return res.status(400).json({ error: "O e-mail deve ser corporativo e conter '@'." });
        }

        conn = await getOracleConnection();
        const upperUsername = userData.username.toUpperCase();
        const editingUsernameUpper = editingUsername ? editingUsername.toUpperCase() : null;

        // Validar conflito de username se for criação
        if (!editingUsernameUpper) {
            const checkRes = await conn.execute(`SELECT 1 FROM USUARIOS WHERE USERNAME = :username AND STORE_ID = :storeId`, { username: upperUsername, storeId });
            if (checkRes.rows.length > 0) {
                return res.status(400).json({ error: "Este nome de usuário já existe no banco!" });
            }
        }

        // Se estiver editando e mudou o login (username), removemos o velho
        if (editingUsernameUpper && editingUsernameUpper !== upperUsername) {
            await conn.execute(`DELETE FROM USUARIOS WHERE USERNAME = :oldUsername AND STORE_ID = :storeId`, { oldUsername: editingUsernameUpper, storeId });
        }

        // Salvamos o usuário atualizado (forçando caixa padrão)
        await conn.execute(
            `MERGE INTO USUARIOS u
            USING (SELECT :username AS USERNAME, :storeId AS STORE_ID FROM DUAL) src
            ON (u.USERNAME = src.USERNAME AND u.STORE_ID = src.STORE_ID)
            WHEN MATCHED THEN
                UPDATE SET NAME = :name, ROLE = :role, PASS = :pass, PHONE = :phone, EMAIL = :email, BIRTH_DATE = :birthDate, VACATION_START = :vStart, VACATION_END = :vEnd
            WHEN NOT MATCHED THEN
                INSERT (USERNAME, STORE_ID, ROLE, NAME, PASS, PHONE, EMAIL, BIRTH_DATE, VACATION_START, VACATION_END)
                VALUES (:username, :storeId, :role, :name, :pass, :phone, :email, :birthDate, :vStart, :vEnd)`,
            {
                username: upperUsername,
                storeId: storeId,
                name: userData.name.toUpperCase(),
                role: userData.role,
                pass: userData.password,
                phone: userData.phone || "",
                email: userData.email.toLowerCase(),
                birthDate: userData.birthDate || "",
                vStart: userData.vacationStart || "",
                vEnd: userData.vacationEnd || ""
            },
            { autoCommit: true }
        );

        // Retorna o usersDB atualizado
        const usersResult = await conn.execute(`SELECT * FROM USUARIOS WHERE STORE_ID = :storeId OR STORE_ID = 'DEFAULT'`, { storeId });
        let usersDB = {};
        for (let row of usersResult.rows) {
            usersDB[row.USERNAME] = {
                username: row.USERNAME,
                name: row.NAME,
                role: row.ROLE,
                pass: row.PASS,
                phone: row.PHONE,
                email: row.EMAIL,
                birthDate: row.BIRTH_DATE,
                vacationStart: row.VACATION_START,
                vacationEnd: row.VACATION_END
            };
        }

        res.json({ success: true, message: editingUsernameUpper ? "Usuário atualizado com sucesso!" : "Conta criada com sucesso!", usersDB });
    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) await conn.close();
    }
};

export const deleteUser = async (req, res) => {
    let conn;
    try {
        const storeId = req.storeId; // via middleware
        const { username } = req.params;
        const { role } = req.body; // Role quem enviou a requisição (frontend mandava isso antes, mas é melhor pegar via middleware. Vamos manter a checagem)

        const requestingUserRole = req.user ? req.user.role : null;
        if (role !== "GERENTE" && requestingUserRole !== "GERENTE" && requestingUserRole !== "ADMINISTRAÇÃO") {
            return res.status(403).json({ error: "Ação bloqueada. Apenas o Gerente possui permissão para excluir usuários." });
        }

        if (!username) {
            return res.status(400).json({ error: "Nome de usuário não fornecido." });
        }

        conn = await getOracleConnection();
        const result = await conn.execute(`DELETE FROM USUARIOS WHERE USERNAME = :username AND STORE_ID = :storeId`, { username: username.toUpperCase(), storeId }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const usersResult = await conn.execute(`SELECT * FROM USUARIOS WHERE STORE_ID = :storeId OR STORE_ID = 'DEFAULT'`, { storeId });
        let usersDB = {};
        for (let row of usersResult.rows) {
            usersDB[row.USERNAME] = {
                username: row.USERNAME,
                name: row.NAME,
                role: row.ROLE,
                pass: row.PASS,
                phone: row.PHONE,
                email: row.EMAIL,
                birthDate: row.BIRTH_DATE,
                vacationStart: row.VACATION_START,
                vacationEnd: row.VACATION_END
            };
        }

        res.json({ success: true, message: "Usuário apagado com sucesso!", usersDB });
    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) await conn.close();
    }
};

export const unlockCofre = async (req, res) => {
    let conn;
    try {
        const storeId = req.storeId || 'uniao_osasco'; // Use o middleware para pegar o storeId real ou pega do user logado
        const { masterPass } = req.body;
        // Validação da senha no backend para evitar vazamento no frontend
        if (masterPass === "DEV2026" || masterPass === "MASTER") {
            conn = await getOracleConnection();
            const usersResult = await conn.execute(`SELECT * FROM USUARIOS WHERE STORE_ID = :storeId OR STORE_ID = 'DEFAULT'`, { storeId });
            let usersDB = {};
            for (let row of usersResult.rows) {
                usersDB[row.USERNAME] = {
                    username: row.USERNAME,
                    name: row.NAME,
                    role: row.ROLE,
                    pass: row.PASS,
                    phone: row.PHONE,
                    email: row.EMAIL,
                    birthDate: row.BIRTH_DATE,
                    vacationStart: row.VACATION_START,
                    vacationEnd: row.VACATION_END
                };
            }
            res.json({ success: true, message: "Cofre desbloqueado!", usersDB });
        } else {
            res.status(401).json({ error: "Senha de desenvolvedor incorreta!" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) await conn.close();
    }
};
