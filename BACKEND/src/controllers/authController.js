import { getOracleConnection } from '../config/oracle.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';


const STORES = [
    { id: 'DEFAULT', name: 'Administração Geral', code: 'DEV' },
    { id: 'uniao_osasco', name: 'UNIÃO OSASCO', code: 'AT1M' },
    { id: 'shopping_bourbon', name: 'BOURBON', code: 'LB46' },
    { id: 'shopping_butanta', name: 'BUTANTÃ', code: 'G5Z9' },
    { id: 'calcadao', name: 'CALÇADÃO OSASCO', code: 'LB32' },
    { id: 'shopping_higienopolis', name: 'HIGIENÓPOLIS', code: 'LB24' },
    { id: 'lapa', name: 'LAPA', code: 'FKJ6' },
    { id: 'shopping_villa_lobos', name: 'VILLA LOBOS', code: 'LB43' },
    { id: 'shopping_west_plaza', name: 'WEST PLAZA', code: 'LB36' },
    { id: 'shopping_raposo', name: 'SHOPPING RAPOSO', code: 'K7W8' }
];

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

const getUserFromDB = async (username, email = null, storeId = null) => {
    const conn = await getOracleConnection();
    try {
        let query = `SELECT * FROM USUARIOS WHERE USERNAME = :username`;
        let params = { username: username.toUpperCase() };

        if (storeId) {
            query += ` AND STORE_ID = :storeId`;
            params.storeId = storeId;
        }
        
        if (email) {
            query += ` AND LOWER(EMAIL) = :email`;
            params.email = email.toLowerCase();
        }

        const result = await conn.execute(query, params);
        if (result.rows.length === 0) return null;
        
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

const insertUserInDB = async (username, storeId, userData) => {
    const conn = await getOracleConnection();
    try {
        const rawPass = userData.password || userData.pass;
        const hashedPass = await bcrypt.hash(rawPass, 10);
        await conn.execute(
            `INSERT INTO USUARIOS (USERNAME, STORE_ID, ROLE, NAME, PASS, EMAIL) VALUES (:username, :storeId, :role, :name, :pass, :email)`,
            {
                username: username.toUpperCase(),
                storeId,
                role: userData.role,
                name: userData.name,
                pass: hashedPass,
                email: userData.email
            },
            { autoCommit: true }
        );
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

        const userUpper = username.toUpperCase();
        
        const user = await getUserFromDB(userUpper);

        if (!user) {
            import('fs').then(fs => fs.appendFileSync('requests.log', `FALHA LOGIN (Invalido): ${userUpper}
`)).catch(()=>{});
            return res.status(401).json({ error: "Usuário ou senha inválidos." });
        }

        // Verifica a senha
        let isMatch = false;
        
        if (user.pass && user.pass.startsWith('$2b$')) {
            // Senha está em hash Bcrypt
            isMatch = await bcrypt.compare(password, user.pass);
        } else {
            // Senha está em texto puro (legado). Verifica e faz a migração automática para Bcrypt!
            if (user.pass === password) {
                isMatch = true;
                const hashedPass = await bcrypt.hash(password, 10);
                const conn = await getOracleConnection();
                try {
                    await conn.execute(`UPDATE USUARIOS SET PASS = :newPass WHERE USERNAME = :username`, { newPass: hashedPass, username: userUpper }, { autoCommit: true });
                } catch(e) { console.error("Erro ao migrar senha para bcrypt no login:", e); }
                finally { await conn.close(); }
                user.pass = hashedPass; // Atualiza em memoria
            }
        }
        
        if (!isMatch) {
            import('fs').then(fs => fs.appendFileSync('requests.log', `FALHA LOGIN (Senha errada): ${userUpper}
`)).catch(()=>{});
            return res.status(401).json({ error: "Usuário ou senha inválidos." });
        }

        import('fs').then(fs => fs.appendFileSync('requests.log', `SUCESSO LOGIN: ${userUpper} vinculado na loja ${user.storeId}\n`)).catch(()=>{});

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
        const safeUser = { ...user };
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 horas
        });

        res.json({ success: true, user: safeUser });

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

    const payload = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams
    };

    if (process.env.EMAILJS_PRIVATE_KEY) {
        payload.accessToken = process.env.EMAILJS_PRIVATE_KEY;
    }

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }
    } catch (error) {
        console.error("Erro no EmailJS no background. CÓDIGO GERADO:", codigo);
        console.error("Detalhes do erro:", error.message);
    }
};

export const solicitarRecuperacao = async (req, res) => {
    try {
        const { username, email: rawEmail } = req.body;
        if (!username || !rawEmail) return res.status(400).json({ error: "Usuário e E-mail são obrigatórios." });

        const email = rawEmail.trim().replace(/\.$/, '');

        // Lookup user by username and email globally (storeId = null)
        const user = await getUserFromDB(username, null, false, email, null);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado ou e-mail não confere com o cadastro." });

        const codigo = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = bcrypt.hashSync(codigo, 10);
        const recoveryToken = jwt.sign({ email: email.toLowerCase(), otpHash }, JWT_SECRET, { expiresIn: '15m' });

        await sendCodeEmail(email, user.name, `Recuperação de Senha - Workflow [${codigo}]`, codigo, 'template_6wuyizw');
        res.status(200).json({ success: true, message: "Código de recuperação enviado com sucesso.", recoveryToken });
    } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail de recuperação." });
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

        const user = await getUserFromDB(username, null, false, email, null);
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        await updateUserPasswordInDB(username, newPass);

        res.status(200).json({ success: true, message: "Senha alterada com sucesso." });
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        res.status(500).json({ error: "Erro interno ao redefinir a senha." });
    }
};

export const solicitarCadastro = async (req, res) => {
    try {
        cleanExpiredOTPs();
        const { username, email: rawEmail, nome, storeCode, setupKey, pass, birthDate, phone } = req.body;
        console.log("REQ.BODY CADASTRO:", req.body);
        if (!username || !rawEmail || !storeCode || !pass || !birthDate) return res.status(400).json({ error: "Dados incompletos para o cadastro." });

        const email = rawEmail.trim().replace(/\.$/, '');

        // Validação do Prefixo
        const userUpper = username.toUpperCase();
        if (!isManagerSetup && !userUpper.startsWith('9') && !userUpper.startsWith('F') && !userUpper.startsWith('T') && !userUpper.startsWith('Z')) {
            return res.status(400).json({ error: "O Login deve iniciar com 9, F, T ou Z." });
        }

        // Validação de E-mail
        if (!email.toLowerCase().includes('@')) {
            return res.status(400).json({ error: "O e-mail de cadastro deve ser corporativo e conter '@'." });
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

        // Papel baseado na SetupKey
        const role = setupKey === 'lideranca2026' ? 'GERENTE' : 'VENDEDOR';

        // Mapeamento da Loja
        const matchedStore = STORES.find(s => s.code.toUpperCase() === storeCode.toUpperCase());
        if (role !== 'GERENTE' && !matchedStore) {
            return res.status(400).json({ error: "Código da loja inválido. Verifique com a liderança." });
        }
        
        // Se for managerSetup e ele informou um código de loja válido, joga ele na loja. Senão, vai pro DEFAULT.
        const storeId = matchedStore ? matchedStore.id : 'DEFAULT';

        // Verifica se o usuário já existe globalmente
        const user = await getUserFromDB(username, null, false, null, null);
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
                name: nome.toUpperCase(),
                pass: hashedPass,
                phone: phone ? phone.replace(/\D/g, '') : null,
                birthDate,
                role,
                storeId
            }
        };

        const registrationToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

        await sendCodeEmail(email, nome, `Código de Confirmação - Workflow [${codigo}]`, codigo, 'template_1dn6s55');
        res.status(200).json({ success: true, message: "Código enviado para o e-mail.", registrationToken });
    } catch (error) {
        console.error("Erro ao solicitar cadastro:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail de validação." });
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

        const { username, storeId, role, name, pass, phone, birthDate } = decoded.userData;

        const conn = await getOracleConnection();
        try {
            await conn.execute(
                `INSERT INTO USUARIOS (USERNAME, STORE_ID, ROLE, NAME, PASS, EMAIL, PHONE, BIRTH_DATE) VALUES (:username, :storeId, :role, :name, :pass, :email, :phone, :birthDate)`,
                {
                    username,
                    storeId,
                    role,
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

        res.status(200).json({ success: true, message: "Cadastro realizado com sucesso." });
    } catch (error) {
        console.error("Erro ao efetivar cadastro:", error);
        res.status(500).json({ error: "Erro interno ao salvar o usuário." });
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
