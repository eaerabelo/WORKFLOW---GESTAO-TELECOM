import { getOracleConnection } from '../config/oracle.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { STORES, findStore } from '../config/stores.js';
import { findColaboradorPreCadastro, vincularColaboradorAoCadastrar } from '../services/colaboradoresService.js';
import { ensureStoreSpaceInDB } from '../services/storeSpaceService.js';

const validarSenha = (password) => {
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'A senha deve ter pelo menos 1 letra maiúscula.';
    if (!/[a-z]/.test(password)) return 'A senha deve ter pelo menos 1 letra minúscula.';
    if (!/[0-9]/.test(password)) return 'A senha deve ter pelo menos 1 número.';
    if (!/[(,!.*@#%$&/\-+=)]/.test(password)) return 'A senha deve ter pelo menos 1 caractere especial permitido: (,!.*@#%$&/-+=)';
    return null;
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn("ATENÇÃO: JWT_SECRET não definido no arquivo .env! A segurança da aplicação está comprometida.");
}

const getUserFromDB = async (username = null, email = null, storeId = null) => {
    const conn = await getOracleConnection();
    try {
        let query = `SELECT * FROM USUARIOS WHERE 1=1`;
        let params = {};

        if (username) {
            query += ` AND USERNAME = :username`;
            params.username = username.toUpperCase();
        }

        if (storeId) {
            query += ` AND STORE_ID = :storeId`;
            params.storeId = storeId;
        }
        
        if (email) {
            query += ` AND LOWER(EMAIL) = :email`;
            params.email = email.toLowerCase().trim();
        }

        const result = await conn.execute(query, params);
        if (!result.rows || result.rows.length === 0) return null;
        
        const row = result.rows[0];
        
        return {
            username: row.USERNAME,
            storeId: row.STORE_ID,
            role: row.ROLE,
            name: row.NAME,
            pass: row.PASS,
            phone: row.PHONE,
            email: row.EMAIL,
            birthDate: row.BIRTH_DATE,
            vacationStart: row.VACATION_START,
            vacationEnd: row.VACATION_END
        };
    } finally {
        await conn.close();
    }
};

const updateUserPasswordInDB = async (username, newPass) => {
    const conn = await getOracleConnection();
    try {
        const hashedPass = await bcrypt.hash(newPass, 10);
        await conn.execute(`UPDATE USUARIOS SET PASS = :newPass WHERE USERNAME = :username`, { newPass: hashedPass, username: username.toUpperCase() }, { autoCommit: true });
    } finally {
        await conn.close();
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: "Preencha usuário e senha." });
        }

        const userUpper = username.toUpperCase().trim();
        const user = await getUserFromDB(userUpper);

        if (!user) {
            import('fs').then(fs => fs.appendFileSync('requests.log', `FALHA LOGIN (Invalido): ${userUpper}\n`)).catch(()=>{});
            return res.status(401).json({ error: "Usuário ou senha inválidos." });
        }

        // Verifica a senha
        let isMatch = false;
        
        if (user.pass && user.pass.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, user.pass);
        } else {
            if (user.pass === password) {
                isMatch = true;
                const hashedPass = await bcrypt.hash(password, 10);
                const conn = await getOracleConnection();
                try {
                    await conn.execute(`UPDATE USUARIOS SET PASS = :newPass WHERE USERNAME = :username`, { newPass: hashedPass, username: userUpper }, { autoCommit: true });
                } catch(e) { console.error("Erro ao migrar senha para bcrypt no login:", e); }
                finally { await conn.close(); }
                user.pass = hashedPass;
            }
        }
        
        if (!isMatch) {
            import('fs').then(fs => fs.appendFileSync('requests.log', `FALHA LOGIN (Senha errada): ${userUpper}\n`)).catch(()=>{});
            return res.status(401).json({ error: "Usuário ou senha inválidos." });
        }

        // Verifica se o colaborador consta na base pré-cadastrada e sincroniza cargo caso estivesse como VENDEDOR
        try {
            if (!user.role || user.role === 'VENDEDOR') {
                const colabMatch = await findColaboradorPreCadastro({ nome: user.name, phone: user.phone, email: user.email });
                if (colabMatch && colabMatch.role && colabMatch.role !== 'VENDEDOR') {
                    user.role = colabMatch.role;
                    const conn = await getOracleConnection();
                    try {
                        await conn.execute(
                            `UPDATE USUARIOS SET ROLE = :newRole WHERE USERNAME = :username`,
                            { newRole: colabMatch.role, username: userUpper },
                            { autoCommit: true }
                        );
                    } finally {
                        await conn.close();
                    }
                    await vincularColaboradorAoCadastrar({
                        colabId: colabMatch.id,
                        nome: user.name,
                        phone: user.phone,
                        email: user.email,
                        username: userUpper,
                        storeId: user.storeId
                    });
                    console.log(`✅ [LOGIN] Cargo sincronizado automaticamente para ${userUpper}: ${user.role}`);
                }
            }
        } catch (roleSyncErr) {
            console.error("Aviso ao conferir cargo no login:", roleSyncErr.message);
        }

        // Garante que o espaço da loja existe no banco de dados Oracle
        const matchedStore = findStore(user.storeId);
        if (matchedStore) {
            user.storeId = matchedStore.id;
            ensureStoreSpaceInDB(matchedStore).catch(() => {});
        }

        import('fs').then(fs => fs.appendFileSync('requests.log', `SUCESSO LOGIN: ${userUpper} (${user.role}) vinculado na loja ${user.storeId}\n`)).catch(()=>{});

        // Verifica Férias
        if (user.vacationStart && user.vacationEnd) {
            const today = new Date();
            const start = new Date(user.vacationStart + 'T00:00:00');
            const end = new Date(user.vacationEnd + 'T23:59:59');
            if (today >= start && today <= end) {
                return res.status(403).json({ error: `Acesso bloqueado por Férias. Retorno previsto para após ${user.vacationEnd}.` });
            }
        }

        // Gera o Token JWT (Dura 8 horas)
        const token = jwt.sign(
            { username: userUpper, role: user.role, storeId: user.storeId },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Remove a senha antes de retornar os dados do usuário pro front
        const safeUser = {
            ...user,
            storeName: matchedStore ? matchedStore.name : 'LP UNIÃO OSASCO',
            storeCode: matchedStore ? matchedStore.code : 'AT1M',
            storeSap: matchedStore ? matchedStore.sap : '1150'
        };
        delete safeUser.pass;

        // Calcula isBirthday
        safeUser.isBirthday = false;
        if (safeUser.birthDate) {
            const today = new Date();
            const [year, month, day] = safeUser.birthDate.split('-');
            if (today.getMonth() + 1 === parseInt(month, 10) && today.getDate() === parseInt(day, 10)) {
                safeUser.isBirthday = true;
            }
        }

        // Define Cookie HttpOnly com o JWT (Proteção XSS e CSRF)
        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 8 * 60 * 60 * 1000 // 8 horas
        });

        res.json({ success: true, user: safeUser, token });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno no servidor ao realizar login." });
    }
};

const sendCodeEmail = async (email, nome, subject, codigo, templateId = 'template_6wuyizw') => {
    const templateParams = {
        to_name: nome || 'Usuário',
        to_email: email,
        codigo: codigo,
        message: codigo
    };

    const privateKey = (process.env.EMAILJS_PRIVATE_KEY && process.env.EMAILJS_PRIVATE_KEY.trim()) 
        ? process.env.EMAILJS_PRIVATE_KEY.trim() 
        : 'H5l_daPUXm0mgqmcdg_cf';

    const payload = {
        service_id: process.env.EMAILJS_SERVICE_ID || 'service_kpr1ksb',
        template_id: templateId,
        user_id: process.env.EMAILJS_PUBLIC_KEY || 'tRgcNBg8P036AeS_l',
        accessToken: privateKey,
        template_params: templateParams
    };

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`EmailJS HTTP ${response.status}: ${errText}`);
        }
        console.log(`[AUTH] E-mail com código enviado com sucesso para ${email}! Código: ${codigo}`);
    } catch (error) {
        console.error("[AUTH] Erro no envio via EmailJS:", error.message);
        console.warn(`[AUTH BACKUP] CÓDIGO DE SEGURANÇA GERADO PARA ${email}: [ ${codigo} ]`);
    }
};

export const solicitarRecuperacao = async (req, res) => {
    try {
        const { username, email: rawEmail } = req.body;
        if (!username || !rawEmail) return res.status(400).json({ error: "Usuário e E-mail são obrigatórios." });

        const email = rawEmail.trim().replace(/\.$/, '');

        // Lookup user by username and email
        const user = await getUserFromDB(username, email);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado ou e-mail não confere com o cadastro." });

        const codigo = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = bcrypt.hashSync(codigo, 10);
        const recoveryToken = jwt.sign({ email: email.toLowerCase(), otpHash }, JWT_SECRET, { expiresIn: '15m' });

        await sendCodeEmail(email, user.name, `Recuperação de Senha - Workflow [${codigo}]`, codigo, 'template_6wuyizw');
        res.status(200).json({ success: true, message: "Código de recuperação enviado com sucesso.", recoveryToken });
    } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail de recuperação: " + (error.message || "Falha interna.") });
    }
};

export const resetarSenha = async (req, res) => {
    try {
        const { username, email: rawEmail, codigo, newPass, recoveryToken } = req.body;
        if (!username || !rawEmail || !codigo || !newPass || !recoveryToken) return res.status(400).json({ error: "Todos os campos são obrigatórios." });

        const email = rawEmail.trim().replace(/\.$/, '');

        const passError = validarSenha(newPass);
        if (passError) return res.status(400).json({ error: passError });

        let decoded;
        try {
            decoded = jwt.verify(recoveryToken, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: "Sessão expirada ou código inválido." });
        }

        if (decoded.email !== email.toLowerCase()) {
            return res.status(400).json({ error: "E-mail inválido para esta sessão." });
        }

        if (!bcrypt.compareSync(codigo, decoded.otpHash)) {
            return res.status(400).json({ error: "Código inválido." });
        }

        const user = await getUserFromDB(username, email);
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado ou e-mail não confere." });
        }

        await updateUserPasswordInDB(username, newPass);

        res.status(200).json({ success: true, message: "Senha alterada com sucesso." });
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        res.status(500).json({ error: "Erro interno ao redefinir a senha: " + (error.message || "Falha interna.") });
    }
};

export const solicitarCadastro = async (req, res) => {
    try {
        const { username, email: rawEmail, nome, storeCode, setupKey, pass, birthDate, phone } = req.body;
        console.log("REQ.BODY CADASTRO:", req.body);
        if (!username || !rawEmail || !storeCode || !pass || !birthDate) {
            return res.status(400).json({ error: "Dados incompletos para o cadastro." });
        }

        const email = rawEmail.trim().replace(/\.$/, '');
        const isManagerSetup = setupKey === 'lideranca2026';

        // Validação do Prefixo
        const userUpper = username.toUpperCase().trim();
        if (!isManagerSetup && !userUpper.startsWith('9') && !userUpper.startsWith('F') && !userUpper.startsWith('T') && !userUpper.startsWith('Z')) {
            return res.status(400).json({ error: "O Login deve iniciar com 9, F, T ou Z." });
        }

        // Validação de E-mail
        if (!email.toLowerCase().includes('@')) {
            return res.status(400).json({ error: "O e-mail de cadastro deve conter '@'." });
        }

        // Validação de Idade (18 anos)
        const birthDateObj = new Date(birthDate + 'T12:00:00');
        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        if (age < 18) {
            return res.status(400).json({ error: "É necessário ter pelo menos 18 anos para se cadastrar no sistema." });
        }

        // Validação de Senha
        const passError = validarSenha(pass);
        if (passError) {
            return res.status(400).json({ error: passError });
        }

        // 1. Mapeamento da Loja (Aceita Código ID ex: LB31/K7W8, Código SAP ex: 1119/1146, Nome ou Alias)
        const matchedStore = findStore(storeCode) || findStore(req.body.storeId) || findStore(req.body.storeSap);
        if (!matchedStore && !isManagerSetup) {
            return res.status(400).json({ error: "Código da loja não identificado. Informe o ID (ex: LB31, K7W8) ou SAP (ex: 1119, 1146) válido da sua loja." });
        }

        const storeId = matchedStore ? matchedStore.id : 'DEFAULT';

        if (matchedStore) {
            console.log(`🏬 [CADASTRO] Loja identificada: ${matchedStore.name} (ID: ${matchedStore.code} | SAP: ${matchedStore.sap}) -> storeId: ${matchedStore.id}`);
            // Garante que o espaço da loja seja imediatamente reservado no banco de dados Oracle
            await ensureStoreSpaceInDB(matchedStore);
        }

        // 2. Busca se o colaborador possui cargo pré-cadastrado na base (por Nome Completo, Primeiro+Último Nome ou por Celular)
        const colabPre = await findColaboradorPreCadastro({ nome, phone, email });
        
        let role = 'VENDEDOR';
        if (colabPre) {
            role = colabPre.role;
            console.log(`✅ [CADASTRO] Colaborador Pré-Cadastrado Reconhecido: ${colabPre.nome} -> Cargo: ${colabPre.cargo} (Role: ${role})`);
        } else if (isManagerSetup) {
            role = 'GERENTE';
        }

        // Verifica se o usuário já existe globalmente
        const user = await getUserFromDB(userUpper);
        if (user) {
            return res.status(400).json({ error: "Este nome de usuário já está em uso no sistema." });
        }

        const codigo = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = bcrypt.hashSync(codigo, 10);
        const hashedPass = bcrypt.hashSync(pass, 10);
        
        const tokenPayload = {
            email: email.toLowerCase(),
            otpHash,
            userData: {
                username: userUpper,
                name: (nome || userUpper).toUpperCase().trim(),
                pass: hashedPass,
                phone: phone ? phone.replace(/\D/g, '') : null,
                birthDate,
                role,
                storeId,
                colaboradorId: colabPre ? colabPre.id : null
            }
        };

        const registrationToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

        await sendCodeEmail(email, nome, `Código de Confirmação - Workflow [${codigo}]`, codigo, 'template_1dn6s55');
        res.status(200).json({ 
            success: true, 
            message: "Código enviado para o e-mail.", 
            registrationToken,
            cargoAtribuido: role,
            colaboradorReconhecido: !!colabPre,
            nomeColaborador: colabPre?.nome || null,
            storeId,
            storeName: matchedStore?.name || null,
            storeCode: matchedStore?.code || null,
            storeSap: matchedStore?.sap || null
        });
    } catch (error) {
        console.error("Erro ao solicitar cadastro:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail de validação: " + (error.message || "Falha interna.") });
    }
};

export const efetivarCadastro = async (req, res) => {
    try {
        const { email: rawEmail, codigo, registrationToken } = req.body;
        console.log("REQ.BODY EFETIVAR:", req.body);
        if (!rawEmail || !codigo || !registrationToken) return res.status(400).json({ error: "Dados incompletos." });

        const email = rawEmail.trim().replace(/\.$/, '');

        let decoded;
        try {
            decoded = jwt.verify(registrationToken, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: "Sessão expirada ou código inválido." });
        }

        if (decoded.email !== email.toLowerCase()) {
            return res.status(400).json({ error: "E-mail inválido para esta sessão." });
        }

        if (!bcrypt.compareSync(codigo, decoded.otpHash)) {
            return res.status(400).json({ error: "Código inválido." });
        }

        const { username, storeId, role: initialRole, name, pass, phone, birthDate, colaboradorId } = decoded.userData;

        // Confirma novamente se o colaborador consta na base para garantir atribuição do cargo
        let finalRole = initialRole || 'VENDEDOR';
        let finalColabId = colaboradorId || null;
        if (!finalColabId || finalRole === 'VENDEDOR') {
            const colabCheck = await findColaboradorPreCadastro({ nome: name, phone, email: decoded.email });
            if (colabCheck) {
                finalRole = colabCheck.role;
                finalColabId = colabCheck.id;
            }
        }

        // Reserva e garante o espaço da loja no banco de dados Oracle (CONFIGURACOES e LOJAS_SISTEMA)
        const matchedStore = await ensureStoreSpaceInDB(storeId);
        const resolvedStoreId = matchedStore ? matchedStore.id : (storeId || 'uniao_osasco');

        const conn = await getOracleConnection();
        try {
            const existing = await conn.execute(`SELECT STORE_ID FROM USUARIOS WHERE USERNAME = :username`, { username });
            if (existing.rows && existing.rows.length > 0) {
                await conn.execute(`DELETE FROM USUARIOS WHERE USERNAME = :username`, { username });
            }
            await conn.execute(
                `INSERT INTO USUARIOS (USERNAME, STORE_ID, ROLE, NAME, PASS, EMAIL, PHONE, BIRTH_DATE)
                 VALUES (:username, :storeId, :role, :name, :pass, :email, :phone, :birthDate)`,
                {
                    username,
                    storeId: resolvedStoreId,
                    role: finalRole,
                    name,
                    pass,
                    email: decoded.email,
                    phone: phone || null,
                    birthDate: birthDate || null
                },
                { autoCommit: true }
            );
        } finally {
            await conn.close();
        }

        // Atualiza a tabela COLABORADORES_BASE salvando o e-mail, username e storeId do colaborador pré-cadastrado
        try {
            await vincularColaboradorAoCadastrar({
                colabId: finalColabId,
                nome: name,
                phone: phone,
                email: decoded.email,
                username: username,
                storeId: resolvedStoreId
            });
            console.log(`✅ [CADASTRO] Usuário ${username} efetivado na loja ${resolvedStoreId} com cargo ${finalRole}`);
        } catch (syncErr) {
            console.error("Aviso: Falha ao sincronizar e-mail em COLABORADORES_BASE:", syncErr);
        }

        res.status(200).json({
            success: true,
            message: "Cadastro realizado com sucesso.",
            roleAtribuido: finalRole,
            storeId: resolvedStoreId,
            storeName: matchedStore?.name || resolvedStoreId
        });
    } catch (error) {
        console.error("Erro ao efetivar cadastro:", error);
        res.status(500).json({ error: "Erro interno ao salvar o usuário." });
    }
};

/**
 * Consulta pré-cadastro por Nome ou Telefone (com retorno JWT assinado)
 * Válido para o momento de cadastro e para conferência no reset de senha
 */
export const consultarPreCadastro = async (req, res) => {
    try {
        const { nome, phone } = req.body;
        if (!nome && !phone) {
            return res.status(400).json({ error: "Informe o nome completo ou telefone para consulta." });
        }

        const colab = await findColaboradorPreCadastro({ nome, phone });
        if (!colab) {
            return res.status(200).json({ encontrado: false });
        }

        const preCadastroToken = jwt.sign(
            { 
                id: colab.id, 
                nome: colab.nome, 
                cargo: colab.cargo, 
                role: colab.role,
                numeroLimpo: colab.numeroLimpo
            }, 
            JWT_SECRET, 
            { expiresIn: '30m' }
        );

        return res.status(200).json({
            encontrado: true,
            id: colab.id,
            nome: colab.nome,
            cargo: colab.cargo,
            role: colab.role,
            numero: colab.numero,
            status: colab.status,
            token: preCadastroToken
        });
    } catch (error) {
        console.error("Erro ao consultar pré-cadastro:", error);
        res.status(500).json({ error: "Erro interno ao consultar pré-cadastro." });
    }
};

export const logout = (req, res) => {
    res.clearCookie('jwt_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ success: true, message: 'Logout realizado com sucesso.' });
};
